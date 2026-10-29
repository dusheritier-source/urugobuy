import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, apiError, requireAdmin } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { rateLimit } from "@/lib/server/rate-limit";
import { emailUnsubscribeUrls } from "@/lib/server/email-unsubscribe";

const campaignSchema = z.object({
  subject: z.string().trim().min(3).max(120).regex(/^[^\r\n]+$/),
  message: z.string().trim().min(10).max(10_000),
});
const WRITE_BATCH_SIZE = 450;

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin(request);
    rateLimit(`email-campaign:${admin.uid}`, 5, 60 * 60_000);
    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.EMAIL_JOB_SECRET || !process.env.BUSINESS_POSTAL_ADDRESS) {
      throw new ApiError(503, "Email sending, unsubscribe, and business mailing address settings must be configured before sending campaigns.", "email_unavailable");
    }
    const input = campaignSchema.parse(await request.json());
    const db = adminDb();
    const recipients = await db.collectionGroup("emailPreferences")
      .where("newsletter", "==", true)
      .where("emailVerified", "==", true)
      .get();
    const eligible = recipients.docs.filter((document) => {
      const data = document.data();
      return data.emailVerified === true && typeof data.userId === "string" && typeof data.email === "string" && data.email.includes("@");
    });
    if (eligible.length === 0) throw new ApiError(409, "There are no opted-in subscribers to email.", "no_subscribers");

    const campaignId = randomUUID();
    const now = new Date().toISOString();
    const campaignRef = db.collection("emailCampaigns").doc(campaignId);
    let campaignCreated = false;
    try {
      for (let start = 0; start < eligible.length; start += WRITE_BATCH_SIZE) {
        const batch = db.batch();
        if (start === 0) {
          batch.create(campaignRef, {
            subject: input.subject,
            message: input.message,
            status: "preparing",
            recipientCount: eligible.length,
            createdBy: admin.uid,
            createdAt: now,
          });
        }
        for (const recipient of eligible.slice(start, start + WRITE_BATCH_SIZE)) {
          const data = recipient.data();
          const userId = String(data.userId);
          const recipientHash = createHash("sha256").update(userId).digest("hex");
          const jobRef = db.collection("notificationQueue").doc(`campaign_${campaignId}_${recipientHash}`);
          const unsubscribe = emailUnsubscribeUrls(userId);
          batch.create(jobRef, {
            type: "newsletter_campaign",
            campaignId,
            userId,
            email: String(data.email),
            subject: input.subject,
            message: input.message,
            unsubscribeUrl: unsubscribe.page,
            oneClickUnsubscribeUrl: unsubscribe.oneClick,
            status: "pending",
            createdAt: now,
          });
        }
        await batch.commit();
        if (start === 0) campaignCreated = true;
      }
      await campaignRef.update({ status: "queued", queuedAt: new Date().toISOString() });
    } catch (error) {
      if (campaignCreated) await campaignRef.update({ status: "failed", failedAt: new Date().toISOString() });
      throw error;
    }
    return NextResponse.json({ campaignId, queued: eligible.length }, { status: 202 });
  } catch (error) {
    return apiError(error);
  }
}
