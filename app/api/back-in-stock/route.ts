import { NextResponse } from "next/server";
import { ApiError, apiError, authenticate, noStoreJson } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { z } from "zod";

const schema = z.object({ productId: z.string().trim().min(1).max(128) });

export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`stock-alerts:${user.uid}`, 60, 60_000);
    const snapshot = await adminDb().collection("users").doc(user.uid).collection("backInStock").where("active", "==", true).limit(100).get();
    return noStoreJson({ subscriptions: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`stock-alert-create:${user.uid}`, 20, 60 * 60_000);
    const { productId } = schema.parse(await request.json());
    const product = await adminDb().collection("products").doc(productId).get();
    if (!product.exists || product.data()?.status !== "published") throw new ApiError(404, "Product not found", "not_found");
    if (Number(product.data()?.stock) > 0) throw new ApiError(409, "This product is currently available", "already_available");
    const now = new Date().toISOString();
    const subscription = { productId, productTitle: product.data()?.title ?? "Product", userId: user.uid, email: user.email ?? null, active: true, createdAt: now, updatedAt: now };
    await adminDb().collection("users").doc(user.uid).collection("backInStock").doc(productId).set(subscription, { merge: true });
    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`stock-alert-delete:${user.uid}`, 30, 60_000);
    const { productId } = schema.parse(await request.json());
    await adminDb().collection("users").doc(user.uid).collection("backInStock").doc(productId).set({ active: false, updatedAt: new Date().toISOString() }, { merge: true });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
