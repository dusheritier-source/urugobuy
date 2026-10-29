import { NextResponse } from "next/server";
import { apiError, authenticate } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";

export async function POST(request: Request) {
  try {
    const user = await authenticate(request);
    if (!user.email) return NextResponse.json({ queued: false });
    const db = adminDb();
    const job = db.collection("notificationQueue").doc(`welcome_${user.uid}`);
    await db.runTransaction(async (transaction) => {
      const existing = await transaction.get(job);
      if (existing.exists) return;
      transaction.create(job, {
        type: "welcome",
        userId: user.uid,
        email: user.email,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    });
    return NextResponse.json({ queued: true }, { status: 202 });
  } catch (error) {
    return apiError(error);
  }
}
