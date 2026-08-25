import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { ApiError, apiError, authenticate } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { createHostedPayment } from "@/lib/server/flutterwave";
import { rateLimit } from "@/lib/server/rate-limit";
import { z } from "zod";

const schema = z.object({ orderId: z.string().trim().min(1).max(128) });

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`payment-init:${user.uid}`, 10, 10 * 60_000);
    const { orderId } = schema.parse(await request.json());
    const db = adminDb();
    const orderRef = db.collection("orders").doc(orderId);
    const paymentRef = db.collection("payments").doc(orderId);
    const currency = process.env.PAYMENT_CURRENCY?.toUpperCase();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!currency || !/^[A-Z]{3}$/.test(currency) || !siteUrl) throw new ApiError(503, "Payment currency or site URL is not configured", "payments_unavailable");

    const reservation = await db.runTransaction(async (transaction) => {
      const [orderDoc, paymentDoc] = await transaction.getAll(orderRef, paymentRef);
      if (!orderDoc.exists) throw new ApiError(404, "Order not found", "not_found");
      const order = orderDoc.data()!;
      if (order.customerId !== user.uid) throw new ApiError(404, "Order not found", "not_found");
      if (!["card", "mobile_money"].includes(order.paymentMethod)) throw new ApiError(409, "This order does not require online payment", "payment_not_required");
      if (order.paymentStatus === "paid") throw new ApiError(409, "This order is already paid", "already_paid");
      const existing = paymentDoc.data();
      if (existing?.status === "pending" && existing.checkoutUrl) return { existing: true as const, checkoutUrl: String(existing.checkoutUrl) };
      if (existing?.status === "initializing") throw new ApiError(409, "Payment initialization is already in progress", "payment_in_progress");

      const reference = `URUGO-${orderId}-${randomUUID()}`;
      const attempt = {
        id: paymentRef.id,
        orderId,
        customerId: user.uid,
        reference,
        amount: Number(order.total),
        currency,
        method: order.paymentMethod,
        status: "initializing",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      transaction.set(paymentRef, attempt);
      return { existing: false as const, attempt, order };
    });

    if (reservation.existing) return NextResponse.json({ checkoutUrl: reservation.checkoutUrl });
    const { attempt, order } = reservation;
    try {
      const hosted = await createHostedPayment({
        reference: attempt.reference,
        amount: attempt.amount,
        currency: attempt.currency,
        redirectUrl: `${siteUrl.replace(/\/$/, "")}/checkout/payment-return?order=${encodeURIComponent(orderId)}`,
        orderId,
        method: attempt.method,
        customer: { email: order.address.email, name: order.address.fullName, phone: order.address.phone },
      });
      await paymentRef.update({ status: "pending", checkoutUrl: hosted.link, updatedAt: new Date().toISOString() });
      return NextResponse.json({ checkoutUrl: hosted.link });
    } catch (error) {
      await paymentRef.update({ status: "failed", updatedAt: new Date().toISOString() }).catch(() => undefined);
      throw error;
    }
  } catch (error) {
    return apiError(error);
  }
}
