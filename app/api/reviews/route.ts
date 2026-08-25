import { NextResponse } from "next/server";
import type { Query } from "firebase-admin/firestore";
import { apiError, authenticate, clientAddress } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { reviewSchema } from "@/lib/server/schemas";

export async function GET(request: Request) {
  try {
    rateLimit(`reviews:${clientAddress(request)}`, 120, 60_000);
    const productId = new URL(request.url).searchParams.get("productId");
    let query: Query = adminDb().collection("reviews").where("status", "==", "published");
    if (productId) query = query.where("productId", "==", productId);
    const snapshot = await query.limit(100).get();
    return NextResponse.json({ reviews: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`review-create:${user.uid}`, 5, 60 * 60_000);
    const input = reviewSchema.parse(await request.json());
    const ref = adminDb().collection("reviews").doc();
    const review = { ...input, id: ref.id, userId: user.uid, author: user.name ?? "Customer", status: "pending", verified: false, helpful: 0, createdAt: new Date().toISOString() };
    await ref.create(review);
    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
