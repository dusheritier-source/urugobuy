import { timingSafeEqual } from "node:crypto";
import { apiError, noStoreJson } from "@/lib/server/api";
import { processPendingPriceDropEvents } from "@/lib/server/price-notifications";

export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(request: Request) {
  const expected = process.env.PRICE_ALERT_JOB_SECRET || process.env.EMAIL_JOB_SECRET;
  const provided = request.headers.get("x-job-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided || Buffer.byteLength(expected) !== Buffer.byteLength(provided) || !timingSafeEqual(Buffer.from(expected), Buffer.from(provided))) return noStoreJson({ error: "Unauthorized" }, { status: 401 });
  try { return noStoreJson({ results: await processPendingPriceDropEvents() }); }
  catch (error) { return apiError(error); }
}
