"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, CreditCard, LockKeyhole, MapPin, PackageCheck, Smartphone, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cart-store";
import { useOrderStore } from "@/store/order-store";
import { useAuth } from "@/components/auth/auth-provider";
import { products as seedProducts } from "@/lib/data";
import { calculateCheckout } from "@/lib/checkout";
import { readCatalog, writeCatalog } from "@/lib/catalog-storage";
import type { CheckoutAddress, Order, PaymentMethod } from "@/types/commerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { promotionDiscount, usePromotionStore } from "@/store/promotion-store";
import { trackCommerceEvent } from "@/lib/analytics";
import { firebaseReady } from "@/lib/firebase";

const methods: Array<{ id: PaymentMethod; title: string; note: string; icon: typeof CreditCard }> = [
  { id: "card", title: "Card", note: "Secure hosted card checkout", icon: CreditCard },
  { id: "mobile_money", title: "Mobile Money", note: "Rwanda Mobile Money when the store currency is RWF", icon: Smartphone },
  { id: "cash_on_delivery", title: "Pay on delivery", note: "Available for eligible Kigali addresses", icon: PackageCheck },
];

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clear);
  const place = useOrderStore((state) => state.place);
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("mobile_money");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | "pickup">("standard");
  const [coupon, setCoupon] = useState(() => typeof window === "undefined" ? "" : sessionStorage.getItem("urugo:checkout-coupon") ?? "");
  const [address, setAddress] = useState<CheckoutAddress>({ fullName: user?.displayName ?? "", email: user?.email ?? "", phone: "", line1: "", city: "Kigali", province: "Kigali", country: "Rwanda" });
  const promotions = usePromotionStore((state) => state.promotions); const redeem = usePromotionStore((state) => state.redeem);
  const rawSubtotal = items.reduce((sum, item) => sum + item.price * (1-item.discount/100) * item.quantity, 0);
  const promotion = promotions.find((item) => item.code === coupon.toUpperCase());
  const dynamicRate = promotionDiscount(promotion, rawSubtotal);
  const COUPONS: Record<string, number> = dynamicRate > 0 ? { [coupon]: dynamicRate } : {};
  const totals = useMemo(() => calculateCheckout(items, 0.18, shippingMethod, coupon, promotion ? dynamicRate : undefined), [coupon, dynamicRate, items, promotion, shippingMethod]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (busy || !items.length) return; setBusy(true);
    try {
      let key = sessionStorage.getItem("urugo:checkout-key"); if (!key) { key = crypto.randomUUID(); sessionStorage.setItem("urugo:checkout-key", key); }
      let saved: Order;
      if (firebaseReady) {
        if (!user) throw new Error("Please sign in before placing a production order");
        const token = await user.getIdToken();
        const response = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            idempotencyKey: key,
            lines: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
            address,
            shippingMethod,
            paymentMethod: method,
            coupon: coupon || undefined,
          }),
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.error?.message ?? "Order could not be created");
        saved = place(payload.order as Order);
        if (method !== "cash_on_delivery") {
          const paymentResponse = await fetch("/api/payments/initialize", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ orderId: saved.id }),
          });
          const paymentPayload = await paymentResponse.json();
          if (!paymentResponse.ok || !paymentPayload.checkoutUrl) throw new Error(paymentPayload?.error?.message ?? "Payment could not be initialized");
          clearCart(); sessionStorage.removeItem("urugo:checkout-key"); sessionStorage.removeItem("urugo:checkout-coupon");
          window.location.assign(paymentPayload.checkoutUrl);
          return;
        }
      } else {
        const catalog = readCatalog(seedProducts);
        for (const item of items) { const current = catalog.find((p) => p.id === item.id); if (!current || current.stock < item.quantity) throw new Error(`${item.title} no longer has enough stock`); }
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        const now = new Date().toISOString();
        const order: Order = { id: crypto.randomUUID(), orderNumber: `UR-${Date.now().toString().slice(-8)}`, idempotencyKey: key, customerId: user?.uid ?? null, createdAt: now, updatedAt: now, status: method === "cash_on_delivery" ? "pending" : "paid", paymentStatus: method === "cash_on_delivery" ? "pending" : "paid", paymentMethod: method, address, shippingMethod, lines: items.map((item) => ({ id: item.id, slug: item.slug, title: item.title, images: item.images, price: item.price, discount: item.discount, quantity: item.quantity, unitPrice: item.price * (1 - item.discount / 100) })), subtotal: totals.subtotal, discount: totals.discount, tax: totals.tax, shipping: totals.shipping, total: totals.total, coupon: coupon || undefined };
        saved = place(order);
        writeCatalog(catalog.map((product) => { const line = items.find((item) => item.id === product.id); return line ? { ...product, stock: product.stock - line.quantity, updatedAt: now } : product; }));
        if (promotion && dynamicRate > 0) redeem(promotion.id);
      }
      trackCommerceEvent("purchase", { transaction_id: saved.orderNumber, value: saved.total, tax: saved.tax, shipping: saved.shipping, coupon: saved.coupon, items: saved.lines.map((line) => ({ item_id: line.id, item_name: line.title, price: line.unitPrice, quantity: line.quantity })) });
      clearCart(); sessionStorage.removeItem("urugo:checkout-key"); sessionStorage.removeItem("urugo:checkout-coupon");
      router.push(`/checkout/success?order=${encodeURIComponent(saved.orderNumber)}` as Route);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Checkout could not be completed"); } finally { setBusy(false); }
  };

  if (!items.length) return <main className="mx-auto max-w-xl px-4 py-20 text-center"><PackageCheck className="mx-auto text-stone-400" size={48} /><h1 className="mt-4 text-2xl font-semibold">Your cart is empty</h1><Button asChild className="mt-6"><Link href="/products">Browse products</Link></Button></main>;
  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="mb-8"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">Secure checkout</p><h1 className="mt-2 text-3xl font-semibold">Complete your order</h1></div><form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1.15fr_.85fr]">
    <div className="space-y-6"><section className="rounded-[28px] border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900"><div className="flex items-center gap-3"><MapPin className="text-[#8B4513]" /><h2 className="text-xl font-semibold">Contact and delivery</h2></div><div className="mt-5 grid gap-4 sm:grid-cols-2">{(["fullName","email","phone","line1","city","province","country"] as const).map((key) => <label key={key} className={`text-sm font-semibold ${key === "line1" ? "sm:col-span-2" : ""}`}>{({ fullName: "Full name", email: "Email", phone: "Phone", line1: "Street address", city: "City", province: "Province", country: "Country" })[key]}<Input required type={key === "email" ? "email" : key === "phone" ? "tel" : "text"} className="mt-2" value={address[key]} onChange={(e) => setAddress({ ...address, [key]: e.target.value })} /></label>)}</div></section>
    <section className="rounded-[28px] border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900"><div className="flex items-center gap-3"><Truck className="text-[#8B4513]" /><h2 className="text-xl font-semibold">Shipping method</h2></div><div className="mt-4 grid gap-3">{([{ id: "standard", name: "Standard delivery", note: "3–5 business days · Free over $100" }, { id: "express", name: "Express delivery", note: "1–2 business days · $30" }, { id: "pickup", name: "Store pickup", note: "Ready within 24 hours · Free" }] as const).map((option) => <button type="button" key={option.id} onClick={() => setShippingMethod(option.id)} className={`flex items-center justify-between rounded-2xl border p-4 text-left ${shippingMethod === option.id ? "border-[#8B4513] bg-[#fff8f1]" : "border-stone-200"}`}><span><strong>{option.name}</strong><span className="mt-1 block text-xs text-stone-500">{option.note}</span></span>{shippingMethod === option.id && <Check className="text-[#8B4513]" />}</button>)}</div></section>
    <section className="rounded-[28px] border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900"><div className="flex items-center gap-3"><CreditCard className="text-[#8B4513]" /><h2 className="text-xl font-semibold">Payment</h2></div><div className="mt-4 grid gap-3">{methods.map((option) => { const Icon = option.icon; return <button type="button" key={option.id} onClick={() => setMethod(option.id)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left ${method === option.id ? "border-[#8B4513] bg-[#fff8f1]" : "border-stone-200"}`}><Icon /><span className="flex-1"><strong>{option.title}</strong><span className="block text-xs text-stone-500">{option.note}</span></span>{method === option.id && <Check className="text-[#8B4513]" />}</button>; })}</div><p className="mt-4 flex items-center gap-2 text-xs text-stone-500"><LockKeyhole size={14} /> Card and Mobile Money payments continue on Flutterwave&apos;s hosted checkout and are verified server-side.</p></section></div>
    <aside className="h-fit rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 lg:sticky lg:top-24"><h2 className="text-xl font-semibold">Order summary</h2><div className="mt-5 space-y-4">{items.map((item) => <div key={item.id} className="flex justify-between gap-4 text-sm"><span>{item.quantity} × {item.title}</span><strong>${(item.price * (1-item.discount/100) * item.quantity).toFixed(2)}</strong></div>)}</div><div className="mt-5 flex gap-2"><Input placeholder="Coupon code" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} /><Button type="button" variant="outline" onClick={() => COUPONS[coupon] ? toast.success(`${COUPONS[coupon]}% discount applied`) : toast.error("Invalid coupon")}>Apply</Button></div><div className="mt-6 space-y-3 border-t border-stone-200 pt-5 text-sm"><Row label="Subtotal" value={totals.subtotal} />{totals.discount > 0 && <Row label={`Discount (${totals.discountRate}%)`} value={-totals.discount} accent />}<Row label="Shipping" value={totals.shipping} /><Row label="Tax (18%)" value={totals.tax} /><div className="flex justify-between border-t border-stone-200 pt-4 text-lg font-semibold"><span>Total</span><span>${totals.total.toFixed(2)}</span></div></div><Button disabled={busy} className="mt-6 w-full py-3">{busy ? "Processing securely…" : method === "cash_on_delivery" ? "Place order" : `Pay $${totals.total.toFixed(2)}`}</Button><p className="mt-3 text-center text-xs text-stone-500">By placing your order, you agree to the store terms and return policy.</p></aside>
  </form></main>;
}
function Row({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) { return <div className="flex justify-between"><span className="text-stone-500">{label}</span><span className={accent ? "font-semibold text-green-700" : "font-semibold"}>{value < 0 ? "-" : ""}${Math.abs(value).toFixed(2)}</span></div>; }
