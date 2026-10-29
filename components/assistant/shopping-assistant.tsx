"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";
import { ArrowUp, Camera, Check, ImagePlus, LoaderCircle, MessageCircle, RotateCcw, ShoppingBag, Sparkles, X } from "lucide-react";
import { useLocale } from "@/components/locale/locale-context";
import { useAuth } from "@/components/auth/auth-provider";
import { useCartStore } from "@/store/cart-store";
import type { AssistantReply, ProductCard } from "@/lib/assistant/core";
import type { Product } from "@/types";
import { cn } from "@/lib/utils";

type Message = { id: string; role: "user" | "assistant"; content: string; reply?: AssistantReply; photo?: boolean };
const prompts = ["Find headphones under $80", "Help me choose a gift", "What is your return policy?"];
const money = (value: number, currency: string) => new Intl.NumberFormat("en", { style: "currency", currency }).format(value);

function ProductResult({ product, locale, onNavigate }: { product: ProductCard; locale: string; onNavigate: () => void }) {
  return <Link onClick={onNavigate} href={`/${locale}/products/${product.slug}` as Route} className="flex gap-3 rounded-2xl border border-stone-200 bg-white p-3 transition hover:border-[#8B4513] dark:border-white/15 dark:bg-slate-900">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={product.images[0]} alt={product.title} className="h-20 w-20 shrink-0 rounded-xl bg-stone-50 object-contain" loading="lazy" />
    <div className="min-w-0"><p className="text-[10px] uppercase tracking-wide text-stone-500 dark:text-stone-400">{product.brand}</p><h4 className="mt-1 line-clamp-2 text-sm font-semibold leading-5">{product.title}</h4><p className="mt-1 text-sm font-bold text-[#8B4513] dark:text-orange-300">{money(product.price, product.currency)}{product.listPrice > product.price && <del className="ml-2 text-xs font-normal text-stone-400">{money(product.listPrice, product.currency)}</del>}</p><p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{product.stock > 0 ? "In stock" : "Out of stock"}</p></div>
  </Link>;
}

export function ShoppingAssistant() {
  const { locale } = useLocale();
  const { user } = useAuth();
  const pathname = usePathname();
  const addItem = useCartStore((state) => state.addItem);
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [cartBusy, setCartBusy] = useState<string | null>(null);
  const [cartStatus, setCartStatus] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [newPrices, setNewPrices] = useState<Record<string, number>>({});
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const upload = useRef<HTMLInputElement>(null);
  const camera = useRef<HTMLInputElement>(null);
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const hidden = pathname?.startsWith("/admin") || pathname?.includes("/checkout");

  const cancel = useCallback(() => { generation.current++; request.current?.abort(); request.current = null; setBusy(false); }, []);
  const close = useCallback(() => { cancel(); setOpen(false); setFile(null); }, [cancel]);
  const reset = useCallback(() => {
    cancel(); setMessages([]); setDraft(""); setFile(null); setError(""); setCartStatus({}); setConfirmed([]); setNewPrices({});
  }, [cancel]);
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { reset(); }, [user?.uid, reset]);
  useEffect(() => () => { request.current?.abort(); }, []);
  useEffect(() => {
    if (!file) { setPreview(null); return; }
    const url = URL.createObjectURL(file); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  useEffect(() => {
    if (!open || hidden) return;
    const controller = new AbortController();
    setAvailable(null);
    fetch("/api/assistant", { signal: controller.signal }).then((response) => response.json()).then((data) => setAvailable(data.available === true)).catch(() => { if (!controller.signal.aborted) setAvailable(false); });
    return () => controller.abort();
  }, [open, hidden]);
  useEffect(() => {
    if (!open || hidden) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); close(); return; }
      if (event.key !== "Tab") return;
      const nodes = panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], textarea:not(:disabled), [tabindex="0"]');
      if (!nodes?.length) return;
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!panel.current?.contains(document.activeElement) || document.activeElement === panel.current) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keydown); previous?.focus(); };
  }, [open, hidden, close]);
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [messages, busy, error]);

  function choosePhoto(next: File) {
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(next.type) || !next.size || next.size > 10 * 1024 * 1024) {
      setError("Choose a JPG, PNG, or WebP photo smaller than 10 MB."); return;
    }
    setFile(next);
  }

  async function send(value = draft) {
    const content = value.trim() || (file ? "Find products similar to this photo." : "");
    if (!content || busy || content.length > 2000 || available !== true) return;
    cancel();
    const current = generation.current;
    const controller = new AbortController(); request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), file ? 360_000 : 80_000);
    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content, photo: Boolean(file) };
    const history = messages.at(-1)?.role === "user" ? messages.slice(0, -1) : messages;
    const next = [...history, userMessage];
    setMessages(next); setDraft(""); setError(""); setBusy(true);
    try {
      let photoProductIds: string[] | undefined;
      if (file) {
        const form = new FormData(); form.append("image", file);
        const result = await fetch("/api/search/visual", { method: "POST", body: form, signal: controller.signal });
        const data = await result.json().catch(() => null);
        if (!result.ok) throw new Error(data?.error?.message || "The photo could not be searched. Try another photo.");
        photoProductIds = data.results.slice(0, 12).map((match: { product: Product }) => match.product.id);
      }
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
      const contextProductIds = [...new Set(history.flatMap((message) => message.reply?.products.map((product) => product.id) ?? []))].slice(-12);
      const response = await fetch("/api/assistant", { method: "POST", headers, signal: controller.signal,
        body: JSON.stringify({ messages: next.slice(-12).map((message) => ({ role: message.role, content: message.content.slice(0, 2000) })), locale, contextProductIds, ...(photoProductIds === undefined ? {} : { photoProductIds }) }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.message || "The assistant is unavailable. Please try again.");
      if (current !== generation.current) return;
      const reply = payload as AssistantReply;
      setMessages([...next, { id: crypto.randomUUID(), role: "assistant", content: reply.message, reply }]);
      setFile(null);
    } catch (failure) {
      if (current !== generation.current) return;
      setDraft(content);
      setError(controller.signal.aborted ? "The request took too long. Please try again." : failure instanceof TypeError ? "Could not connect. Check your connection and try again." : failure instanceof Error ? failure.message : "The assistant is unavailable. Please try again.");
    } finally {
      window.clearTimeout(timeout);
      if (current === generation.current) { setBusy(false); request.current = null; }
    }
  }

  async function confirmCart(message: Message) {
    const proposal = message.reply?.cartProposal;
    if (!proposal || cartBusy) return;
    setCartBusy(message.id);
    setCartStatus((current) => ({ ...current, [message.id]: "" }));
    try {
      const response = await fetch("/api/assistant/cart", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: proposal.product.id, quantity: proposal.quantity, expectedPrice: newPrices[message.id] ?? proposal.product.price }) });
      const data = await response.json();
      if (!response.ok) {
        if (data.error?.code === "price_changed" && Number.isFinite(data.currentPrice)) setNewPrices((current) => ({ ...current, [message.id]: data.currentPrice }));
        throw new Error(data.error?.message || "The product could not be added.");
      }
      const result = addItem(data.product, data.quantity);
      setCartStatus((current) => ({ ...current, [message.id]: result.accepted > 0 ? `${result.accepted} added to your cart.` : "Your cart already contains the available stock." }));
      setConfirmed((current) => [...current, message.id]);
    } catch (failure) { setCartStatus((current) => ({ ...current, [message.id]: failure instanceof Error ? failure.message : "Please try again." })); }
    finally { setCartBusy(null); }
  }

  if (hidden) return null;
  return <>
    <button ref={trigger} type="button" disabled={!mounted} onClick={() => setOpen(true)} aria-label="Open shopping assistant" aria-haspopup="dialog" className="fixed bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-[45] flex items-center gap-2 rounded-full bg-[#8B4513] px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-[#6d3410] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#8B4513] sm:right-6 md:bottom-20"><MessageCircle size={21} /><span className="hidden sm:inline">Ask Urugo</span></button>
    {mounted && open && createPortal(<div className="fixed inset-0 z-[110] flex justify-end bg-black/45 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="assistant-title" aria-describedby="assistant-description" tabIndex={-1} className="flex h-[100dvh] w-full max-w-xl flex-col bg-[#fbf8f4] text-stone-900 shadow-2xl outline-none sm:my-4 sm:mr-4 sm:h-[calc(100dvh-2rem)] sm:rounded-3xl dark:bg-slate-950 dark:text-stone-100">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-stone-200 px-5 py-4 dark:border-white/10"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#8B4513] text-white"><Sparkles size={22} /></span><div><h2 id="assistant-title" className="font-semibold">Ask Urugo</h2><p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">Your shopping assistant</p></div></div><div className="flex gap-1"><button type="button" onClick={reset} disabled={cartBusy !== null} aria-label="Start a new chat" className="rounded-full p-2.5 hover:bg-stone-200/70 dark:hover:bg-white/10"><RotateCcw size={18} /></button><button type="button" onClick={close} aria-label="Close shopping assistant" className="rounded-full p-2.5 hover:bg-stone-200/70 dark:hover:bg-white/10"><X size={20} /></button></div></header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5" role="log" aria-label="Shopping conversation" aria-live="polite" aria-relevant="additions">
          {!messages.length && <div className="pb-5 pt-3"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8B4513] dark:text-orange-300">A little help finding the right thing</p><h3 className="mt-3 max-w-sm text-3xl font-semibold leading-tight">What are you looking for today?</h3><p id="assistant-description" className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">Tell me your budget and what matters to you. I can find products, compare options, explain store policies, or help with your order.</p><div className="mt-5 space-y-2">{prompts.map((prompt) => <button key={prompt} type="button" disabled={available !== true || busy} onClick={() => send(prompt)} className="block w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-sm transition hover:border-[#8B4513] disabled:opacity-50 dark:border-white/15 dark:bg-slate-900">{prompt}</button>)}</div></div>}
          {messages.length > 0 && <p id="assistant-description" className="sr-only">Product discovery and shopping help grounded in the current catalog.</p>}
          {available === false && <div role="status" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">The shopping assistant is being set up. You can still <Link href={`/${locale}/products` as Route} onClick={close} className="font-semibold underline">browse products</Link> or <Link href="/contact" onClick={close} className="font-semibold underline">contact us</Link>.</div>}
          <div className="space-y-5">{messages.map((message) => <article key={message.id} aria-label={message.role === "user" ? "Your message" : "Urugo reply"} className={cn(message.role === "user" ? "ml-10 rounded-2xl rounded-br-sm bg-[#8B4513] p-4 text-white" : "space-y-3")}>
            {message.photo && <span className="mb-2 inline-flex items-center gap-1 text-xs"><Camera size={13} /> Photo attached</span>}
            <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
            {message.reply?.products.map((product) => <ProductResult key={product.id} product={product} locale={locale} onNavigate={close} />)}
            {message.reply?.comparison && <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-white/15 dark:bg-slate-900"><table className="w-full text-left text-xs"><caption className="px-3 py-2 text-left font-semibold">Compare verified details</caption><thead><tr><th className="p-3">Attribute</th>{message.reply.products.map((product) => <th key={product.id} className="min-w-32 p-3">{product.title}</th>)}</tr></thead><tbody>{["Price", "Brand", "Colors", "Sizes", "Availability"].map((attribute) => <tr key={attribute} className="border-t border-stone-100 dark:border-white/10"><th className="p-3 font-medium">{attribute}</th>{message.reply!.products.map((product) => <td key={product.id} className="p-3">{attribute === "Price" ? money(product.price, product.currency) : attribute === "Brand" ? product.brand : attribute === "Colors" ? product.colors.join(", ") || "Not specified" : attribute === "Sizes" ? product.sizes.join(", ") || "Not specified" : product.stock > 0 ? "In stock" : "Out of stock"}</td>)}</tr>)}</tbody></table></div>}
            {message.reply?.cartProposal && <div className="rounded-2xl border border-[#8B4513]/25 bg-white p-4 dark:bg-slate-900"><p className="text-sm font-semibold">Add {message.reply.cartProposal.quantity} × {message.reply.cartProposal.product.title}?</p><p className="mt-1 text-xs text-stone-500">{money(newPrices[message.id] ?? message.reply.cartProposal.product.price, message.reply.cartProposal.product.currency)} each · Price and stock checked on confirmation</p><button type="button" onClick={() => confirmCart(message)} disabled={cartBusy !== null || confirmed.includes(message.id)} className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#8B4513] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{confirmed.includes(message.id) ? <Check size={16} /> : <ShoppingBag size={16} />}{confirmed.includes(message.id) ? "Done" : cartBusy === message.id ? "Checking…" : "Confirm add to cart"}</button>{cartStatus[message.id] && <p role="status" className="mt-2 text-sm">{cartStatus[message.id]}</p>}</div>}
            {message.reply && message.reply.sources.length > 0 && <div className="flex flex-wrap gap-2">{message.reply.sources.map((source) => <Link key={source.path} href={source.path as Route} onClick={close} className="text-xs font-semibold text-[#8B4513] underline dark:text-orange-300">{source.title}</Link>)}</div>}
            {message.reply && message.reply.suggestedQuestions.length > 0 && <div className="flex flex-wrap gap-2">{message.reply.suggestedQuestions.map((question) => <button key={question} type="button" disabled={busy || available !== true} onClick={() => send(question)} className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs hover:border-[#8B4513] disabled:opacity-50 dark:border-white/15 dark:bg-slate-900">{question}</button>)}</div>}
          </article>)}</div>
          {busy && <p role="status" className="mt-5 flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400"><LoaderCircle size={17} className="animate-spin" />{file ? "Finding photo matches and checking products…" : "Checking the catalog and store information…"}</p>}
          {error && <div role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm leading-6 text-red-800 dark:bg-red-950/30 dark:text-red-200">{error}<button type="button" disabled={busy} onClick={() => send()} className="ml-2 font-semibold underline">Try again</button></div>}
          <div ref={end} />
        </div>
        <form className="shrink-0 border-t border-stone-200 bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:rounded-b-3xl dark:border-white/10 dark:bg-slate-950" onSubmit={(event) => { event.preventDefault(); send(); }}>
          {preview && <div className="mb-3 flex items-center gap-3 rounded-xl bg-stone-50 p-2 dark:bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Attached shopping photo" className="h-12 w-12 rounded-lg object-contain" /><span className="min-w-0 flex-1 truncate text-xs">{file?.name}</span><button type="button" disabled={busy} onClick={() => setFile(null)} aria-label="Remove attached photo" className="p-2"><X size={16} /></button>
          </div>}
          <label htmlFor="shopping-message" className="sr-only">Message the shopping assistant</label>
          <div className="rounded-2xl border border-stone-300 p-2 focus-within:border-[#8B4513] dark:border-white/20"><textarea id="shopping-message" ref={textarea} rows={2} maxLength={2000} disabled={busy || available !== true} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} placeholder="Describe what you need…" className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-stone-400 disabled:opacity-60" /><div className="flex items-center justify-between"><div className="flex gap-1"><button type="button" disabled={busy || available !== true} onClick={() => upload.current?.click()} aria-label="Attach product photo" className="rounded-full p-2 text-stone-500 hover:bg-stone-100 disabled:opacity-40 dark:hover:bg-white/10"><ImagePlus size={19} /></button><button type="button" disabled={busy || available !== true} onClick={() => camera.current?.click()} aria-label="Take shopping photo" className="rounded-full p-2 text-stone-500 disabled:opacity-40 sm:hidden"><Camera size={19} /></button></div>{busy ? <button type="button" onClick={cancel} className="rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold dark:border-white/20">Stop response</button> : <button type="submit" disabled={available !== true || (!draft.trim() && !file)} aria-label="Send shopping message" className="grid h-9 w-9 place-items-center rounded-full bg-[#8B4513] text-white disabled:opacity-40"><ArrowUp size={19} /></button>}</div></div>
          <input ref={upload} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Shopping photo file" className="hidden" onChange={(event) => { const selected = event.target.files?.[0]; event.target.value = ""; if (selected) choosePhoto(selected); }} />
          <input ref={camera} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" aria-label="Shopping camera file" className="hidden" onChange={(event) => { const selected = event.target.files?.[0]; event.target.value = ""; if (selected) choosePhoto(selected); }} />
          <p className="mt-2 text-[10px] leading-4 text-stone-500 dark:text-stone-400">Google?s free AI service may use messages to improve its products. Keep personal and payment details private. Product prices and availability are confirmed at checkout.</p>
        </form>
      </div>
    </div>, document.body)}
  </>;
}
