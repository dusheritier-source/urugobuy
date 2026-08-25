import { NextResponse } from "next/server";
import { ApiError, apiError, requireStaff } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { promotionSchema } from "@/lib/server/schemas";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const staff = await requireStaff(request);
    rateLimit(`promotion-update:${staff.uid}`, 60, 60_000);
    const { id } = await params;
    const input = promotionSchema.partial().parse(await request.json());
    const ref = adminDb().collection("promotions").doc(id);
    if (!(await ref.get()).exists) throw new ApiError(404, "Promotion not found", "not_found");
    await ref.update({ ...input, updatedAt: new Date().toISOString(), updatedBy: staff.uid });
    return NextResponse.json({ promotion: { id, ...input } });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const staff = await requireStaff(request);
    rateLimit(`promotion-delete:${staff.uid}`, 30, 60_000);
    const { id } = await params;
    const ref = adminDb().collection("promotions").doc(id);
    if (!(await ref.get()).exists) throw new ApiError(404, "Promotion not found", "not_found");
    await ref.update({ active: false, updatedAt: new Date().toISOString(), updatedBy: staff.uid });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
