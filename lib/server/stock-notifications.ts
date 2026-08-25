import "server-only";

import { adminDb } from "@/lib/server/firebase-admin";

export async function queueBackInStockNotifications(productId: string, productTitle: string, productSlug?: string) {
  const db = adminDb();
  const subscriptions = await db.collectionGroup("backInStock")
    .where("productId", "==", productId)
    .where("active", "==", true)
    .limit(400)
    .get();
  if (subscriptions.empty) return 0;

  const now = new Date().toISOString();
  const batch = db.batch();
  subscriptions.docs.forEach((subscription) => {
    const data = subscription.data();
    const queueRef = db.collection("notificationQueue").doc();
    batch.create(queueRef, {
      type: "back_in_stock",
      productId,
      productTitle,
      productSlug: productSlug ?? null,
      userId: data.userId,
      email: data.email ?? null,
      status: "pending",
      createdAt: now,
    });
    batch.update(subscription.ref, { active: false, queuedAt: now, updatedAt: now });
  });
  await batch.commit();
  return subscriptions.size;
}
