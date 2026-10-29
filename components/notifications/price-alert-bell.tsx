"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { useLocale } from "@/components/locale/locale-context";
import { usePriceAlertInbox } from "@/components/notifications/price-alert-inbox";
import { cn } from "@/lib/utils";

export function PriceAlertBell({ className }: { className?: string }) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const inbox = usePriceAlertInbox();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", key); };
  }, [open]);
  const count = inbox.data?.unreadCount ?? 0;
  return <div ref={ref} className="relative">
    <button type="button" aria-label="Price alert notifications" aria-expanded={open} onClick={() => setOpen(!open)} className={cn("relative grid h-10 w-10 place-items-center rounded-full border border-stone-200 text-stone-600 hover:border-[#8B4513] dark:border-white/10 dark:text-stone-300", className)}><Bell size={18} />{user && count > 0 && <span aria-label={`${count} unread price alerts`} className="absolute -right-1 -top-1 min-w-4 rounded-full bg-[#8B4513] px-1 text-[10px] font-semibold text-white">{count > 99 ? "99+" : count}</span>}</button>
    {open && <div className="absolute right-0 top-12 z-[80] w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl dark:border-white/15 dark:bg-slate-950">
      <div className="flex items-center justify-between border-b border-stone-100 p-4 dark:border-white/10"><strong className="text-sm">Price alerts</strong><button type="button" onClick={() => setOpen(false)} aria-label="Close price notifications" className="rounded-full p-1"><X size={16} /></button></div>
      {!user ? <div className="p-5 text-sm"><p>Sign in to watch prices and receive alerts.</p><Link href="/login" onClick={() => setOpen(false)} className="mt-3 inline-block font-semibold text-[#8B4513]">Sign in</Link></div> : <>
        <div className="max-h-80 overflow-y-auto p-2">{inbox.isPending ? <p className="p-3 text-sm text-stone-500">Loading alerts…</p> : inbox.isError ? <p className="p-3 text-sm text-stone-500">Could not load alerts. <button onClick={() => inbox.refetch()} className="underline">Retry</button></p> : inbox.data?.notifications.length ? inbox.data.notifications.slice(0, 5).map((item) => <Link key={item.id} href={`/${locale}/products/${item.productSlug}` as Route} onClick={() => setOpen(false)} className="block rounded-xl p-3 hover:bg-stone-50 dark:hover:bg-white/5"><p className="text-sm font-semibold">{!item.read && <span className="mr-1 text-[#8B4513]">●</span>}{item.productTitle}</p><p className="mt-1 text-xs text-stone-500">{item.currency} {item.oldPrice.toFixed(2)} → {item.newPrice.toFixed(2)}</p></Link>) : <p className="p-3 text-sm text-stone-500">No price-drop notifications yet.</p>}</div>
        <Link href="/profile/price-alerts" onClick={() => setOpen(false)} className="block border-t border-stone-100 px-4 py-3 text-sm font-semibold text-[#8B4513] dark:border-white/10 dark:text-orange-300">Manage all price alerts</Link>
      </>}
    </div>}
  </div>;
}
