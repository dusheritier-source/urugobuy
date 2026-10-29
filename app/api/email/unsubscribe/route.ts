import { NextResponse } from "next/server";
import { ApiError, apiError } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { verifyEmailUnsubscribeToken } from "@/lib/server/email-unsubscribe";

export async function GET(request: Request) {
  const url = new URL(request.url);
  return NextResponse.redirect(new URL(`/email/unsubscribe?token=${encodeURIComponent(url.searchParams.get("token") ?? "")}`, url));
}

export async function POST(request: Request) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token || token.length > 2048) throw new ApiError(400, "Invalid unsubscribe link", "invalid_unsubscribe_token");
    const userId = verifyEmailUnsubscribeToken(token);
    await adminDb().collection("users").doc(userId).collection("emailPreferences").doc("marketing").set({
      newsletter: false,
      unsubscribedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return NextResponse.json({ unsubscribed: true });
  } catch (error) {
    return apiError(error);
  }
}
