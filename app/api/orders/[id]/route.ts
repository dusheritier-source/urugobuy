import { FieldValue } from "firebase-admin/firestore";
import { ApiError, apiError, authenticate, noStoreJson, requireStaff } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { updateOrderSchema } from "@/lib/server/schemas";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    const user = await authenticate(request);
    rateLimit(`order:${user.uid}`, 90, 60_000);
    const { id } = await params;
    const snapshot = await adminDb().collection("orders").doc(id).get();
    if (!snapshot.exists) throw new ApiError(404, "Order not found", "not_found");
    const order = { id: snapshot.id, ...snapshot.data() } as { id: string; customerId?: string };
    if (order.customerId !== user.uid && user.staff !== true && user.admin !== true) throw new ApiError(404, "Order not found", "not_found");
    return noStoreJson({ order });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const staff = await requireStaff(request);
    rateLimit(`order-update:${staff.uid}`, 90, 60_000);
    const { id } = await params;
    const input = updateOrderSchema.parse(await request.json());
    const db = adminDb();
    const ref = db.collection("orders").doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new ApiError(404, "Order not found", "not_found");
    const order = snapshot.data()!;
    const allowed: Record<string, string[]> = { pending: ["processing"], paid: ["processing", "shipped"], processing: ["shipped"], shipped: ["delivered"] };
    if (!allowed[order.status]?.includes(input.status)) throw new ApiError(409, `Order cannot move from ${order.status} to ${input.status}`, "invalid_status_transition");
    const now = new Date().toISOString();
    const event = { status: input.status, trackingNumber: input.trackingNumber ?? null, carrier: input.carrier ?? null, createdAt: now, createdBy: staff.uid };
    const update = { ...input, trackingEvents: FieldValue.arrayUnion(event), updatedAt: now, updatedBy: staff.uid };
    const batch = db.batch();
    batch.update(ref, update);
    batch.set(db.collection("notificationQueue").doc(`order_status_${id}_${input.status}`), {
      type: "order_status", orderId: id, orderNumber: order.orderNumber,
      userId: order.customerId, email: order.address.email, status: input.status,
      trackingNumber: input.trackingNumber ?? null, carrier: input.carrier ?? null,
      createdAt: now,
    });
    await batch.commit();
    return noStoreJson({ order: { id, ...input, trackingEvent: event, updatedAt: now, updatedBy: staff.uid } });
  } catch (error) {
    return apiError(error);
  }
}
