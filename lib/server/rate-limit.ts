import "server-only";

import { ApiError } from "@/lib/server/api";

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

/**
 * Process-local safety limit. Production hosting must also enforce distributed
 * edge limits; this prevents accidental bursts within an individual instance.
 */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) throw new ApiError(429, "Too many requests. Please try again later.", "rate_limited");
  if (windows.size > 10_000) {
    for (const [entryKey, entry] of windows) if (entry.resetAt <= now) windows.delete(entryKey);
  }
}
