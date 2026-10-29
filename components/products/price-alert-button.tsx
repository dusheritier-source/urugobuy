"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, BellOff, LoaderCircle } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { useRefreshPriceAlerts } from "@/components/notifications/price-alert-inbox";
import type { PriceAlert } from "@/lib/price-alerts";

export function PriceAlertButton({ productId, className }: { productId: string; className?: string }) {
  const { user, loading } = useAuth();
  const refresh = useRefreshPriceAlerts();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [email, setEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const version = useRef(0);
  useEffect(() => {
    const contextVersion = version;
    contextVersion.current++; setOpen(false); setTarget(""); setEmail(false); setMessage(""); setBusy(false);
    return () => { contextVersion.current++; };
  }, [user?.uid, productId]);
  const query = useQuery({
    queryKey: ["price-alerts", user?.uid, productId], enabled: Boolean(user), staleTime: 30_000, retry: false,
    queryFn: async ({ signal }) => {
      const token = await user!.getIdToken();
      const response = await fetch(`/api/price-alerts?productId=${encodeURIComponent(productId)}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Could not check your price alert");
      return data as { active: boolean; alert: PriceAlert | null; currency: string; emailAvailable: boolean; emailVerified: boolean };
    },
  });
  const active = query.data?.active === true;
  async function save(pause = false) {
    if (!user || busy) return;
    if (!pause && target !== "" && (!Number.isFinite(Number(target)) || Number(target) < 0)) { setMessage("Enter a valid target price."); return; }
    const current = version.current;
    setBusy(true); setMessage("");
    try {
      const token = await user.getIdToken(true);
      if (version.current !== current) return;
      const response = await fetch("/api/price-alerts", { method: pause ? "DELETE" : "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(pause ? { productId } : { productId, targetPrice: target === "" ? null : Number(target), emailEnabled: email }) });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Could not save this alert");
      if (version.current !== current) return;
      await refresh();
      setMessage(pause ? "Price alert paused." : "Price alert saved. New price drops will appear in your account.");
    } catch (error) { if (version.current === current) setMessage(error instanceof Error ? error.message : "Please try again."); }
    finally { if (version.current === current) setBusy(false); }
  }
  if (!user && !loading) return <Button asChild type="button" variant="outline" className={className}><Link href="/login"><Bell size={17} /> Sign in for price alerts</Link></Button>;
  return <div className={className}>
    <Button type="button" variant="outline" className="w-full gap-2" disabled={loading || query.isPending || busy} aria-expanded={open} onClick={() => { setTarget(query.data?.alert?.targetPrice == null ? "" : String(query.data.alert.targetPrice)); setEmail(query.data?.alert?.emailEnabled === true); setMessage(""); setOpen(!open); }}>
      {query.isPending || busy ? <LoaderCircle size={17} className="animate-spin" /> : <Bell size={17} />}{loading || query.isPending ? "Checking price alert…" : active ? "Manage price alert" : "Alert me when the price drops"}
    </Button>
    {query.isError && <p role="alert" className="mt-2 text-xs text-red-700 dark:text-red-300">Could not load your alert. <button type="button" onClick={() => query.refetch()} className="font-semibold underline">Retry</button></p>}
    {open && query.data && <form onSubmit={(event) => { event.preventDefault(); save(); }} className="mt-3 space-y-4 rounded-2xl border border-stone-200 bg-[#fffbf5] p-4 dark:border-white/15 dark:bg-slate-900">
      <p className="text-sm leading-6 text-stone-600 dark:text-stone-300">Get an in-app notification when the discounted price reaches a new low. Leave the target empty for any price drop.</p>
      <label className="block text-sm font-semibold">Target price ({query.data.currency}) <span className="font-normal text-stone-400">optional</span><input aria-label="Target price" type="number" min="0" step="0.01" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Any price drop" disabled={busy} className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none focus:border-[#8B4513] dark:border-white/20 dark:bg-slate-950" /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={email} disabled={busy || (!email && (!query.data.emailAvailable || !query.data.emailVerified))} onChange={(event) => setEmail(event.target.checked)} className="accent-[#8B4513]" />Also email me</label>
      {!query.data.emailAvailable ? <p className="text-xs text-stone-500 dark:text-stone-400">Email delivery is currently unavailable. In-app alerts are available.</p> : !query.data.emailVerified && <p className="text-xs text-stone-500 dark:text-stone-400">Verify your account email to enable email alerts.</p>}
      <div className="flex flex-wrap gap-2"><Button type="submit" disabled={busy} className="gap-2">{busy && <LoaderCircle size={15} className="animate-spin" />}Save price alert</Button>{active && <Button type="button" variant="outline" disabled={busy} onClick={() => save(true)} className="gap-2"><BellOff size={15} />Pause alert</Button>}</div>
      <Link href="/profile/price-alerts" className="inline-block text-xs font-semibold text-[#8B4513] underline dark:text-orange-300">View all price alerts</Link>
      {message && <p role="status" className="text-sm">{message}</p>}
    </form>}
  </div>;
}
