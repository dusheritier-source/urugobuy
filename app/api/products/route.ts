import { NextResponse } from "next/server";
import { products as seedProducts } from "@/lib/data";
import { apiError, clientAddress, requireStaff } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { productSchema } from "@/lib/server/schemas";

export async function GET(request: Request) {
  try {
    rateLimit(`products:${clientAddress(request)}`, 120, 60_000);
    const snapshot = await adminDb().collection("products").where("status", "==", "published").get();
    const products = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    // Seed data keeps local/demo environments useful before a catalog import.
    return NextResponse.json({ products: products.length ? products : seedProducts, source: products.length ? "firestore" : "seed" });
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
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
