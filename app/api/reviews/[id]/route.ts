import { ApiError, apiError, noStoreJson, requireStaff } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { z } from "zod";

const moderationSchema = z.object({ status: z.enum(["published", "rejected"]) });
type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  try {
    const staff = await requireStaff(request);
    rateLimit(`review-moderate:${staff.uid}`, 120, 60_000);
    const { id } = await params;
    const input = moderationSchema.parse(await request.json());
    const ref = adminDb().collection("reviews").doc(id);
    if (!(await ref.get()).exists) throw new ApiError(404, "Review not found", "not_found");
    const update = { ...input, moderatedAt: new Date().toISOString(), moderatedBy: staff.uid };
    await ref.update(update);
    return noStoreJson({ review: { id, ...update } });
  } catch (error) {
    return apiError(error);
  }
}
