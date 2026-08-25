import { ApiError, apiError, noStoreJson, requireStaff } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { updateReturnSchema } from "@/lib/server/schemas";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const staff = await requireStaff(request);
    rateLimit(`return-update:${staff.uid}`, 60, 60_000);
    const { id } = await params;
    const input = updateReturnSchema.parse(await request.json());
    const db = adminDb();
    const ref = db.collection("returns").doc(id);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new ApiError(404, "Return not found", "not_found");
    const current = snapshot.data()!;
    const transitions: Record<string, string[]> = { requested: ["approved", "rejected"], approved: ["received", "rejected"], received: ["resolved"] };
    if (!transitions[current.status]?.includes(input.status)) throw new ApiError(409, `Return cannot move from ${current.status} to ${input.status}`, "invalid_status_transition");
    const now = new Date().toISOString();
    const update = { ...input, updatedAt: now, updatedBy: staff.uid };
    const batch = db.batch();
    batch.update(ref, update);
    batch.set(db.collection("notificationQueue").doc(`return_update_${id}_${input.status}`), { type: "return_update", returnId: id, orderId: current.orderId, orderNumber: current.orderNumber, userId: current.customerId, email: current.email, status: input.status, createdAt: now });
    await batch.commit();
    return noStoreJson({ return: { id, ...update } });
  } catch (error) { return apiError(error); }
}
