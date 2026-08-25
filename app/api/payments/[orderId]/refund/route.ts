import { ApiError, apiError, requireStaff } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { refundTransaction } from "@/lib/server/flutterwave";
import { rateLimit } from "@/lib/server/rate-limit";
import { z } from "zod";

const schema = z.object({ amount: z.number().finite().positive().optional(), reason: z.string().trim().min(3).max(500) });
type Context = { params: Promise<{ orderId: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const staff = await requireStaff(request);
    rateLimit(`refund:${staff.uid}`, 20, 60 * 60_000);
    const { orderId } = await params;
    const input = schema.parse(await request.json());
    const db = adminDb();
    const [order, payment] = await Promise.all([db.collection("orders").doc(orderId).get(), db.collection("payments").doc(orderId).get()]);
    if (!order.exists || !payment.exists) throw new ApiError(404, "Paid order not found", "not_found");
    const orderData = order.data()!;
    const paymentData = payment.data()!;
    if (orderData.paymentStatus !== "paid" || paymentData.status !== "paid" || !paymentData.providerTransactionId) throw new ApiError(409, "Only verified payments can be refunded", "refund_not_allowed");
    const amount = input.amount ?? Number(orderData.total);
    if (amount > Number(orderData.total)) throw new ApiError(409, "Refund cannot exceed the order total", "refund_too_large");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) throw new ApiError(503, "Site URL is not configured", "refund_unavailable");
    const providerResult = await refundTransaction(paymentData.providerTransactionId, amount, input.reason, `${siteUrl.replace(/\/$/, "")}/api/webhooks/flutterwave`);
    const now = new Date().toISOString();
    const providerAccepted = ["completed", "completed-bank-transfer", "completed-momo", "completed-mpgs", "completed-offline", "completed-preauth", "pending-momo", "processing"].includes(providerResult.status ?? "");
    if (!providerAccepted) throw new ApiError(502, "The payment provider did not accept the refund", "refund_provider_error");
    const refund = { id: providerResult.id ?? null, amount, reason: input.reason, status: providerResult.status ?? "processing", requestedAt: now, requestedBy: staff.uid };
    await Promise.all([
      payment.ref.update({ status: "refund_pending", refund, updatedAt: now }),
      order.ref.update({ refundStatus: "pending", refund, updatedAt: now, updatedBy: staff.uid }),
    ]);
    return noStoreJson({ refund });
  } catch (error) {
    return apiError(error);
  }
}

function noStoreJson(data: unknown) {
  const response = Response.json(data);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
