import "server-only";
import { createGeminiTransport, GEMINI_DEFAULT_MODEL, GEMINI_FREE_MODELS, GeminiFailure } from "@/lib/assistant/gemini";
import { runAssistant, type AssistantRequest, AssistantFailure } from "@/lib/assistant/core";
import { ApiError, authenticate } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { hasServerCatalog, publishedProducts } from "@/lib/server/catalog";
import { searchProducts } from "@/lib/search";
import { STORE_POLICIES } from "@/lib/store-policies";
import { orderTotals } from "@/lib/order-pricing";

let active = 0;
let day = "";
let requestsToday = 0;
const positiveInt = (value: string | undefined, fallback: number) => value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : fallback;
export function assistantConfigured() { return Boolean(process.env.GEMINI_API_KEY?.trim()) && (GEMINI_FREE_MODELS as readonly string[]).includes(process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL); }
export async function shoppingAssistant(input: AssistantRequest, request: Request) {
  if (!assistantConfigured()) throw new ApiError(503, "The shopping assistant is being set up. Please use product search or contact support for now.", "assistant_not_configured");
  if (active >= 3) throw new ApiError(503, "The assistant is busy. Please try again shortly.", "assistant_busy");
  const today = new Date().toISOString().slice(0, 10);
  if (day !== today) { day = today; requestsToday = 0; }
  if (requestsToday >= positiveInt(process.env.ASSISTANT_DAILY_REQUEST_LIMIT, 300)) throw new ApiError(429, "The assistant has reached today's usage limit. Please use product search or contact support.", "assistant_daily_limit");
  active++;
  const started = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;
  try {
    if (hasServerCatalog()) {
      const ref = adminDb().collection("assistantUsage").doc(today);
      await adminDb().runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        const count = Number(snapshot.data()?.requests ?? 0);
        if (count >= positiveInt(process.env.ASSISTANT_DAILY_REQUEST_LIMIT, 300)) throw new ApiError(429, "The assistant has reached today's usage limit. Please use product search or contact support.", "assistant_daily_limit");
        transaction.set(ref, { requests: count + 1, updatedAt: new Date().toISOString() }, { merge: true });
      });
    }
    requestsToday++;
    const user = request.headers.has("authorization") ? await authenticate(request) : null;
    const products = await publishedProducts({ fresh: true });
    const transport = createGeminiTransport(process.env.GEMINI_API_KEY!, process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL);
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(65_000)]);
    const result = await runAssistant(input, {
      products, currency: process.env.PAYMENT_CURRENCY || "USD", userId: user?.uid ?? null, orderLookup: "account_only",
      rankProducts: (catalog, query) => searchProducts(catalog, query, { limit: catalog.length }).map((match) => match.product),
      policy: (topic) => ({ ...STORE_POLICIES[topic], text: STORE_POLICIES[topic].text.replaceAll("catalog currency", process.env.PAYMENT_CURRENCY || "USD") }),
      delivery: orderTotals,
      getOrder: async () => null,
    }, async (body, callSignal) => {
      const response = await transport(body, callSignal);
      inputTokens += response.usage?.input_tokens ?? 0;
      outputTokens += response.usage?.output_tokens ?? 0;
      return response;
    }, signal);
    return result;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof GeminiFailure && error.status === 429) throw new ApiError(429, "The free AI quota is temporarily exhausted. Please try again later or use product search.", "assistant_free_quota");
    if (error instanceof AssistantFailure) throw new ApiError(502, error.message, error.code);
    // Do not log SDK exceptions: they can contain conversation or request content.
    throw new ApiError(503, "The assistant could not connect right now. Please try again shortly.", "assistant_unavailable");
  } finally {
    active--;
    process.stdout.write(JSON.stringify({ event: "assistant_usage", model: process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL, inputTokens, outputTokens, elapsedMs: Date.now() - started }) + "\n");
  }
}
