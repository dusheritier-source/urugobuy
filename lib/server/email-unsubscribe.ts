import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { ApiError } from "@/lib/server/api";

function sign(value: string) {
  const secret = process.env.EMAIL_JOB_SECRET;
  if (!secret) throw new ApiError(503, "Email unsubscribe is not configured", "email_unavailable");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function createEmailUnsubscribeToken(userId: string) {
  const encodedUserId = Buffer.from(userId).toString("base64url");
  const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const payload = `${encodedUserId}.${expiresAt}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyEmailUnsubscribeToken(token: string) {
  const [encodedUserId, expiresAtText, signature, ...extra] = token.split(".");
  if (!encodedUserId || !expiresAtText || !signature || extra.length) throw new ApiError(400, "Invalid unsubscribe link", "invalid_unsubscribe_token");
  const expiresAt = Number(expiresAtText);
  const payload = `${encodedUserId}.${expiresAtText}`;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (!Number.isSafeInteger(expiresAt) || expiresAt < Math.floor(Date.now() / 1000) || expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    throw new ApiError(400, "This unsubscribe link is invalid or expired", "invalid_unsubscribe_token");
  }
  const userId = Buffer.from(encodedUserId, "base64url").toString();
  if (!userId || userId.length > 128) throw new ApiError(400, "Invalid unsubscribe link", "invalid_unsubscribe_token");
  return userId;
}

export function emailUnsubscribeUrls(userId: string) {
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://urugobuy.com").replace(/\/$/, "");
  const token = encodeURIComponent(createEmailUnsubscribeToken(userId));
  return {
    page: `${site}/email/unsubscribe?token=${token}`,
    oneClick: `${site}/api/email/unsubscribe?token=${token}`,
  };
}
