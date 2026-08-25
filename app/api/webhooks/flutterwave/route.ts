import { NextResponse } from "next/server";
import { adminDb } from "@/lib/server/firebase-admin";
import { verifyLegacyWebhookHash, verifyWebhookSignature } from "@/lib/server/flutterwave";
import { reconcileRefund, reconcileTransaction } from "@/lib/server/payments";

type Webhook = { id?: string; type?: string; event?: string; data?: { id?: string | number; status?: string } };

export async function POST(request: Request) {
  const rawBody = await request.text();
  const validSignature = verifyWebhookSignature(rawBody, request.headers.get("flutterwave-signature"))
    || verifyLegacyWebhookHash(request.headers.get("verif-hash"));
  if (!validSignature) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let payload: Webhook;
  try { payload = JSON.parse(rawBody) as Webhook; } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const eventType = payload.type ?? payload.event;
  const transactionId = payload.data?.id;
  if (!transactionId || (eventType !== "charge.completed" && !eventType?.toLowerCase().includes("refund"))) return new NextResponse(null, { status: 200 });

  const eventId = payload.id ?? `${eventType}:${transactionId}:${payload.data?.status ?? "unknown"}`;
  const eventRef = adminDb().collection("webhookEvents").doc(eventId);
  if ((await eventRef.get()).exists) return new NextResponse(null, { status: 200 });

  try {
    const result = eventType?.toLowerCase().includes("refund")
      ? await reconcileRefund(transactionId)
      : await reconcileTransaction(transactionId);
    await eventRef.create({ provider: "flutterwave", eventType, transactionId: String(transactionId), orderId: result.orderId, processedAt: new Date().toISOString() });
    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error("Flutterwave webhook processing failed", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
