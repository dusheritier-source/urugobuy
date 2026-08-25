import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import type { DocumentReference } from "firebase-admin/firestore";
import { ApiError, apiError, authenticate, noStoreJson } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { createOrderSchema } from "@/lib/server/schemas";

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`orders:${user.uid}`, 60, 60_000);
    const collection = adminDb().collection("orders");
    const snapshot = user.staff === true || user.admin === true
      ? await collection.limit(100).get()
      : await collection.where("customerId", "==", user.uid).limit(100).get();
    const orders = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as { id: string; createdAt?: string; [key: string]: unknown })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return noStoreJson({ orders });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`order-create:${user.uid}`, 10, 10 * 60_000);
    const input = createOrderSchema.parse(await request.json());
    const db = adminDb();
    const orderRef = db.collection("orders").doc();

    const result = await db.runTransaction(async (transaction) => {
      const existingQuery = db.collection("orders")
        .where("customerId", "==", user.uid)
        .where("idempotencyKey", "==", input.idempotencyKey)
        .limit(1);
      const existing = await transaction.get(existingQuery);
      if (!existing.empty) return { id: existing.docs[0].id, ...existing.docs[0].data(), duplicate: true };

      const productRefs = input.lines.map((line) => db.collection("products").doc(line.productId));
      const productSnapshots = await transaction.getAll(...productRefs);
      const lines = input.lines.map((requested, index) => {
        const snapshot = productSnapshots[index];
        if (!snapshot.exists) throw new ApiError(409, "A product in your cart is no longer available", "product_unavailable");
        const product = snapshot.data()!;
        if (product.status !== "published" || !Number.isInteger(product.stock) || product.stock < requested.quantity) {
          throw new ApiError(409, `${product.title ?? "A product"} does not have enough stock`, "insufficient_stock");
        }
        const price = Number(product.price);
        const discountRate = Math.min(100, Math.max(0, Number(product.discount) || 0));
        const unitPrice = money(price * (1 - discountRate / 100));
        return {
          id: snapshot.id,
          slug: product.slug,
          title: product.title,
          images: product.images ?? [],
          price,
          discount: discountRate,
          quantity: requested.quantity,
          unitPrice,
        };
      });

      const subtotal = money(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0));
      let discount = 0;
      let promotionRef: DocumentReference | undefined;
      if (input.coupon) {
        const promotionQuery = db.collection("promotions").where("code", "==", input.coupon.toUpperCase()).where("active", "==", true).limit(1);
        const promotionSnapshot = await transaction.get(promotionQuery);
        const promotionDoc = promotionSnapshot.docs[0];
        const promotion = promotionDoc?.data();
        const now = Date.now();
        const eligible = promotion
          && promotion.uses < promotion.usageLimit
          && subtotal >= promotion.minimum
          && now >= Date.parse(promotion.startsAt)
          && now <= Date.parse(promotion.endsAt);
        if (!eligible) throw new ApiError(409, "The promotion is invalid or no longer available", "invalid_promotion");
        discount = money(promotion.kind === "percentage" ? subtotal * promotion.value / 100 : Math.min(subtotal, promotion.value));
        promotionRef = promotionDoc.ref;
      }

      const discountedSubtotal = money(subtotal - discount);
      const shipping = input.shippingMethod === "express" ? 30 : input.shippingMethod === "pickup" || discountedSubtotal >= 100 ? 0 : 15;
      const tax = money(discountedSubtotal * 0.18);
      const total = money(discountedSubtotal + shipping + tax);
      const now = new Date().toISOString();
      const order = {
        id: orderRef.id,
        orderNumber: `UR-${Date.now().toString().slice(-8)}-${orderRef.id.slice(0, 4).toUpperCase()}`,
        idempotencyKey: input.idempotencyKey,
        customerId: user.uid,
        createdAt: now,
        updatedAt: now,
        status: "pending",
        paymentStatus: "pending",
        paymentMethod: input.paymentMethod,
        address: input.address,
        shippingMethod: input.shippingMethod,
        lines,
        subtotal,
        discount,
        tax,
        shipping,
        total,
        ...(input.coupon ? { coupon: input.coupon.toUpperCase() } : {}),
        ...(input.note ? { note: input.note } : {}),
      };

      input.lines.forEach((line, index) => {
        transaction.update(productRefs[index], { stock: productSnapshots[index].data()!.stock - line.quantity, updatedAt: now });
      });
      if (promotionRef) transaction.update(promotionRef, { uses: FieldValue.increment(1), updatedAt: now });
      transaction.create(orderRef, order);
      transaction.set(db.collection("notificationQueue").doc(`order_created_${orderRef.id}`), {
        type: "order_created", orderId: orderRef.id, orderNumber: order.orderNumber,
        userId: user.uid, email: input.address.email, status: order.status,
        total: order.total, currency: process.env.PAYMENT_CURRENCY ?? "USD",
        createdAt: now,
      });
      return order;
    });

    return NextResponse.json({ order: result }, { status: "duplicate" in result ? 200 : 201 });
  } catch (error) {
    return apiError(error);
  }
}
