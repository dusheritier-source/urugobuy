import { sellingPrice } from "@/lib/product-pricing";
import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { sendEmailJob } from "@/lib/server/email";

function authorized(request: Request) {
  const expected = process.env.EMAIL_JOB_SECRET;
  const provided = request.headers.get("x-job-secret") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !provided) return false;
  const left = Buffer.from(expected); const right = Buffer.from(provided);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const db = adminDb();
    const snapshot = await db.collection("notificationQueue").where("status", "==", "pending").limit(25).get();
    const results = [];
    for (const document of snapshot.docs) {
      const queuedData = document.data();
      if (queuedData.type === "newsletter_campaign" && queuedData.campaignId) {
        const campaign = await db.collection("emailCampaigns").doc(String(queuedData.campaignId)).get();
        if (campaign.data()?.status !== "queued") {
          if (campaign.data()?.status === "failed") {
            await document.ref.update({ status: "skipped", skippedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            results.push({ id: document.id, status: "skipped" });
          }
          continue;
        }
      }
      const claimed = await db.runTransaction(async (transaction) => {
        const current = await transaction.get(document.ref);
        if (!current.exists || current.data()?.status !== "pending") return false;
        transaction.update(document.ref, { status: "processing", processingAt: new Date().toISOString(), attempts: Number(current.data()?.attempts ?? 0) + 1 });
        return true;
      });
      if (!claimed) continue;
      try {
        const data = document.data();
        if (!data.email) throw new Error("Notification has no recipient email");
        if (data.type === "price_drop") {
          const watch = await db.collection("users").doc(String(data.userId)).collection("priceAlerts").doc(String(data.productId)).get();
          if (watch.data()?.active !== true || watch.data()?.emailEnabled !== true || watch.data()?.watchVersion !== data.watchVersion || (watch.data()?.targetPrice != null && Number(data.newPrice) > Number(watch.data()?.targetPrice))) {
            await document.ref.update({ status: "skipped", skippedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            results.push({ id: document.id, status: "skipped" });
            continue;
          }
        }
        if (data.type === "newsletter_campaign") {
          const preference = await db.collection("users").doc(String(data.userId)).collection("emailPreferences").doc("marketing").get();
          if (preference.data()?.newsletter !== true || preference.data()?.emailVerified !== true) {
            await document.ref.update({ status: "skipped", skippedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            results.push({ id: document.id, status: "skipped" });
            continue;
          }
        }
        if (data.type === "price_drop") {
          const snapshot = await db.collection("products").doc(String(data.productId)).get();
          const product = snapshot.data();
          if (product?.status !== "published" || Number(product.stock) < 1 || sellingPrice({ price: Number(product.price), discount: Number(product.discount ?? 0) }) > Number(data.newPrice)) {
            await document.ref.update({ status: "skipped", skippedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
            results.push({ id: document.id, status: "skipped" });
            continue;
          }
        }
        const suppressionId = createHash("sha256").update(String(data.email).toLowerCase()).digest("hex");
        if ((await db.collection("emailSuppressions").doc(suppressionId).get()).exists) throw new Error("Recipient is suppressed after a bounce or complaint");
        const providerMessageId = await sendEmailJob(document.id, data as Parameters<typeof sendEmailJob>[1]);
        await document.ref.update({ status: "sent", providerMessageId, sentAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        results.push({ id: document.id, status: "sent" });
      } catch (error) {
        await document.ref.update({ status: "failed", error: error instanceof Error ? error.message.slice(0, 500) : "Unknown error", failedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        results.push({ id: document.id, status: "failed" });
      }
    }
    return NextResponse.json({ processed: results.length, results });
  } catch (error) { return apiError(error); }
}
