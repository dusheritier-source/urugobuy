import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "@/lib/server/api";

const API_URL = "https://api.flutterwave.com/v3";

function secretKey() {
  const key = process.env.FLW_SECRET_KEY;
  if (!key) throw new ApiError(503, "Payment provider is not configured", "payments_unavailable");
  return key;
}

async function flutterwave<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as { status?: string; message?: string; data?: T } | null;
  if (!response.ok || payload?.status !== "success" || payload.data == null) {
    throw new ApiError(502, payload?.message ?? "Payment provider request failed", "provider_error");
  }
  return payload.data;
}

export type VerifiedTransaction = {
  id: number;
  tx_ref: string;
  flw_ref?: string;
  status: string;
  amount: number;
  charged_amount?: number;
  currency: string;
  payment_type?: string;
};

export async function createHostedPayment(input: {
  reference: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  orderId: string;
  method: "card" | "mobile_money";
  customer: { email: string; name: string; phone: string };
}) {
  if (input.method === "mobile_money" && input.currency !== "RWF") {
    throw new ApiError(409, "Rwanda Mobile Money requires an RWF catalog and PAYMENT_CURRENCY=RWF", "currency_mismatch");
  }
  return flutterwave<{ link: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: input.reference,
      amount: input.amount.toFixed(2),
      currency: input.currency,
      redirect_url: input.redirectUrl,
      payment_options: input.method === "mobile_money" ? "mobilemoneyrwanda" : "card",
      customer: { email: input.customer.email, name: input.customer.name, phonenumber: input.customer.phone },
      meta: { order_id: input.orderId },
      customizations: { title: "Urugo Buy", description: `Payment for order ${input.orderId}` },
      configurations: { session_duration: 20, max_retry_attempt: 5 },
    }),
  });
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.FLW_SECRET_HASH;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

export function verifyLegacyWebhookHash(hash: string | null) {
  const secret = process.env.FLW_SECRET_HASH;
  if (!secret || !hash) return false;
  const provided = Buffer.from(hash);
  const expected = Buffer.from(secret);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

export async function verifyTransaction(id: string | number) {
  return flutterwave<VerifiedTransaction>(`/transactions/${encodeURIComponent(String(id))}/verify`);
}

export async function verifyTransactionByReference(reference: string) {
  return flutterwave<VerifiedTransaction>(`/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`);
}

export async function refundTransaction(id: string | number, amount: number, comments: string, callbackUrl: string) {
  return flutterwave<{ id?: number; status?: string; amount_refunded?: number }>(`/transactions/${encodeURIComponent(String(id))}/refund`, {
    method: "POST",
    body: JSON.stringify({ amount, comments, callbackurl: callbackUrl }),
  });
}

export async function fetchRefund(id: string | number) {
  return flutterwave<{ id: number; status: string; amount_refunded?: number; AmountRefunded?: number }>(`/refunds/${encodeURIComponent(String(id))}`);
}

export async function disableHostedPayment(link: string) {
  return flutterwave<boolean>("/payments/link/disable", { method: "POST", body: JSON.stringify({ link }) });
}
