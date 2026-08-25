import { existsSync, readFileSync } from "node:fs";

const file = ".env.local";
if (!existsSync(file)) {
  console.error("Missing .env.local. Copy .env.local.example first.");
  process.exit(1);
}

const values = Object.fromEntries(
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const at = line.indexOf("=");
      return [line.slice(0, at), line.slice(at + 1).trim()];
    }),
);

const required = [
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_ADMIN_PROJECT_ID",
  "FIREBASE_ADMIN_CLIENT_EMAIL",
  "FIREBASE_ADMIN_PRIVATE_KEY",
  "FLW_SECRET_KEY",
  "FLW_SECRET_HASH",
  "PAYMENT_CURRENCY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "RESEND_WEBHOOK_SECRET",
  "EMAIL_JOB_SECRET",
  "NEXT_PUBLIC_SITE_URL",
];
const missing = required.filter((key) => !values[key]);
const errors = [];

if (missing.length) errors.push(`Missing launch variables: ${missing.join(", ")}`);

try {
  const site = new URL(values.NEXT_PUBLIC_SITE_URL);
  if (site.protocol !== "https:") errors.push("NEXT_PUBLIC_SITE_URL must use HTTPS for production.");
  if (["localhost", "127.0.0.1"].includes(site.hostname)) errors.push("NEXT_PUBLIC_SITE_URL cannot point to localhost.");
} catch {
  errors.push("NEXT_PUBLIC_SITE_URL must be a valid absolute URL.");
}

if (values.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  const expectedAuthDomain = `${values.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`;
  if (values.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN !== expectedAuthDomain) {
    errors.push(`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN should be ${expectedAuthDomain}.`);
  }
}

if (values.FIREBASE_ADMIN_PROJECT_ID && values.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  && values.FIREBASE_ADMIN_PROJECT_ID !== values.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  errors.push("Firebase client and Admin project IDs must match.");
}

if (values.FIREBASE_ADMIN_PRIVATE_KEY && !values.FIREBASE_ADMIN_PRIVATE_KEY.includes("BEGIN PRIVATE KEY")) {
  errors.push("FIREBASE_ADMIN_PRIVATE_KEY is not a valid service-account private key.");
}

if (values.PAYMENT_CURRENCY && !/^[A-Z]{3}$/.test(values.PAYMENT_CURRENCY)) {
  errors.push("PAYMENT_CURRENCY must be an uppercase ISO 4217 currency code such as USD or RWF.");
}

if (values.FLW_SECRET_HASH && values.FLW_SECRET_HASH.length < 32) {
  errors.push("FLW_SECRET_HASH must be a random value of at least 32 characters.");
}

if (values.EMAIL_JOB_SECRET && values.EMAIL_JOB_SECRET.length < 32) {
  errors.push("EMAIL_JOB_SECRET must be a random value of at least 32 characters.");
}

if (values.RESEND_WEBHOOK_SECRET && !values.RESEND_WEBHOOK_SECRET.startsWith("whsec_")) {
  errors.push("RESEND_WEBHOOK_SECRET must be the whsec_ signing secret from Resend.");
}

if (values.NEXT_PUBLIC_GA_MEASUREMENT_ID && !/^G-[A-Z0-9]+$/.test(values.NEXT_PUBLIC_GA_MEASUREMENT_ID)) {
  errors.push("NEXT_PUBLIC_GA_MEASUREMENT_ID must use the G-XXXXXXXX format.");
}

if (errors.length) {
  errors.forEach((error) => console.error(error));
  process.exit(1);
}

console.log("Launch environment check passed.");
