import "server-only";

import { ApiError } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { fetchRefund, verifyTransaction } from "@/lib/server/flutterwave";

const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export async function reconcileTransaction(transactionId: string | number) {
  const verified = await verifyTransaction(transactionId);
  const db = adminDb();
  const paymentSnapshot = await db.collection("payments").where("reference", "==", verified.tx_ref).limit(1).get();
  if (paymentSnapshot.empty) throw new ApiError(404, "Payment attempt not found", "payment_not_found");
  const paymentRef = paymentSnapshot.docs[0].ref;
  const orderRef = db.collection("orders").doc(String(paymentSnapshot.docs[0].data().orderId));

  return db.runTransaction(async (transaction) => {
    const [paymentDoc, orderDoc] = await transaction.getAll(paymentRef, orderRef);
    if (!paymentDoc.exists || !orderDoc.exists) throw new ApiError(404, "Payment order not found", "order_not_found");
    const payment = paymentDoc.data()!;
    const order = orderDoc.data()!;
    if (payment.status === "paid" && order.paymentStatus === "paid") return { orderId: orderDoc.id, status: "paid", duplicate: true };

    const valid = verified.status === "successful"
      && money(Number(verified.amount)) === money(Number(payment.amount))
      && verified.currency === payment.currency
      && verified.tx_ref === payment.reference;
    const now = new Date().toISOString();
    if (!valid) {
      transaction.update(paymentRef, { status: "failed", providerTransactionId: String(verified.id), verification: verified, updatedAt: now });
      transaction.update(orderRef, { paymentStatus: "failed", updatedAt: now });
      throw new ApiError(409, "Payment verification did not match the order", "payment_mismatch");
    }

    transaction.update(paymentRef, { status: "paid", providerTransactionId: String(verified.id), providerReference: verified.flw_ref ?? null, verification: verified, paidAt: now, updatedAt: now });
    transaction.update(orderRef, { paymentStatus: "paid", status: "paid", paidAt: now, updatedAt: now });
    transaction.set(db.collection("notificationQueue").doc(`payment_confirmed_${orderDoc.id}`), {
      type: "payment_confirmed", orderId: orderDoc.id, orderNumber: order.orderNumber,
      userId: order.customerId, email: order.address.email, total: order.total,
      currency: payment.currency, createdAt: now,
    });
    return { orderId: orderDoc.id, status: "paid" };
  });
}

export async function reconcileRefund(refundId: string | number) {
  const providerRefund = await fetchRefund(refundId);
  const db = adminDb();
  const paymentSnapshot = await db.collection("payments").where("refund.id", "==", Number(refundId)).limit(1).get();
  if (paymentSnapshot.empty) throw new ApiError(404, "Refund attempt not found", "refund_not_found");
  const paymentRef = paymentSnapshot.docs[0].ref;
  const orderRef = db.collection("orders").doc(String(paymentSnapshot.docs[0].data().orderId));
  const successful = ["completed-bank-transfer", "completed-momo", "completed-mpgs", "completed-offline", "completed-preauth", "succeeded"].includes(providerRefund.status);
  const failed = ["failed", "cancelled"].includes(providerRefund.status);
  const now = new Date().toISOString();
  await db.runTransaction(async (transaction) => {
    const [paymentDoc, orderDoc] = await transaction.getAll(paymentRef, orderRef);
    if (!paymentDoc.exists || !orderDoc.exists) throw new ApiError(404, "Refund order not found", "order_not_found");
    const expected = Number(paymentDoc.data()!.refund?.amount);
    const actual = Number(providerRefund.amount_refunded ?? providerRefund.AmountRefunded ?? expected);
    if (money(expected) !== money(actual)) throw new ApiError(409, "Refund amount does not match", "refund_mismatch");
    transaction.update(paymentRef, { status: successful ? "refunded" : failed ? "paid" : "refund_pending", "refund.status": providerRefund.status, "refund.updatedAt": now, updatedAt: now });
    transaction.update(orderRef, {
      ...(successful ? { status: "refunded", paymentStatus: "refunded", refundStatus: "completed" } : failed ? { refundStatus: "failed" } : { refundStatus: "pending" }),
      updatedAt: now,
    });
  });
  return { orderId: orderRef.id, status: successful ? "refunded" : failed ? "failed" : "pending" };
}
