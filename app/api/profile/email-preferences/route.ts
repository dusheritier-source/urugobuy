import { z } from "zod";
import { ApiError, apiError, authenticate, noStoreJson } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";

const schema = z.object({ newsletter: z.boolean() });

export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`email-preferences:${user.uid}`, 60, 60_000);
    const snapshot = await adminDb().collection("users").doc(user.uid).collection("emailPreferences").doc("marketing").get();
    return noStoreJson({ newsletter: snapshot.data()?.newsletter === true, emailVerified: user.email_verified === true });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`email-preferences-write:${user.uid}`, 20, 60_000);
    if (!user.email) throw new ApiError(400, "An email address is required to subscribe.", "email_required");
    const input = schema.parse(await request.json());
    if (input.newsletter && user.email_verified !== true) {
      throw new ApiError(403, "Verify your email address before subscribing to marketing emails.", "email_not_verified");
    }
    const now = new Date().toISOString();
    await adminDb().collection("users").doc(user.uid).collection("emailPreferences").doc("marketing").set({
      userId: user.uid,
      email: user.email,
      newsletter: input.newsletter,
      emailVerified: user.email_verified === true,
      updatedAt: now,
      ...(input.newsletter ? { subscribedAt: now } : { unsubscribedAt: now }),
    }, { merge: true });
    return noStoreJson({ newsletter: input.newsletter });
  } catch (error) {
    return apiError(error);
  }
}
