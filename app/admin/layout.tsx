import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminAuth } from "@/lib/server/firebase-admin";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return children;

  const session = (await cookies()).get("urugo_session")?.value;
  if (!session) redirect("/login?returnTo=/admin");

  let authorized = false;
  try {
    const user = await adminAuth().verifySessionCookie(session, true);
    authorized = user.staff === true || user.admin === true;
  } catch {}
  if (!authorized) redirect("/login?returnTo=/admin");

  return children;
}
