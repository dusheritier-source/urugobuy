import { ApiError, apiError, authenticate, noStoreJson } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { reconcileTransaction } from "@/lib/server/payments";
import { rateLimit } from "@/lib/server/rate-limit";
import { z } from "zod";

const schema = z.object({ orderId: z.string().trim().min(1).max(128), transactionId: z.coerce.string().min(1).max(128) });

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`payment-verify:${user.uid}`, 20, 10 * 60_000);
    const input = schema.parse(await request.json());
    const order = await adminDb().collection("orders").doc(input.orderId).get();
    if (!order.exists || order.data()?.customerId !== user.uid) throw new ApiError(404, "Order not found", "not_found");
    const result = await reconcileTransaction(input.transactionId);
    if (result.orderId !== input.orderId) throw new ApiError(409, "Payment does not belong to this order", "payment_mismatch");
    return noStoreJson(result);
  } catch (error) {
    return apiError(error);
  }
}
