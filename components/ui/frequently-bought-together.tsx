"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { catalogImageUrl } from "@/lib/catalog-image.mjs";
import Link from "next/link";
import type { Route } from "next";
import { Check, LoaderCircle, ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import { complementaryProducts } from "@/lib/recommendations";
import { sellingPrice } from "@/lib/product-pricing";
import { useCartStore } from "@/store/cart-store";
import { useLocale } from "@/components/locale/locale-context";
import { cn } from "@/lib/utils";

export function FrequentlyBoughtTogether({ currentProductId, products, currency = "USD", className }: { currentProductId: string; products: Product[]; currency?: string; className?: string }) {
  const suggestions = useMemo(() => complementaryProducts(products, currentProductId), [products, currentProductId]);
  const current = products.find((product) => product.id === currentProductId);
  const [selected, setSelected] = useState<string[]>(() => suggestions.map(({ product }) => product.id));
  const [overrides, setOverrides] = useState<Record<string, Product>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);
  const addBundle = useCartStore((state) => state.addBundle);
  const { locale } = useLocale();
  if (!current || current.stock < 1 || !suggestions.length) return null;
  const fresh = (product: Product) => overrides[product.id] ?? product;
  const chosen = [fresh(current), ...suggestions.filter(({ product }) => selected.includes(product.id)).map(({ product }) => fresh(product))];
  const subtotal = Math.round(chosen.reduce((sum, product) => sum + sellingPrice(product), 0) * 100) / 100;
  const original = Math.round(chosen.reduce((sum, product) => sum + product.price, 0) * 100) / 100;
  const money = (amount: number) => new Intl.NumberFormat("en", { style: "currency", currency }).format(amount);

  async function add() {
    if (busy || added) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/recommendations/bundle", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: chosen.map((product) => ({ productId: product.id, expectedPrice: sellingPrice(product) })) }),
        signal: AbortSignal.timeout(20_000),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (data?.error?.code === "bundle_changed" && Array.isArray(data.products)) {
          const updated: Record<string, Product> = {};
          for (const product of data.products as Product[]) updated[product.id] = product;
          setOverrides((existing) => ({ ...existing, ...updated }));
        }
        throw new Error(data?.error?.message || "These items could not be checked. Please try again.");
      }
      const result = addBundle(data.products as Product[]);
      setMessage(result.message); setAdded(result.accepted);
    } catch (error) { setMessage(error instanceof TypeError ? "Could not connect. Check your connection and try again." : error instanceof Error ? error.message : "Please try again."); }
    finally { setBusy(false); }
  }
  const rows = [{ product: fresh(current), reason: "The product you are viewing", base: true }, ...suggestions.map(({ product, reason }) => ({ product: fresh(product), reason, base: false }))];
  return <section aria-label="Complete your setup" className={cn("rounded-[28px] border border-[#e8d6c3] bg-[#fffbf5] p-4 sm:p-6 dark:border-orange-900/50 dark:bg-slate-900", className)}>
    <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#8B4513] text-white"><ShoppingBag size={20} /></span><div><h2 className="text-xl font-semibold text-stone-900 sm:text-2xl dark:text-white">Complete your setup</h2><p className="mt-2 text-sm leading-6 text-stone-600 dark:text-stone-400">Suggested additions for this product. Choose what you need and check sizes and compatibility before buying.</p></div></div>
    <fieldset className="mt-5 space-y-3"><legend className="sr-only">Choose items for your bundle, one of each</legend>{rows.map(({ product, reason, base }) => <div key={product.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3 sm:gap-4 dark:border-white/10 dark:bg-slate-950">
      <input type="checkbox" aria-label={`Include ${product.title}`} checked={base || selected.includes(product.id)} disabled={base || busy} onChange={(event) => { setSelected((values) => event.target.checked ? [...values, product.id] : values.filter((id) => id !== product.id)); setAdded(false); setMessage(""); }} className="h-4 w-4 shrink-0 accent-[#8B4513]" />
      <Image src={catalogImageUrl(product.images[0])} alt={product.title} width={80} height={80} unoptimized className="h-16 w-16 shrink-0 rounded-xl bg-stone-50 object-contain sm:h-20 sm:w-20" />
      <div className="min-w-0 flex-1"><Link href={`/${locale}/products/${product.slug}` as Route} className="line-clamp-2 text-sm font-semibold text-stone-900 hover:underline dark:text-white">{product.title}</Link><p className="mt-1 text-xs leading-5 text-stone-500 dark:text-stone-400">{reason}</p><p className="mt-1 text-sm font-bold text-[#8B4513] dark:text-orange-300">{money(sellingPrice(product))}<span className="ml-2 text-xs font-normal text-stone-400">× 1</span></p></div>
    </div>)}</fieldset>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 dark:bg-slate-950"><div><p className="text-xs text-stone-500 dark:text-stone-400">Selected item total</p><p aria-label="Selected bundle total" className="mt-1 text-2xl font-bold text-[#8B4513] dark:text-orange-300">{money(subtotal)}</p>{original > subtotal && <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">{money(original - subtotal)} saved through existing item discounts</p>}</div><button type="button" onClick={add} disabled={busy || added} className="inline-flex items-center gap-2 rounded-full bg-[#8B4513] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#6d3410] disabled:opacity-60">{busy ? <LoaderCircle size={17} className="animate-spin" /> : added ? <Check size={17} /> : <ShoppingBag size={17} />}{busy ? "Checking prices and stock…" : added ? "Added to cart" : `Add ${chosen.length} selected items`}</button></div>
    <p className="mt-3 text-xs leading-5 text-stone-500 dark:text-stone-400">One of each selected item. Shipping and tax are calculated at checkout. Price changes require your confirmation.</p>
    {message && <p role="status" className="mt-3 rounded-xl bg-white p-3 text-sm text-stone-800 dark:bg-slate-950 dark:text-stone-200">{message}</p>}
  </section>;
}
