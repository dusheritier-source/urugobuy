import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { adminAuth } from "@/lib/server/firebase-admin";

export class ApiError extends Error {
  constructor(public status: number, message: string, public code = "request_error") {
    super(message);
  }
}

export async function authenticate(request: Request): Promise<DecodedIdToken> {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) throw new ApiError(401, "Authentication required", "unauthorized");
  const token = authorization.slice(7).trim();
  if (!token) throw new ApiError(401, "Authentication required", "unauthorized");
  try {
    return await adminAuth().verifyIdToken(token, true);
  } catch {
    throw new ApiError(401, "Invalid or expired authentication", "invalid_token");
  }
}

export async function requireStaff(request: Request) {
  const user = await authenticate(request);
  if (user.staff !== true && user.admin !== true) throw new ApiError(403, "Staff access required", "forbidden");
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await authenticate(request);
  if (user.admin !== true) throw new ApiError(403, "Administrator access required", "forbidden");
  return user;
}

export function clientAddress(request: Request) {
  return request.headers.get("cf-connecting-ip")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ error: { code: "validation_error", message: "Invalid request", issues: error.issues } }, { status: 400 });
  }
  console.error("API request failed", error);
  return NextResponse.json({ error: { code: "internal_error", message: "The request could not be completed" } }, { status: 500 });
}

export function noStoreJson(data: unknown, init?: ResponseInit) {
  const response = NextResponse.json(data, init);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
