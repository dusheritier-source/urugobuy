// Process queued price-drop pages. Never prints job credentials or recipients.
const base = process.env.PRICE_ALERT_WORKER_URL || "http://localhost:3000";
const secret = process.env.PRICE_ALERT_JOB_SECRET || process.env.EMAIL_JOB_SECRET;
if (!secret) throw new Error("Configure PRICE_ALERT_JOB_SECRET in the server environment.");
const response = await fetch(new URL("/api/internal/price-alerts", base), { method: "POST", headers: { "x-job-secret": secret }, signal: AbortSignal.timeout(90_000) });
const data = await response.json();
if (!response.ok) throw new Error(`Price-alert processing failed (${response.status}).`);
console.log({ pages: data.results.length, scanned: data.results.reduce((sum, result) => sum + (result.scanned ?? 0), 0), notified: data.results.reduce((sum, result) => sum + (result.notified ?? 0), 0), retriesPending: data.results.filter((result) => result.error).length });
