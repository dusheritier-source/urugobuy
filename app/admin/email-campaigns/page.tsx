"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/components/auth/auth-provider";

export default function EmailCampaignsPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [queued, setQueued] = useState<number | null>(null);

  const sendCampaign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || busy) return;
    if (!window.confirm("Queue this email for every currently opted-in subscriber?")) return;
    setBusy(true);
    setQueued(null);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/admin/email-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subject, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Could not queue campaign");
      setQueued(data.queued);
      setSubject("");
      setMessage("");
      toast.success(`Campaign queued for ${data.queued} subscriber${data.queued === 1 ? "" : "s"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not queue campaign");
    } finally {
      setBusy(false);
    }
  };

  return <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
    <div className="flex items-center gap-3"><Mail className="text-[#8B4513]" /><div><h1 className="text-3xl font-semibold">Email campaigns</h1><p className="mt-1 text-sm text-stone-600 dark:text-stone-300">Send a campaign only to customers who opted in to marketing emails.</p></div></div>
    <form onSubmit={sendCampaign} className="mt-8 space-y-5 rounded-3xl border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
      <label className="block text-sm font-semibold">Subject<input required minLength={3} maxLength={120} value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-stone-200 bg-transparent px-4 font-normal outline-none focus:border-[#8B4513] dark:border-white/10" /></label>
      <label className="block text-sm font-semibold">Message<textarea required minLength={10} maxLength={10_000} rows={10} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 bg-transparent p-4 font-normal outline-none focus:border-[#8B4513] dark:border-white/10" /></label>
      <p className="text-sm text-stone-500">A one-click unsubscribe link is included. This queues one email for every opted-in subscriber. Delivery begins when the email worker runs; large campaigns may take time to drain.</p>
      <button disabled={busy || !user} className="w-full rounded-full bg-[#8B4513] py-3 font-semibold text-white disabled:opacity-50">{busy ? "Queueing…" : "Queue campaign"}</button>
      {queued !== null && <p role="status" className="text-sm font-medium text-green-700">Queued for {queued} subscribers.</p>}
    </form>
  </main>;
}
