import { NextResponse } from "next/server";
import { apiError, authenticate, clientAddress } from "@/lib/server/api";
import { adminAuth } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";

const SESSION_COOKIE = "urugo_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  try {
    rateLimit(`session:${clientAddress(request)}`, 20, 60_000);
    const user = await authenticate(request);
    const idToken = request.headers.get("authorization")!.slice(7).trim();
    const sessionCookie = await adminAuth().createSessionCookie(idToken, { expiresIn: MAX_AGE_SECONDS * 1000 });
    const response = NextResponse.json({ user: { uid: user.uid, staff: user.staff === true, admin: user.admin === true } });
    response.cookies.set(SESSION_COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE() {
  const response = new NextResponse(null, { status: 204 });
  response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return response;
}
