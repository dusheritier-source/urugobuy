import { apiError, clientAddress, noStoreJson } from "@/lib/server/api";
import { assistantConfigured, shoppingAssistant } from "@/lib/server/assistant";
import { rateLimit } from "@/lib/server/rate-limit";
import { boundedJson } from "@/lib/server/request-body";
import { requestSchema } from "@/lib/assistant/core";

export const runtime = "nodejs";
export const maxDuration = 90;
export async function GET() { return noStoreJson({ available: assistantConfigured() }); }
export async function POST(request: Request) {
  try {
    rateLimit(`assistant-minute:${clientAddress(request)}`, 8, 60_000);
    rateLimit(`assistant-day:${clientAddress(request)}`, 60, 24 * 60 * 60_000);
    const input = requestSchema.parse(await boundedJson(request));
    return noStoreJson(await shoppingAssistant(input, request));
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
