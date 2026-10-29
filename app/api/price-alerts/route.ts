import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ApiError, apiError, authenticate, noStoreJson } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { sellingPrice } from "@/lib/product-pricing";
import { rateLimit } from "@/lib/server/rate-limit";
import { boundedJson } from "@/lib/server/request-body";
import { cancelPriceAlertInput, priceAlertId, priceAlertInput, readPriceAlertsInput } from "@/lib/price-alerts";

const emailAvailable = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
const currency = () => process.env.PAYMENT_CURRENCY || "USD";
function publicWatch(id: string, data: Record<string, unknown>, product?: Record<string, unknown>) {
  const published = product?.status === "published";
  return {
    productId: id, productTitle: String(product?.title ?? data.productTitle ?? "Product"), productSlug: String(product?.slug ?? data.productSlug ?? ""),
    active: data.active === true, priceAtSubscription: Number(data.priceAtSubscription), targetPrice: data.targetPrice ?? null,
    currency: String(data.currency ?? currency()), emailEnabled: data.emailEnabled === true, lastNotifiedPrice: data.lastNotifiedPrice ?? null,
    createdAt: data.createdAt ?? null, currentPrice: published && (!data.currency || data.currency === currency()) ? sellingPrice({ price: Number(product.price), discount: Number(product.discount ?? 0) }) : null,
    available: published, stock: published ? Number(product.stock) : 0,
  };
}
export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`price-alerts:${user.uid}`, 120, 60_000);
    const db = adminDb();
    const collection = db.collection("users").doc(user.uid).collection("priceAlerts");
    const params = new URL(request.url).searchParams;
    const productId = params.get("productId");
    if (productId !== null) {
      priceAlertId.parse(productId);
      const snapshot = await collection.doc(productId).get();
      return noStoreJson({ active: snapshot.data()?.active === true, alert: snapshot.exists ? publicWatch(productId, snapshot.data()!) : null, emailAvailable: emailAvailable(), emailVerified: user.email_verified === true, currency: currency() });
    }
    const notificationsRef = db.collection("users").doc(user.uid).collection("notifications");
    let inboxQuery = notificationsRef.orderBy("createdAt", "desc").limit(21);
    if (params.get("notificationCursor")) {
      const cursor = await notificationsRef.doc(priceAlertId.parse(params.get("notificationCursor"))).get();
      if (!cursor.exists) throw new ApiError(400, "This notification page is no longer available.");
      inboxQuery = inboxQuery.startAfter(cursor);
    }
    const [inbox, count] = await Promise.all([
      inboxQuery.get(),
      notificationsRef.where("read", "==", false).count().get(),
    ]);
    const notifications = inbox.docs.slice(0, 20).map((doc) => ({ id: doc.id, ...doc.data() }));
    const nextNotificationCursor = inbox.size > 20 ? inbox.docs[19].id : null;
    if (params.get("inbox") === "1") return noStoreJson({ notifications, unreadCount: count.data().count, nextNotificationCursor });
    let query = collection.orderBy("updatedAt", "desc").limit(20);
    if (params.get("cursor")) {
      const cursor = await collection.doc(priceAlertId.parse(params.get("cursor"))).get();
      if (!cursor.exists) throw new ApiError(400, "This page is no longer available. Refresh your alerts.");
      query = query.startAfter(cursor);
    }
    const snapshot = await query.get();
    const productDocs = snapshot.empty ? [] : await db.getAll(...snapshot.docs.map((doc) => db.collection("products").doc(doc.id)));
    const alerts = snapshot.docs.map((doc, index) => publicWatch(doc.id, doc.data(), productDocs[index]?.data()));
    return noStoreJson({ alerts, notifications, nextNotificationCursor, unreadCount: count.data().count, nextCursor: snapshot.size === 20 ? snapshot.docs.at(-1)!.id : null, emailAvailable: emailAvailable(), emailVerified: user.email_verified === true, currency: currency() });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`price-alert-save:${user.uid}`, 30, 60 * 60_000);
    const input = priceAlertInput.parse(await boundedJson(request, 2048));
    if (input.emailEnabled && (!user.email || !user.email_verified)) throw new ApiError(400, "Verify your email address before enabling email alerts.", "email_not_verified");
    if (input.emailEnabled && !emailAvailable()) throw new ApiError(503, "Email alerts are unavailable. You can still receive alerts in your account.", "email_unavailable");
    const db = adminDb();
    const productRef = db.collection("products").doc(input.productId);
    const ref = db.collection("users").doc(user.uid).collection("priceAlerts").doc(input.productId);
    const alert = await db.runTransaction(async (tx) => {
      const [productSnapshot, existing] = await tx.getAll(productRef, ref);
      const product = productSnapshot.data();
      if (!productSnapshot.exists || product?.status !== "published") throw new ApiError(404, "Product not found", "not_found");
      const currentPrice = sellingPrice({ price: Number(product.price), discount: Number(product.discount ?? 0) });
      if (!Number.isFinite(currentPrice) || currentPrice < 0) throw new ApiError(409, "This product's price is unavailable.");
      const data = existing.data();
      const continuing = data?.active === true && (!data.currency || data.currency === currency()) && (data.targetPrice ?? null) === input.targetPrice;
      if (input.targetPrice != null && input.targetPrice >= currentPrice && !(continuing && data.targetPrice === input.targetPrice)) throw new ApiError(400, "Choose a target below the current price.", "invalid_target");
      const now = new Date().toISOString();
      const watch = {
        productId: input.productId, productTitle: String(product.title ?? "Product"), productSlug: String(product.slug ?? ""), userId: user.uid,
        currency: currency(), active: true, targetPrice: input.targetPrice,
        priceAtSubscription: continuing ? data.priceAtSubscription : currentPrice,
        lastNotifiedPrice: continuing ? data.lastNotifiedPrice ?? null : null,
        watchVersion: continuing ? data.watchVersion ?? data.createdAt ?? randomUUID() : randomUUID(),
        emailEnabled: input.emailEnabled, emailVerified: user.email_verified === true, email: input.emailEnabled ? user.email : null,
        createdAt: continuing ? data.createdAt ?? now : now, updatedAt: now,
      };
      tx.set(ref, watch, { merge: true });
      return publicWatch(ref.id, watch, product);
    });
    return noStoreJson({ active: true, alert }, { status: 201 });
  } catch (error) { return apiError(error); }
}
export async function DELETE(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`price-alert-delete:${user.uid}`, 60, 60_000);
    const { productId } = cancelPriceAlertInput.parse(await boundedJson(request, 2048));
    const ref = adminDb().collection("users").doc(user.uid).collection("priceAlerts").doc(productId);
    await adminDb().runTransaction(async (tx) => {
      const snapshot = await tx.get(ref);
      if (snapshot.exists) tx.update(ref, { active: false, updatedAt: new Date().toISOString() });
    });
    return new NextResponse(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return apiError(error); }
}
export async function PATCH(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`price-alert-read:${user.uid}`, 60, 60_000);
    const { notificationIds } = readPriceAlertsInput.parse(await boundedJson(request, 8192));
    const db = adminDb();
    const refs = [...new Set(notificationIds)].map((id) => db.collection("users").doc(user.uid).collection("notifications").doc(id));
    const snapshots = await db.getAll(...refs);
    const batch = db.batch();
    snapshots.filter((snapshot) => snapshot.exists).forEach((snapshot) => batch.update(snapshot.ref, { read: true }));
    await batch.commit();
    return noStoreJson({ updated: snapshots.filter((snapshot) => snapshot.exists).length });
  } catch (error) { return apiError(error); }
}
