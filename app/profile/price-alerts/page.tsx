"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Bell, BellOff, TrendingDown } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocale } from "@/components/locale/locale-context";
import { usePriceAlertInbox, useRefreshPriceAlerts } from "@/components/notifications/price-alert-inbox";
import type { PriceAlert } from "@/lib/price-alerts";

type Page = { alerts: PriceAlert[]; nextCursor: string | null };
const money = (value: number | null | undefined, currency: string) => typeof value === "number" && Number.isFinite(value) ? new Intl.NumberFormat("en", { style: "currency", currency }).format(value) : "—";
export default function PriceAlertsPage() {
  const { user, loading } = useAuth();
  const { locale } = useLocale();
  const [notificationCursor, setNotificationCursor] = useState<string | null>(null);
  const [previousCursors, setPreviousCursors] = useState<Array<string | null>>([]);
  const inbox = usePriceAlertInbox(notificationCursor);
  const refresh = useRefreshPriceAlerts();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const watches = useInfiniteQuery({
    queryKey: ["price-alerts", user?.uid, "list"], enabled: Boolean(user), initialPageParam: null as string | null, retry: false,
    queryFn: async ({ pageParam, signal }): Promise<Page> => {
      const token = await user!.getIdToken();
      const response = await fetch(`/api/price-alerts${pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Could not load your price alerts");
      return data;
    },
    getNextPageParam: (page) => page.nextCursor,
  });
  async function change(method: "DELETE" | "PATCH", input: unknown, id: string) {
    if (!user || busy) return;
    setBusy(id); setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/price-alerts", { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(input) });
      if (!response.ok) { const data = await response.json(); throw new Error(data?.error?.message || "Could not update alerts"); }
      await refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Please try again."); }
    finally { setBusy(null); }
  }
  const alerts = watches.data?.pages.flatMap((page) => page.alerts) ?? [];
  const notifications = inbox.data?.notifications ?? [];
  const unread = notifications.filter((item) => !item.read);
  return <main className="mx-auto max-w-5xl space-y-7 px-4 py-10 sm:px-6">
    <Link href="/profile" className="text-sm font-semibold text-[#8B4513] dark:text-orange-300">← Your account</Link>
    <div className="rounded-3xl border border-stone-200 bg-[#fffaf4] p-6 dark:border-white/10 dark:bg-slate-900"><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8B4513] dark:text-orange-300"><TrendingDown size={16} /> Shop at your price</p><h1 className="mt-3 text-3xl font-semibold">Your price alerts</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600 dark:text-stone-300">Watch a product from its page. New price drops appear here and in the notification bell. Alerts stay active for further new lows until you pause them.</p></div>
    {!user ? <section className="rounded-2xl border border-stone-200 p-6 dark:border-white/10"><p>{loading ? "Loading your account…" : "Sign in to save products and receive price-drop alerts."}</p>{!loading && <Link href="/login" className="mt-4 inline-block rounded-full bg-[#8B4513] px-5 py-3 text-sm font-semibold text-white">Sign in</Link>}</section> : <>
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</p>}
      <section aria-label="Price drop notifications" className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-semibold">Recent price drops</h2>{unread.length > 0 && <button type="button" disabled={busy !== null} onClick={() => change("PATCH", { notificationIds: unread.map((item) => item.id) }, "read")} className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold dark:border-white/20">Mark shown alerts as read</button>}</div>
        {inbox.isPending ? <p role="status" className="mt-4 text-sm text-stone-500">Loading notifications…</p> : inbox.isError ? <p role="alert" className="mt-4 text-sm">Could not load notifications. <button onClick={() => inbox.refetch()} className="underline">Retry</button></p> : notifications.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2">{notifications.map((item) => <article key={item.id} className="rounded-2xl border border-stone-200 p-4 dark:border-white/10"><p className="text-xs font-semibold text-[#8B4513] dark:text-orange-300">{item.read ? "Price drop" : "New price drop"}</p><h3 className="mt-2 font-semibold">{item.productTitle}</h3><p className="mt-2 text-sm"><del className="mr-2 text-stone-400">{money(item.oldPrice, item.currency)}</del><strong>{money(item.newPrice, item.currency)}</strong></p><p className="mt-2 text-xs text-stone-500">{new Date(item.createdAt).toLocaleString()}</p><Link href={`/${locale}/products/${item.productSlug}` as Route} className="mt-3 inline-block text-sm font-semibold text-[#8B4513] underline dark:text-orange-300">View product</Link><p className="mt-2 text-xs text-stone-500">Price and availability may change.</p></article>)}</div> : <p className="mt-4 text-sm text-stone-500">No price drops yet. Start watching a product below its purchase options.</p>}
        <div className="mt-4 flex gap-2">{previousCursors.length > 0 && <button type="button" disabled={inbox.isFetching} onClick={() => { setNotificationCursor(previousCursors.at(-1) ?? null); setPreviousCursors((values) => values.slice(0, -1)); }} className="rounded-full border border-stone-200 px-4 py-2 text-xs dark:border-white/20">Newer notifications</button>}{inbox.data?.nextNotificationCursor && <button type="button" disabled={inbox.isFetching} onClick={() => { setPreviousCursors((values) => [...values, notificationCursor]); setNotificationCursor(inbox.data!.nextNotificationCursor); }} className="rounded-full border border-stone-200 px-4 py-2 text-xs dark:border-white/20">Older notifications</button>}</div>
      </section>
      <section aria-label="Watched products" className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-white/10 dark:bg-slate-900"><h2 className="flex items-center gap-2 text-xl font-semibold"><Bell size={19} />Watched products</h2>
        {watches.isPending ? <p role="status" className="mt-4 text-sm text-stone-500">Loading watched products…</p> : watches.isError ? <p role="alert" className="mt-4 text-sm">Could not load watches. <button onClick={() => watches.refetch()} className="underline">Retry</button></p> : alerts.length ? <div className="mt-4 space-y-3">{alerts.map((alert) => <article key={alert.productId} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 p-4 dark:border-white/10"><div><h3 className="font-semibold">{alert.productTitle}</h3><p className="mt-1 text-xs text-stone-500">{alert.active ? "Watching" : "Paused"} · {alert.targetPrice == null ? "Any new low" : `Target ${money(alert.targetPrice, alert.currency)}`} · {alert.emailEnabled ? "In-app + email" : "In-app"}</p><p className="mt-2 text-sm">Current: <strong>{money(alert.currentPrice, alert.currency)}</strong><span className="ml-3 text-xs text-stone-500">Started at {money(alert.priceAtSubscription, alert.currency)}</span></p>{!alert.available && <p className="mt-1 text-xs text-stone-500">This product is currently unavailable.</p>}</div><div className="flex flex-wrap gap-2">{alert.available && <Link href={`/${locale}/products/${alert.productSlug}` as Route} className="rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold dark:border-white/20">Manage on product page</Link>}{alert.active && <button type="button" disabled={busy !== null} onClick={() => change("DELETE", { productId: alert.productId }, alert.productId)} aria-label={`Pause ${alert.productTitle}`} className="inline-flex items-center gap-1 rounded-full border border-stone-200 px-4 py-2 text-xs font-semibold dark:border-white/20"><BellOff size={13} />{busy === alert.productId ? "Pausing…" : "Pause alert"}</button>}</div></article>)}</div> : <p className="mt-4 text-sm text-stone-500">You are not watching any products yet. <Link href={`/${locale}/products` as Route} className="font-semibold underline">Browse products</Link></p>}
        {watches.hasNextPage && <button type="button" disabled={watches.isFetching} onClick={() => watches.fetchNextPage()} className="mt-4 rounded-full border border-stone-200 px-4 py-2 text-sm dark:border-white/20">{watches.isFetching ? "Loading…" : "Load more watches"}</button>}
      </section>
    </>}
  </main>;
}
