import { apiError, authenticate, noStoreJson } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { profileSchema } from "@/lib/server/schemas";

export async function GET(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`profile:${user.uid}`, 60, 60_000);
    const snapshot = await adminDb().collection("users").doc(user.uid).get();
    return noStoreJson({ profile: snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await authenticate(request);
    rateLimit(`profile-write:${user.uid}`, 20, 60_000);
    const input = profileSchema.parse(await request.json());
    const ref = adminDb().collection("users").doc(user.uid);
    const existing = await ref.get();
    const now = new Date().toISOString();
    await ref.set({
      displayName: input.displayName,
      email: user.email ?? null,
      updatedAt: now,
      ...(!existing.exists ? { createdAt: now } : {}),
    }, { merge: true });
    return noStoreJson({ profile: { id: user.uid, ...input, email: user.email ?? null, updatedAt: now } });
  } catch (error) {
    return apiError(error);
  }
}
