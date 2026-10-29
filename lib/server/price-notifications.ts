import "server-only";
import { adminDb } from "@/lib/server/firebase-admin";
import { processPriceAlertEvent } from "./price-alert-worker.mjs";

export async function processPriceDropNotifications(eventId: string) {
  return processPriceAlertEvent(adminDb(), eventId);
}
export async function processPendingPriceDropEvents() {
  const db = adminDb();
  const pending = await db.collection("priceAlertEvents").where("status", "==", "pending").orderBy("createdAt", "asc").limit(10).get();
  const expired = await db.collection("priceAlertEvents").where("status", "==", "processing").where("leaseUntil", "<=", Date.now()).limit(10).get();
  const results = [];
  for (const event of [...expired.docs, ...pending.docs].slice(0, 10)) {
    try { results.push({ id: event.id, ...await processPriceAlertEvent(db, event.id) }); }
    catch { results.push({ id: event.id, error: "Retry pending" }); }
  }
  return results;
}
