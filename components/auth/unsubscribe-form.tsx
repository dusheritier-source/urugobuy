"use client";

import { useState } from "react";
import Link from "next/link";

export function UnsubscribeForm({ token }: { token: string }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const unsubscribe = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/email/unsubscribe?token=${encodeURIComponent(token)}`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Could not update your email preferences");
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update your email preferences");
    } finally {
      setBusy(false);
    }
  };

  if (done) return <p role="status" className="mt-5 text-sm font-medium text-green-700">You have been unsubscribed from marketing emails. Essential account and order messages may still be sent.</p>;
  return <div className="mt-5">
    <button type="button" disabled={busy || !token} onClick={unsubscribe} className="w-full rounded-full bg-[#8B4513] py-3 font-semibold text-white disabled:opacity-50">{busy ? "Updating…" : "Unsubscribe"}</button>
    {!token && <p className="mt-3 text-sm text-red-700">This unsubscribe link is missing its token.</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <Link href="/" className="mt-4 inline-block text-sm font-semibold text-[#8B4513]">Return to Urugo Buy</Link>
  </div>;
}
