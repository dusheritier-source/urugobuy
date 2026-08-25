import { NextResponse } from "next/server";
import { ApiError, apiError, clientAddress, requireAdmin, requireStaff } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { productSchema } from "@/lib/server/schemas";
import { queueBackInStockNotifications } from "@/lib/server/stock-notifications";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    rateLimit(`product:${clientAddress(request)}`, 180, 60_000);
    const { id } = await params;
    const snapshot = await adminDb().collection("products").doc(id).get();
    if (!snapshot.exists || snapshot.data()?.status !== "published") throw new ApiError(404, "Product not found", "not_found");
    return NextResponse.json({ product: { id: snapshot.id, ...snapshot.data() } });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const staff = await requireStaff(request);
    rateLimit(`product-update:${staff.uid}`, 120, 60_000);
    const { id } = await params;
    const input = productSchema.partial().parse(await request.json());
    const ref = adminDb().collection("products").doc(id);
    const existing = await ref.get();
    if (!existing.exists) throw new ApiError(404, "Product not found", "not_found");
    await ref.update({ ...input, updatedAt: new Date().toISOString(), updatedBy: staff.uid });
    if (input.stock != null && input.stock > 0 && Number(existing.data()?.stock) <= 0) {
      await queueBackInStockNotifications(id, input.title ?? existing.data()?.title ?? "Product", input.slug ?? existing.data()?.slug);
    }
    return NextResponse.json({ product: { id, ...input } });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    const admin = await requireAdmin(request);
    rateLimit(`product-delete:${admin.uid}`, 30, 60_000);
    const { id } = await params;
    const ref = adminDb().collection("products").doc(id);
    if (!(await ref.get()).exists) throw new ApiError(404, "Product not found", "not_found");
    await ref.update({ status: "archived", updatedAt: new Date().toISOString(), updatedBy: admin.uid });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
