import { NextResponse } from "next/server";
import { publishedProducts, hasServerCatalog, invalidateCatalog } from "@/lib/server/catalog";
import { apiError, clientAddress, requireStaff } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { productSchema } from "@/lib/server/schemas";

export async function GET(request: Request) {
  try {
    rateLimit(`products:${clientAddress(request)}`, 120, 60_000);
    const products = await publishedProducts({ fresh: true });
    return NextResponse.json({ products, source: hasServerCatalog() ? "firestore" : "seed" }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff(request);
    rateLimit(`products-write:${staff.uid}`, 60, 60_000);
    const input = productSchema.parse(await request.json());
    const now = new Date().toISOString();
    const ref = adminDb().collection("products").doc();
    const product = { ...input, id: ref.id, rating: input.rating ?? 0, createdAt: now, updatedAt: now, createdBy: staff.uid };
    await ref.create(product);
    invalidateCatalog();
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
