import test from "node:test";
import assert from "node:assert/strict";
import { createGeminiTransport, geminiRequest, geminiResponse, GEMINI_DEFAULT_MODEL } from "../lib/assistant/gemini.ts";
import { runAssistant, requestSchema } from "../lib/assistant/core.ts";

const format = { format: { schema: { type: "object", properties: { message: { type: "string" } }, required: ["message"] } } };
const body = { instructions: "Use verified facts", input: [{ role: "user", content: "Find a product" }], tools: [{ name: "get_products", description: "Get real products", parameters: { type: "object" } }], text: format, max_output_tokens: 1200, tool_choice: "auto", store: false };
const completion = (toolCalls, extra = {}) => ({ choices: [{ finish_reason: "tool_calls", message: { role: "assistant", content: null, tool_calls: toolCalls } }], usage: { prompt_tokens: 20, completion_tokens: 10 }, ...extra });
const call = (name, args, extra = {}) => ({ id: "call-1", type: "function", function: { name, arguments: JSON.stringify(args) }, ...extra });
const reply = { message: "Here are the verified options.", productIds: [], comparison: false, suggestedQuestions: [] };

test("Gemini request uses the free-eligible default and schema-based final reply tool", () => {
  const request = geminiRequest(body, GEMINI_DEFAULT_MODEL);
  assert.equal(request.model, "gemini-2.5-flash-lite");
  assert.equal(request.reasoning_effort, "none");
  assert.equal(request.tools.at(-1).function.name, "respond_to_shopper");
  assert.equal(request.tool_choice, "required");
  assert.equal("response_format" in request, false);
  assert.equal("store" in request, false);
});

test("final turn permits only the final reply function", () => {
  const request = geminiRequest({ ...body, tool_choice: "none" }, GEMINI_DEFAULT_MODEL);
  assert.equal(request.tools.length, 1);
  assert.equal(request.tool_choice.function.name, "respond_to_shopper");
});

test("provider tool IDs and opaque metadata survive the multi-turn round trip", () => {
  const original = call("get_products", { productIds: ["a"] }, { extra_content: { google: { thought_signature: "opaque-provider-metadata" } } });
  const parsed = geminiResponse(completion([original]));
  assert.equal(parsed.output[0].call_id, "call-1");
  const request = geminiRequest({ ...body, input: [...body.input, ...parsed.output, { type: "function_call_output", call_id: "call-1", output: '{"products":[]}' }] }, GEMINI_DEFAULT_MODEL);
  assert.deepEqual(request.messages[2].tool_calls[0], original);
  assert.deepEqual(request.messages[3], { role: "tool", tool_call_id: "call-1", content: '{"products":[]}' });
  assert.equal(parsed.usage.input_tokens, 20);
});

test("multiple data calls remain grouped in a single assistant message", () => {
  const parsed = geminiResponse(completion([call("get_products", {}), { ...call("store_policy", {}), id: "call-2" }]));
  const request = geminiRequest({ ...body, input: [...body.input, ...parsed.output] }, GEMINI_DEFAULT_MODEL);
  assert.equal(request.messages.length, 3);
  assert.equal(request.messages[2].tool_calls.length, 2);
});

test("final replies become validated-core JSON; mixed final and data calls are rejected", () => {
  const parsed = geminiResponse(completion([call("respond_to_shopper", reply)]));
  assert.deepEqual(JSON.parse(parsed.output_text), reply);
  assert.equal(parsed.output.length, 0);
  assert.throws(() => geminiResponse(completion([call("respond_to_shopper", reply), call("get_products", {})])), /Mixed/);
});

test("blocked or truncated provider responses are incomplete", () => {
  assert.equal(geminiResponse({ choices: [{ finish_reason: "length", message: { content: "truncated" } }] }).status, "incomplete");
  assert.equal(geminiResponse({ choices: [{ finish_reason: "content_filter", message: { content: "" } }] }).status, "incomplete");
});

test("transport calls only Google's endpoint and never places credentials in the URL or request body", async () => {
  let seen;
  const transport = createGeminiTransport("unit-test-placeholder", undefined, async (url, options) => {
    seen = { url, options };
    return new Response(JSON.stringify(completion([call("respond_to_shopper", reply)])), { headers: { "Content-Type": "application/json" } });
  });
  const response = await transport(body);
  assert.equal(seen.url, "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions");
  assert.equal(seen.options.headers.Authorization, "Bearer unit-test-placeholder");
  assert.equal(seen.options.body.includes("unit-test-placeholder"), false);
  assert.equal(seen.options.redirect, "error");
  assert.equal(response.output_text, JSON.stringify(reply));
});

test("quota errors expose only a status and never retry against a paid provider", async () => {
  let calls = 0;
  const transport = createGeminiTransport("unit-test-placeholder", undefined, async () => {
    calls++;
    return new Response('{"error":{"message":"private echoed request"}}', { status: 429 });
  });
  await assert.rejects(transport(body), (error) => error.status === 429 && !error.message.includes("private"));
  assert.equal(calls, 1);
  assert.throws(() => createGeminiTransport("unit-test-placeholder", "paid-model"), /free-tier/);
});

test("account-only mode never reads orders or sends private status to the provider", async () => {
  let reads = 0;
  const requests = [];
  const responses = [
    { status: "completed", output: [{ type: "function_call", call_id: "order", name: "get_order", arguments: '{"orderId":"order-1"}' }] },
    { status: "completed", output: [], output_text: JSON.stringify({ ...reply, message: "Open your secure account for order status." }) },
  ];
  const response = await runAssistant(requestSchema.parse({ messages: [{ role: "user", content: "Where is my order?" }] }), {
    products: [], currency: "USD", userId: "signed-in-user", orderLookup: "account_only",
    rankProducts: (products) => products, policy: () => ({ title: "Policy", path: "/contact", text: "Contact us" }), delivery: () => ({}),
    getOrder: async () => { reads++; return { status: "private-status", customerId: "signed-in-user" }; },
  }, async (request) => { requests.push(structuredClone(request)); return responses.shift(); });
  assert.equal(reads, 0);
  assert.equal(JSON.stringify(requests).includes("private-status"), false);
  assert.equal(response.sources[0].path, "/profile");
});
