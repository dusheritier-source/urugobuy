"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/components/auth/auth-provider";

export default function EmailPreferencesPage() {
  const { user, loading } = useAuth();
  const [newsletter, setNewsletter] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    if (!user) { setLoaded(!loading); setNewsletter(false); return; }
    let cancelled = false;
    setLoaded(false);
    void (async () => {
      try {
        await user.reload();
        const token = await user.getIdToken(true);
        const response = await fetch("/api/profile/email-preferences", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error?.message ?? "Could not load email preferences");
        if (!cancelled) setNewsletter(data.newsletter === true);
        if (!cancelled) setEmailVerified(data.emailVerified === true);
      } catch (error) {
        if (!cancelled) toast.error(error instanceof Error ? error.message : "Could not load email preferences");
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [user, loading]);

  const save = async () => {
    if (!user) return;
    setBusy(true);
    try {
      await user.reload();
      const token = await user.getIdToken(true);
      const response = await fetch("/api/profile/email-preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newsletter }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message ?? "Could not save email preferences");
      setNewsletter(data.newsletter === true);
      toast.success("Email preferences saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save email preferences");
    } finally {
      setBusy(false);
    }
  };

  return <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
    <div><h1 className="text-3xl font-bold text-stone-900 dark:text-white">Email Preferences</h1><p className="mt-2 text-stone-600 dark:text-stone-300">Choose whether you want to receive promotional emails from Urugo Buy.</p></div>
    {!user && !loading ? <div className="rounded-2xl border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900"><p className="text-sm text-stone-600 dark:text-stone-300">Sign in to manage your newsletter subscription.</p><Link href="/login" className="mt-4 inline-block font-semibold text-[#8B4513]">Sign in</Link></div> : <section className="rounded-[20px] border border-stone-200/70 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <label className="flex items-start gap-4">
        <Mail size={24} className="mt-1 shrink-0 text-[#8B4513]" />
        <span className="flex-1"><span className="block font-semibold text-stone-900 dark:text-white">Newsletter and promotions</span><span className="mt-1 block text-sm text-stone-600 dark:text-stone-300">Occasional new arrivals, shopping news, and special offers. You can unsubscribe at any time.</span>{loaded && user && !emailVerified && <span className="mt-2 block text-sm text-amber-700">Verify your email address before subscribing to marketing emails.</span>}</span>
        <input type="checkbox" checked={newsletter} disabled={!loaded || busy || !user || (!emailVerified && !newsletter)} onChange={(event) => setNewsletter(event.target.checked)} className="mt-1 h-5 w-5 accent-[#8B4513]" aria-label="Subscribe to newsletter and promotions" />
      </label>
      <button onClick={save} disabled={!loaded || busy || !user} className="mt-6 w-full rounded-full bg-[#8B4513] py-3 font-semibold text-white transition hover:bg-[#6d3410] disabled:opacity-50">{busy ? "Saving…" : "Save preferences"}</button>
    </section>}
  </main>;
}
