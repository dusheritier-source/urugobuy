import { NextResponse } from "next/server";
import { apiError, requireStaff } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { promotionSchema } from "@/lib/server/schemas";

export async function GET(request: Request) {
  try {
    const staff = await requireStaff(request);
    rateLimit(`promotions-admin:${staff.uid}`, 60, 60_000);
    const snapshot = await adminDb().collection("promotions").limit(100).get();
    return NextResponse.json({ promotions: snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff(request);
    rateLimit(`promotion-create:${staff.uid}`, 30, 60_000);
    const input = promotionSchema.parse(await request.json());
    const duplicate = await adminDb().collection("promotions").where("code", "==", input.code).limit(1).get();
    if (!duplicate.empty) return NextResponse.json({ error: { code: "duplicate_code", message: "Promotion code already exists" } }, { status: 409 });
    const ref = adminDb().collection("promotions").doc();
    const promotion = { ...input, id: ref.id, uses: 0, createdAt: new Date().toISOString(), createdBy: staff.uid };
    await ref.create(promotion);
    return NextResponse.json({ promotion }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
