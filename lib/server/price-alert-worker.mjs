import { createHash, randomUUID } from "node:crypto";
import { FieldPath } from "firebase-admin/firestore";
import { eligiblePriceDrop } from "../price-alerts.ts";

// A product update and its pending event are committed together. This worker can
// retry pages safely: each watcher is updated with its new low in the same
// transaction as its private notification and optional email outbox record.
export async function processPriceAlertEvent(db, eventId, pageSize = 100) {
  const eventRef = db.collection("priceAlertEvents").doc(eventId);
  const owner = randomUUID();
  const claimed = await db.runTransaction(async (tx) => {
    const snapshot = await tx.get(eventRef);
    const data = snapshot.data();
    if (!snapshot.exists || data.status === "done" || (data.leaseUntil > Date.now() && data.status === "processing")) return null;
    tx.update(eventRef, { status: "processing", owner, leaseUntil: Date.now() + 90_000, attempts: Number(data.attempts ?? 0) + 1 });
    return data;
  });
  if (!claimed) return { scanned: 0, notified: 0, complete: false };
  try {
    let query = db.collectionGroup("priceAlerts").where("productId", "==", claimed.productId).where("active", "==", true).orderBy(FieldPath.documentId()).limit(pageSize);
    if (claimed.cursor) query = query.startAfter(db.doc(claimed.cursor));
    const subscriptions = await query.get();
    let notified = 0;
    for (const subscription of subscriptions.docs) {
      const userRef = subscription.ref.parent.parent;
      if (!userRef || userRef.path !== `users/${userRef.id}`) continue;
      const changed = await db.runTransaction(async (tx) => {
        const productRef = db.collection("products").doc(claimed.productId);
        const [watchSnapshot, productSnapshot] = await tx.getAll(subscription.ref, productRef);
        if (!watchSnapshot.exists || !productSnapshot.exists) return false;
        const watch = watchSnapshot.data();
        const product = productSnapshot.data();
        const drop = eligiblePriceDrop(watch, product, claimed.currency);
        if (!drop) return false;
        const version = watch.watchVersion ?? watch.createdAt ?? "legacy";
        const id = createHash("sha256").update(`${eventId}:${subscription.ref.path}:${version}`).digest("hex");
        const notificationRef = userRef.collection("notifications").doc(id);
        if ((await tx.get(notificationRef)).exists) return false;
        const now = new Date().toISOString();
        const payload = {
          type: "price_drop", productId: claimed.productId, productTitle: String(product.title ?? "Product"), productSlug: String(product.slug ?? claimed.productId),
          ...drop, currency: claimed.currency, createdAt: now,
        };
        tx.create(notificationRef, { ...payload, read: false });
        if (watch.emailEnabled === true && watch.emailVerified === true && typeof watch.email === "string" && watch.email.includes("@")) {
          tx.create(db.collection("notificationQueue").doc(`price_${id}`), { ...payload, userId: userRef.id, email: watch.email, watchVersion: version, status: "pending" });
        }
        tx.update(subscription.ref, { lastNotifiedPrice: drop.newPrice, lastNotifiedAt: now, lastNotificationId: id, updatedAt: now });
        return true;
      });
      if (changed) notified++;
    }
    const complete = subscriptions.size < pageSize;
    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(eventRef);
      if (snapshot.data()?.owner !== owner) return;
      tx.update(eventRef, {
        status: complete ? "done" : "pending", leaseUntil: 0,
        cursor: subscriptions.docs.at(-1)?.ref.path ?? claimed.cursor ?? null,
        processed: Number(snapshot.data().processed ?? 0) + subscriptions.size,
        notified: Number(snapshot.data().notified ?? 0) + notified,
        updatedAt: new Date().toISOString(),
      });
    });
    return { scanned: subscriptions.size, notified, complete };
  } catch (error) {
    await db.runTransaction(async (tx) => {
      const snapshot = await tx.get(eventRef);
      if (snapshot.data()?.owner === owner) tx.update(eventRef, { status: "pending", leaseUntil: 0, lastError: "Processing failed; retry pending", updatedAt: new Date().toISOString() });
    });
    throw error;
  }
}
