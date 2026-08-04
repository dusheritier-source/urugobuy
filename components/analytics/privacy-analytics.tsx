"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "./google-analytics";
import { HeatmapTracker } from "./heatmap-tracker";
import { useConsentStore } from "@/store/consent-store";

export function PrivacyAnalytics() {
  const [mounted, setMounted] = useState(false);
  const choice = useConsentStore((state) => state.choice);
  const setChoice = useConsentStore((state) => state.setChoice);
  const pathname = usePathname();
  const allowHeatmap = !pathname.startsWith("/admin") && !pathname.startsWith("/checkout") && !pathname.startsWith("/profile");
  useEffect(() => { const timer = window.setTimeout(() => setMounted(true), 0); return () => window.clearTimeout(timer); }, []);
  if (!mounted) return null;
  return <>
    {choice === "all" && <><GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? ""} />{allowHeatmap && <HeatmapTracker trackingId={process.env.NEXT_PUBLIC_CLARITY_ID} />}</>}
    {choice === "unset" && <div role="dialog" aria-label="Cookie preferences" className="fixed bottom-4 left-4 right-4 z-[120] mx-auto max-w-2xl rounded-[24px] border border-stone-200 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900"><p className="font-semibold">Your privacy choices</p><p className="mt-2 text-sm text-stone-600 dark:text-stone-300">Necessary storage keeps your cart and account working. With permission, anonymous analytics helps improve shopping. Sensitive forms, checkout fields, and admin pages are excluded from heatmaps.</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => setChoice("all")} className="rounded-full bg-[#8B4513] px-5 py-2 text-sm font-semibold text-white">Accept analytics</button><button onClick={() => setChoice("necessary")} className="rounded-full border border-stone-300 px-5 py-2 text-sm font-semibold">Necessary only</button><Link href="/privacy" className="px-3 py-2 text-sm font-semibold text-[#8B4513]">Privacy policy</Link></div></div>}
  </>;
}
