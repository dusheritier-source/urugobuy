"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Route } from "next";
import { Camera, Check, ImagePlus, LoaderCircle, Search, Upload, X } from "lucide-react";
import { sellingPrice } from "@/lib/product-pricing";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale/locale-context";
import type { Product } from "@/types";

type Match = { product: Product; similarity: number };
type SearchResponse = { results: Match[]; indexedProducts: number; unavailableProducts: number };
const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";

export function VisualSearch({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { locale } = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [category, setCategory] = useState("");
  const [inStock, setInStock] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const generation = useRef(0);

  const cancelSearch = useCallback(() => {
    generation.current++;
    requestRef.current?.abort();
    requestRef.current = null;
    setBusy(false);
  }, []);
  const close = useCallback(() => {
    cancelSearch();
    setOpen(false);
    setFile(null);
    setError("");
    setResponse(null);
    setCategory("");
    setInStock(false);
  }, [cancelSearch]);

  useEffect(() => { setReady(true); }, []);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => () => { requestRef.current?.abort(); }, []);
  useEffect(() => {
    if (!open) return;
    const previousFocus = (document.activeElement as HTMLElement | null) ?? triggerRef.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], select, input:not([type="file"]), [tabindex="0"]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [open, close]);

  function chooseFile(next: File) {
    cancelSearch();
    setResponse(null);
    setCategory("");
    setInStock(false);
    setError("");
    setFile(null);
    if (!ACCEPT.split(",").includes(next.type)) { setError("Use a JPG, PNG, or WebP photo."); return; }
    if (!next.size || next.size > MAX_BYTES) { setError("Choose a photo smaller than 10 MB."); return; }
    setFile(next);
  }

  async function search() {
    if (!file) return;
    cancelSearch();
    const current = generation.current;
    const controller = new AbortController();
    requestRef.current = controller;
    setBusy(true);
    setError("");
    setResponse(null);
    const timeout = window.setTimeout(() => controller.abort("timeout"), 290_000);
    try {
      const form = new FormData();
      form.append("image", file);
      const result = await fetch("/api/search/visual", { method: "POST", body: form, signal: controller.signal });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error?.message || "Photo search failed. Please try again.");
      if (current === generation.current) setResponse(data as SearchResponse);
    } catch (failure) {
      if (current !== generation.current) return;
      if (controller.signal.aborted) setError("The search took too long. Please try again.");
      else setError(failure instanceof Error ? failure.message : "Could not connect. Check your connection and try again.");
    } finally {
      window.clearTimeout(timeout);
      if (current === generation.current) { setBusy(false); requestRef.current = null; }
    }
  }

  const categories = [...new Set(response?.results.map((match) => match.product.category) ?? [])].sort();
  const matches = response?.results.filter(({ product }) => (!category || product.category === category) && (!inStock || product.stock > 0)) ?? [];
  const buttonStyle = "inline-flex items-center justify-center gap-2 rounded-full border border-stone-300 px-4 py-2.5 text-sm font-semibold transition hover:border-[#8B4513] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B4513] dark:border-white/20";

  return <>
    <button ref={triggerRef} type="button" disabled={!ready} onClick={() => setOpen(true)} aria-label="Search by photo" aria-haspopup="dialog" className={cn(buttonStyle, "shrink-0 text-stone-700 dark:text-stone-200", className)}>
      <Camera size={19} />{showLabel && <span>Search by photo</span>}
    </button>
    {open && createPortal(
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} tabIndex={-1} className="relative max-h-[92dvh] w-full max-w-4xl overflow-y-auto overscroll-contain rounded-3xl bg-white p-5 text-stone-900 shadow-2xl outline-none sm:p-8 dark:bg-slate-950 dark:text-stone-100">
          <button type="button" onClick={close} aria-label="Close photo search" className="absolute right-4 top-4 rounded-full p-2 hover:bg-stone-100 dark:hover:bg-white/10"><X size={21} /></button>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#8B4513] dark:text-orange-300"><Camera size={17} /> Discover with a photo</p>
          <h2 id={`${id}-title`} className="mt-3 pr-8 text-2xl font-semibold sm:text-3xl">See it. Find it on Urugo.</h2>
          <p id={`${id}-description`} className="mt-2 max-w-xl text-sm leading-6 text-stone-600 dark:text-stone-300">Upload a clear photo of one product to find visually similar items in our catalog. A plain background works best.</p>
          <input ref={uploadRef} type="file" accept={ACCEPT} className="hidden" aria-label="Upload product photo" onChange={(event) => { const chosen = event.target.files?.[0]; event.target.value = ""; if (chosen) chooseFile(chosen); }} />
          <input ref={cameraRef} type="file" accept={ACCEPT} capture="environment" className="hidden" aria-label="Take product photo" onChange={(event) => { const chosen = event.target.files?.[0]; event.target.value = ""; if (chosen) chooseFile(chosen); }} />
          <div className={cn("mt-6 rounded-2xl border-2 border-dashed p-5 transition sm:p-7", dragging ? "border-[#8B4513] bg-orange-50 dark:bg-orange-950/20" : "border-stone-200 dark:border-white/20")} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); const chosen = event.dataTransfer.files[0]; if (chosen) chooseFile(chosen); }}>
            {preview ? <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Your photo for product matching" className="h-44 w-full rounded-xl bg-stone-100 object-contain sm:w-44 dark:bg-slate-900" />
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{file?.name}</p><p className="mt-1 text-xs text-stone-500">{((file?.size ?? 0) / 1024 / 1024).toFixed(1)} MB · Ready to search</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" className={buttonStyle} onClick={() => uploadRef.current?.click()}><ImagePlus size={16} />Change photo</button><button type="button" className={buttonStyle} onClick={() => { cancelSearch(); setFile(null); setResponse(null); setError(""); }}>Remove</button></div></div>
            </div> : <div className="flex flex-col items-center py-4 text-center"><Upload size={32} className="text-[#8B4513] dark:text-orange-300" /><p className="mt-3 font-semibold">Drop your product photo here</p><p className="mt-1 text-xs text-stone-500 dark:text-stone-400">JPG, PNG, or WebP · Up to 10 MB</p><div className="mt-5 flex flex-wrap justify-center gap-2"><button type="button" className={buttonStyle} onClick={() => uploadRef.current?.click()}><ImagePlus size={17} />Upload photo</button><button type="button" className={cn(buttonStyle, "sm:hidden")} onClick={() => cameraRef.current?.click()}><Camera size={17} />Take photo</button></div></div>}
          </div>
          <p className="mt-3 text-xs leading-5 text-stone-500 dark:text-stone-400">Your photo is processed for this search and is not saved. Matches are suggestions; check each product’s details.</p>
          {error && <div role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}</div>}
          {file && <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={search} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#8B4513] px-6 py-3 text-sm font-semibold text-white hover:bg-[#6d3410] disabled:opacity-60">{busy ? <LoaderCircle size={18} className="animate-spin" /> : <Search size={18} />}{busy ? "Finding similar products…" : "Find similar products"}</button>{busy && <button type="button" className={buttonStyle} onClick={cancelSearch}>Cancel</button>}</div>}
          {busy && <p role="status" className="mt-3 text-sm text-stone-500 dark:text-stone-400">Comparing your photo with product images. The first search can take a few minutes while the search model warms up.</p>}
          {response && <section className="mt-7 border-t border-stone-200 pt-6 dark:border-white/10" aria-label="Photo search results">
            <div aria-live="polite"><h3 className="text-lg font-semibold">{response.results.length ? "Visually similar products" : "No close matches found"}</h3><p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{response.results.length ? `${matches.length} ${matches.length === 1 ? "match" : "matches"} · Best visual matches first` : "Try a closer photo with one item against a plain background, or search by product name."}</p></div>
            {response.unavailableProducts > 0 && <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">Some catalog photos are unavailable, so these results cover {response.indexedProducts} products.</p>}
            {response.results.length > 0 && <div className="my-4 flex flex-wrap items-center gap-3"><select aria-label="Filter photo matches by category" value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm dark:border-white/20 dark:bg-slate-900"><option value="">All categories</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={inStock} onChange={(event) => setInStock(event.target.checked)} className="accent-[#8B4513]" />In stock only</label></div>}
            {matches.length > 0 ? <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">{matches.map(({ product, similarity }) => <Link key={product.id} href={`/${locale}/products/${product.slug}` as Route} onClick={close} className="group overflow-hidden rounded-2xl border border-stone-200 transition hover:border-[#8B4513] dark:border-white/15">
              <div className="relative aspect-square bg-stone-50 dark:bg-slate-900">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.images[0]} alt={product.title} loading="lazy" className="h-full w-full object-contain p-2 transition group-hover:scale-105" />
                {similarity >= 0.9 && <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-[#8B4513] shadow"><Check size={12} />Close visual match</span>}
              </div><div className="p-3"><p className="text-[11px] text-stone-500 dark:text-stone-400">{product.category}</p><h4 className="mt-1 line-clamp-2 text-sm font-semibold">{product.title}</h4><p className="mt-2 font-semibold">${sellingPrice(product).toFixed(2)}</p><p className={cn("mt-1 text-xs", product.stock > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-stone-500")}>{product.stock > 0 ? "In stock" : "Out of stock"}</p></div>
            </Link>)}</div> : response.results.length > 0 && <p className="mt-5 rounded-xl bg-stone-50 p-5 text-sm dark:bg-slate-900">No matches with these filters. <button type="button" onClick={() => { setCategory(""); setInStock(false); }} className="font-semibold underline">Clear filters</button></p>}
            {!response.results.length && <Link href={`/${locale}/products` as Route} onClick={close} className="mt-4 inline-flex text-sm font-semibold text-[#8B4513] underline dark:text-orange-300">Browse all products</Link>}
          </section>}
        </div>
      </div>, document.body)}
  </>;
}
