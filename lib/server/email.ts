import "server-only";

import { ApiError } from "@/lib/server/api";

const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);

type EmailJob = {
  type: string;
  email: string;
  orderNumber?: string;
  orderId?: string;
  productTitle?: string;
  productId?: string;
  productSlug?: string;
  status?: string;
  trackingNumber?: string;
  carrier?: string;
  total?: number;
  currency?: string;
};

function template(job: EmailJob) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://urugobuy.com").replace(/\/$/, "");
  const button = (label: string, path: string) => `<p><a href="${site}${path}" style="display:inline-block;background:#8B4513;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none">${escape(label)}</a></p>`;
  const shell = (content: string) => `<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#292524"><h1 style="color:#8B4513">Urugo Buy</h1>${content}<hr style="border:0;border-top:1px solid #e7e5e4"><p style="font-size:12px;color:#78716c">This is a transactional message about your Urugo Buy account or order.</p></div>`;
  switch (job.type) {
    case "order_created": return { subject: `Order ${job.orderNumber} received`, html: shell(`<h2>We received your order</h2><p>Order <strong>${escape(job.orderNumber)}</strong> is awaiting ${job.status === "pending" ? "payment or confirmation" : "processing"}.</p>${button("View your orders", "/profile#orders")}`) };
    case "payment_confirmed": return { subject: `Payment confirmed for ${job.orderNumber}`, html: shell(`<h2>Payment confirmed</h2><p>We verified your payment for order <strong>${escape(job.orderNumber)}</strong>.</p>${button("View your order", "/profile#orders")}`) };
    case "order_status": return { subject: `Order ${job.orderNumber}: ${job.status}`, html: shell(`<h2>Order update</h2><p>Your order <strong>${escape(job.orderNumber)}</strong> is now <strong>${escape(job.status)}</strong>.</p>${job.trackingNumber ? `<p>Tracking: <strong>${escape(job.trackingNumber)}</strong>${job.carrier ? ` via ${escape(job.carrier)}` : ""}</p>` : ""}${button("Track your order", "/profile#orders")}`) };
    case "return_update": return { subject: `Return update for ${job.orderNumber}`, html: shell(`<h2>Return request updated</h2><p>Your return for <strong>${escape(job.orderNumber)}</strong> is now <strong>${escape(job.status)}</strong>.</p>${button("View your account", "/profile")}`) };
    case "back_in_stock": return { subject: `${job.productTitle} is back in stock`, html: shell(`<h2>Back in stock</h2><p><strong>${escape(job.productTitle)}</strong> is available again while supplies last.</p>${button("View product", `/products/${encodeURIComponent(job.productSlug ?? job.productId ?? "")}`)}`) };
    default: throw new ApiError(400, "Unsupported email job type", "unsupported_email");
  }
}

export async function sendEmailJob(id: string, job: EmailJob) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new ApiError(503, "Transactional email is not configured", "email_unavailable");
  const message = template(job);
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": id.slice(0, 256) },
    body: JSON.stringify({ from, to: [job.email], subject: message.subject, html: message.html, tags: [{ name: "category", value: job.type.replace(/[^a-z0-9_-]/gi, "_").slice(0, 256) }] }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as { id?: string; message?: string } | null;
  if (!response.ok || !payload?.id) throw new ApiError(502, payload?.message ?? "Email provider request failed", "email_provider_error");
  return payload.id;
}
