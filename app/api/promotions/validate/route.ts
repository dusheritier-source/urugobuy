import { NextResponse } from "next/server";
import { apiError, clientAddress } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { z } from "zod";

const requestSchema = z.object({ code: z.string().trim().toUpperCase().min(3).max(30), subtotal: z.number().finite().nonnegative() });

export async function POST(request: Request) {
  try {
    rateLimit(`promotion:${clientAddress(request)}`, 20, 60_000);
    const { code, subtotal } = requestSchema.parse(await request.json());
    const snapshot = await adminDb().collection("promotions").where("code", "==", code).where("active", "==", true).limit(1).get();
    const promotion = snapshot.docs[0]?.data();
    const now = Date.now();
    const valid = Boolean(promotion
      && promotion.uses < promotion.usageLimit
      && subtotal >= promotion.minimum
      && now >= Date.parse(promotion.startsAt)
      && now <= Date.parse(promotion.endsAt));
    const amount = valid
      ? promotion.kind === "percentage" ? subtotal * promotion.value / 100 : Math.min(subtotal, promotion.value)
      : 0;
    return NextResponse.json({ valid, amount: Math.round(amount * 100) / 100, code: valid ? code : null });
  } catch (error) {
    return apiError(error);
  }
}
