import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { adminDb } from "@/lib/server/firebase-admin";

type Event = { type: string; created_at: string; data: { email_id: string; to?: string[] } };

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  const raw = await request.text();
  let event: Event;
  try {
    event = new Webhook(secret).verify(raw, {
      "svix-id": request.headers.get("svix-id") ?? "",
      "svix-timestamp": request.headers.get("svix-timestamp") ?? "",
      "svix-signature": request.headers.get("svix-signature") ?? "",
    }) as Event;
  } catch { return NextResponse.json({ error: "Invalid signature" }, { status: 401 }); }

  const eventId = request.headers.get("svix-id")!;
  const db = adminDb();
  const eventRef = db.collection("emailEvents").doc(eventId);
  if ((await eventRef.get()).exists) return new NextResponse(null, { status: 200 });
  const messages = await db.collection("notificationQueue").where("providerMessageId", "==", event.data.email_id).limit(1).get();
  const batch = db.batch();
  batch.create(eventRef, { ...event, receivedAt: new Date().toISOString() });
  if (!messages.empty) batch.update(messages.docs[0].ref, { deliveryStatus: event.type.replace("email.", ""), deliveryUpdatedAt: event.created_at });
  if (["email.bounced", "email.complained", "email.suppressed"].includes(event.type)) {
    for (const email of event.data.to ?? []) {
      const id = createHash("sha256").update(email.toLowerCase()).digest("hex");
      batch.set(db.collection("emailSuppressions").doc(id), { email: email.toLowerCase(), reason: event.type, createdAt: event.created_at }, { merge: true });
    }
  }
  await batch.commit();
  return new NextResponse(null, { status: 200 });
}
