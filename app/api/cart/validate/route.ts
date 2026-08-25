import { NextResponse } from "next/server";
import { apiError, clientAddress } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { z } from "zod";

const schema = z.object({ productIds: z.array(z.string().trim().min(1).max(128)).min(1).max(50) });

export async function POST(request: Request) {
  try {
    rateLimit(`cart-validate:${clientAddress(request)}`, 60, 60_000);
    const { productIds } = schema.parse(await request.json());
    const unique = [...new Set(productIds)];
    const refs = unique.map((id) => adminDb().collection("products").doc(id));
    const snapshots = await adminDb().getAll(...refs);
    const products = snapshots.map((snapshot) => {
      const product = snapshot.data();
      return {
        id: snapshot.id,
        available: snapshot.exists && product?.status === "published",
        stock: snapshot.exists && product?.status === "published" ? Math.max(0, Number(product.stock) || 0) : 0,
        price: snapshot.exists ? Number(product?.price) : null,
        discount: snapshot.exists ? Number(product?.discount ?? 0) : null,
        updatedAt: product?.updatedAt ?? null,
      };
    });
    const response = NextResponse.json({ products });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}
