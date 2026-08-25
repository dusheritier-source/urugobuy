import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [, , email, role] = process.argv;
if (!email || !["staff", "admin", "customer"].includes(role)) {
  console.error("Usage: npm run admin:set-role -- user@example.com staff|admin|customer");
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!projectId || !clientEmail || !privateKey) {
  console.error("Firebase Admin credentials are missing from .env.local");
  process.exit(1);
}

const app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
const existing = user.customClaims ?? {};
const claims = { ...existing, staff: role === "staff" || role === "admin", admin: role === "admin" };
if (role === "customer") {
  delete claims.staff;
  delete claims.admin;
}
await auth.setCustomUserClaims(user.uid, claims);
console.log(`Updated ${email} to role: ${role}. The user must refresh their sign-in token.`);
