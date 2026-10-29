import { invalidateCatalog } from "@/lib/server/catalog";
import { NextResponse } from "next/server";
import { ApiError, apiError, clientAddress, requireAdmin, requireStaff } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { productUpdateSchema } from "@/lib/server/schemas";
import { queueBackInStockNotifications } from "@/lib/server/stock-notifications";
import { processPriceDropNotifications } from "@/lib/server/price-notifications";
import { needsPriceAlertEvent } from "@/lib/price-alerts";

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
    const input = productUpdateSchema.parse(await request.json());
    const db = adminDb();
    const ref = db.collection("products").doc(id);
    const eventRef = db.collection("priceAlertEvents").doc();
    const result = await db.runTransaction(async (tx) => {
      const existing = await tx.get(ref);
      if (!existing.exists) throw new ApiError(404, "Product not found", "not_found");
      const previous = existing.data()!;
      const updated = { ...previous, ...input };
      const now = new Date().toISOString();
      tx.update(ref, { ...input, updatedAt: now, updatedBy: staff.uid });
      const notify = needsPriceAlertEvent(previous, updated);
      if (notify) tx.create(eventRef, { productId: id, currency: process.env.PAYMENT_CURRENCY || "USD", status: "pending", cursor: null, createdAt: now, attempts: 0 });
      return { previous, updated, eventId: notify ? eventRef.id : null };
    });
    invalidateCatalog();
    if (input.stock != null && input.stock > 0 && Number(result.previous.stock) <= 0) {
      try { await queueBackInStockNotifications(id, String(result.updated.title ?? "Product"), String(result.updated.slug ?? id)); }
      catch { console.warn("Stock notification queue pending review", id); }
    }
    if (result.eventId) {
      try { await processPriceDropNotifications(result.eventId); }
      catch { console.warn("Price alerts pending retry", result.eventId); }
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
    invalidateCatalog();
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
