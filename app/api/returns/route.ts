import { RETURN_WINDOW_DAYS } from "@/lib/store-policies";
import { NextResponse } from "next/server";
import { ApiError, apiError, authenticate, noStoreJson } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { createReturnSchema } from "@/lib/server/schemas";

export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`returns:${user.uid}`, 60, 60_000);
    const collection = adminDb().collection("returns");
    const snapshot = user.staff === true || user.admin === true
      ? await collection.limit(100).get()
      : await collection.where("customerId", "==", user.uid).limit(100).get();
    const returns = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return noStoreJson({ returns });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`return-create:${user.uid}`, 5, 24 * 60 * 60_000);
    const input = createReturnSchema.parse(await request.json());
    const db = adminDb();
    const order = await db.collection("orders").doc(input.orderId).get();
    if (!order.exists || order.data()?.customerId !== user.uid) throw new ApiError(404, "Order not found", "not_found");
    const orderData = order.data()!;
    if (orderData.status !== "delivered") throw new ApiError(409, "Returns can be requested after delivery", "return_not_available");
    const deliveredAt = [...(orderData.trackingEvents ?? [])].reverse().find((event: { status?: string }) => event.status === "delivered")?.createdAt ?? orderData.updatedAt;
    if (Date.now() - Date.parse(deliveredAt) > RETURN_WINDOW_DAYS * 24 * 60 * 60_000) throw new ApiError(409, "The 30-day return window has closed", "return_window_closed");
    const validProductIds = new Set((orderData.lines as Array<{ id: string }>).map((line) => line.id));
    if (input.productIds.some((id) => !validProductIds.has(id))) throw new ApiError(400, "Return contains a product outside this order", "invalid_return_items");
    const duplicate = await db.collection("returns").where("orderId", "==", input.orderId).where("customerId", "==", user.uid).limit(1).get();
    if (!duplicate.empty) throw new ApiError(409, "A return already exists for this order", "duplicate_return");
    const ref = db.collection("returns").doc();
    const now = new Date().toISOString();
    const returnRequest = { ...input, id: ref.id, number: `RET-${Date.now().toString().slice(-8)}`, customerId: user.uid, email: orderData.address.email, orderNumber: orderData.orderNumber, status: "requested", createdAt: now, updatedAt: now };
    const batch = db.batch();
    batch.create(ref, returnRequest);
    batch.set(db.collection("notificationQueue").doc(`return_update_${ref.id}_requested`), { type: "return_update", returnId: ref.id, orderId: order.id, orderNumber: orderData.orderNumber, userId: user.uid, email: orderData.address.email, status: "requested", createdAt: now });
    await batch.commit();
    return NextResponse.json({ return: returnRequest }, { status: 201 });
  } catch (error) { return apiError(error); }
}
