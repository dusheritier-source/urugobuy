import { z } from "zod";
import type { ModelResponse, ModelTransport } from "./core";

export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash-lite";
export const GEMINI_FREE_MODELS = [GEMINI_DEFAULT_MODEL, "gemini-3.1-flash-lite"] as const;
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const FINAL_TOOL = "respond_to_shopper";
const toolCallSchema = z.object({
  id: z.string().min(1), type: z.literal("function"),
  function: z.object({ name: z.string(), arguments: z.string() }).passthrough(),
}).passthrough();
const completionSchema = z.object({
  choices: z.array(z.object({
    finish_reason: z.string().nullable(),
    message: z.object({ content: z.string().nullable().optional(), tool_calls: z.array(toolCallSchema).optional() }).passthrough(),
  })).min(1),
  usage: z.object({ prompt_tokens: z.number(), completion_tokens: z.number() }).optional(),
});
export class GeminiFailure extends Error {
  status: number;
  constructor(status: number) { super("Gemini request failed"); this.status = status; }
}

// Keep the existing provider-independent tool loop; translate only the wire format.
// The final answer is a function result schema so it can be combined with tool use
// without relying on mixed JSON-mode/function-calling support in older models.
export function geminiRequest(body: Record<string, unknown>, model: string) {
  const messages: Array<Record<string, unknown>> = [{ role: "system", content: String(body.instructions) + "\nWhen ready to answer, call respond_to_shopper with the final verified reply. Do not call it together with other tools." }];
  for (const item of body.input as Array<Record<string, unknown>>) {
    if (item.role === "user" || item.role === "assistant") {
      messages.push({ role: item.role, content: item.content });
    } else if (item.type === "function_call") {
      const call = item.providerToolCall ?? { id: item.call_id, type: "function", function: { name: item.name, arguments: item.arguments } };
      const previous = messages.at(-1);
      if (previous?.role === "assistant" && Array.isArray(previous.tool_calls)) previous.tool_calls.push(call);
      else messages.push({ role: "assistant", content: null, tool_calls: [call] });
    } else if (item.type === "function_call_output") {
      messages.push({ role: "tool", tool_call_id: item.call_id, content: item.output });
    }
  }
  const format = body.text as { format: { schema: Record<string, unknown> } };
  const finalTool = { type: "function", function: { name: FINAL_TOOL, description: "Return the final shopper-facing reply after verifying facts. This displays a reply and does not perform a purchase.", parameters: format.format.schema } };
  const onlyFinal = body.tool_choice === "none";
  const tools = onlyFinal ? [finalTool] : [
    ...(body.tools as Array<{ name: string; description: string; parameters: unknown }>).map((tool) => ({ type: "function", function: { name: tool.name, description: tool.description, parameters: tool.parameters } })),
    finalTool,
  ];
  return {
    model, messages, tools, parallel_tool_calls: false,
    tool_choice: onlyFinal ? { type: "function", function: { name: FINAL_TOOL } } : "required",
    max_tokens: body.max_output_tokens,
    ...(model.startsWith("gemini-2.5") ? { reasoning_effort: "none" } : { reasoning_effort: "minimal" }),
  };
}

export function geminiResponse(value: unknown): ModelResponse {
  const parsed = completionSchema.parse(value);
  const choice = parsed.choices[0];
  const calls = choice.message.tool_calls ?? [];
  const final = calls.find((call) => call.function.name === FINAL_TOOL);
  const usage = parsed.usage ? { input_tokens: parsed.usage.prompt_tokens, output_tokens: parsed.usage.completion_tokens } : undefined;
  if (choice.finish_reason !== "stop" && choice.finish_reason !== "tool_calls") return { status: "incomplete", output: [], usage };
  if (final) {
    if (calls.length !== 1) throw new Error("Mixed final reply and data tool calls");
    return { status: "completed", output: [], output_text: final.function.arguments, usage };
  }
  if (calls.length) return {
    status: "completed", usage,
    output: calls.map((call) => ({ type: "function_call", name: call.function.name, arguments: call.function.arguments, call_id: call.id, providerToolCall: call })),
  };
  // A valid structured text response can still be validated by the core parser.
  return { status: "completed", output: [], output_text: choice.message.content ?? "", usage };
}

export function createGeminiTransport(apiKey: string, model = GEMINI_DEFAULT_MODEL, fetcher: typeof fetch = fetch): ModelTransport {
  if (!(GEMINI_FREE_MODELS as readonly string[]).includes(model)) throw new Error("Select a supported free-tier Gemini model.");
  return async (body, signal) => {
    signal?.throwIfAborted();
    const response = await fetcher(ENDPOINT, {
      method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(geminiRequest(body, model)), signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(20_000)]),
      redirect: "error",
    });
    // Never expose the provider error body: it may include request details.
    if (!response.ok) throw new GeminiFailure(response.status);
    return geminiResponse(await response.json());
  };
}
