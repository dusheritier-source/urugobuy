import { apiError, noStoreJson, requireStaff } from "@/lib/server/api";
import { adminDb } from "@/lib/server/firebase-admin";
import { verifyTransactionByReference } from "@/lib/server/flutterwave";
import { reconcileTransaction } from "@/lib/server/payments";
import { rateLimit } from "@/lib/server/rate-limit";

export async function POST(request: Request) {
  try {
    const staff = await requireStaff(request);
    rateLimit(`payment-reconcile:${staff.uid}`, 5, 60 * 60_000);
    const snapshot = await adminDb().collection("payments").where("status", "==", "pending").limit(50).get();
    const results = await Promise.all(snapshot.docs.map(async (document) => {
      const payment = document.data();
      try {
        const verified = await verifyTransactionByReference(String(payment.reference));
        const result = await reconcileTransaction(verified.id);
        return { paymentId: document.id, ...result };
      } catch (error) {
        return { paymentId: document.id, status: "unresolved", message: error instanceof Error ? error.message : "Unknown error" };
      }
    }));
    return noStoreJson({ checked: results.length, results });
  } catch (error) {
    return apiError(error);
  }
}
