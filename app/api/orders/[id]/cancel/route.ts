import { FieldValue } from "firebase-admin/firestore";
import { ApiError, apiError, authenticate, noStoreJson } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { disableHostedPayment } from "@/lib/server/flutterwave";
import { rateLimit } from "@/lib/server/rate-limit";
import { queueBackInStockNotifications } from "@/lib/server/stock-notifications";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await authenticate(request);
    rateLimit(`order-cancel:${user.uid}`, 10, 60 * 60_000);
    const { id } = await params;
    const db = adminDb();
    const orderRef = db.collection("orders").doc(id);
    const paymentRef = db.collection("payments").doc(id);
    const [orderSnapshot, paymentSnapshot] = await Promise.all([orderRef.get(), paymentRef.get()]);
    const staff = user.staff === true || user.admin === true;
    if (!orderSnapshot.exists || (orderSnapshot.data()?.customerId !== user.uid && !staff)) throw new ApiError(404, "Order not found", "not_found");
    if (orderSnapshot.data()?.paymentStatus === "paid") throw new ApiError(409, "Paid orders must use the refund process", "cannot_cancel_paid_order");
    const checkoutUrl = paymentSnapshot.data()?.checkoutUrl;
    if (checkoutUrl) await disableHostedPayment(String(checkoutUrl));

    const restocked = await db.runTransaction(async (transaction) => {
      const [orderDoc, paymentDoc] = await transaction.getAll(orderRef, paymentRef);
      if (!orderDoc.exists) throw new ApiError(404, "Order not found", "not_found");
      const order = orderDoc.data()!;
      if ((order.customerId !== user.uid && !staff) || order.paymentStatus === "paid") throw new ApiError(409, "Order can no longer be cancelled", "cannot_cancel_order");
      if (order.status === "cancelled") return [];
      const productRefs = (order.lines as Array<{ id: string }>).map((line) => db.collection("products").doc(line.id));
      const products = productRefs.length ? await transaction.getAll(...productRefs) : [];
      const now = new Date().toISOString();
      (order.lines as Array<{ id: string; quantity: number }>).forEach((line, index) => {
        if (products[index]?.exists) transaction.update(productRefs[index], { stock: FieldValue.increment(line.quantity), updatedAt: now });
      });
      if (order.coupon) {
        const promotion = await transaction.get(db.collection("promotions").where("code", "==", order.coupon).limit(1));
        if (!promotion.empty) transaction.update(promotion.docs[0].ref, { uses: FieldValue.increment(-1), updatedAt: now });
      }
      transaction.update(orderRef, { status: "cancelled", paymentStatus: "failed", cancelledAt: now, updatedAt: now });
      if (paymentDoc.exists) transaction.update(paymentRef, { status: "cancelled", updatedAt: now });
      transaction.set(db.collection("notificationQueue").doc(`order_status_${id}_cancelled`), {
        type: "order_status", orderId: id, orderNumber: order.orderNumber,
        userId: order.customerId, email: order.address.email, status: "cancelled", createdAt: now,
      });
      return (order.lines as Array<{ id: string; title: string; slug?: string }>).filter((line, index) => products[index]?.exists && Number(products[index].data()?.stock) === 0).map((line) => ({ id: line.id, title: line.title, slug: line.slug }));
    });
    await Promise.allSettled(restocked.map((product) => queueBackInStockNotifications(product.id, product.title, product.slug)));
    return noStoreJson({ orderId: id, status: "cancelled" });
  } catch (error) {
    return apiError(error);
  }
}
