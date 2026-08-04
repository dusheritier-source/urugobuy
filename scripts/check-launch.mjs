import { existsSync, readFileSync } from "node:fs";
const file = ".env.local";
if (!existsSync(file)) { console.error("Missing .env.local. Copy .env.local.example first."); process.exit(1); }
const values = Object.fromEntries(readFileSync(file, "utf8").split(/\r?\n/).filter((line) => line && !line.startsWith("#") && line.includes("=")).map((line) => { const at = line.indexOf("="); return [line.slice(0, at), line.slice(at + 1).trim()]; }));
const required = ["NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "NEXT_PUBLIC_FIREBASE_PROJECT_ID", "NEXT_PUBLIC_FIREBASE_APP_ID", "NEXT_PUBLIC_SITE_URL"];
const missing = required.filter((key) => !values[key]);
if (missing.length) { console.error(`Missing launch variables: ${missing.join(", ")}`); process.exit(1); }
if (!/^https:\/\//.test(values.NEXT_PUBLIC_SITE_URL)) { console.error("NEXT_PUBLIC_SITE_URL must use HTTPS for production."); process.exit(1); }
console.log("Launch environment check passed.");
