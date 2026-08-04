"use client";

import { useState } from "react";
import { Banknote, PackageCheck, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useOrderStore } from "@/store/order-store";
import type { Order, OrderStatus } from "@/types/commerce";
import { Input } from "@/components/ui/input";
import { readCatalog, writeCatalog } from "@/lib/catalog-storage";
import { products as seedProducts } from "@/lib/data";

const statuses: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrdersPage() {
  const orders = useOrderStore((state) => state.orders);
  const update = useOrderStore((state) => state.update);
  const [query, setQuery] = useState("");
  const visible = orders.filter((order) => `${order.orderNumber} ${order.address.fullName} ${order.address.email}`.toLowerCase().includes(query.toLowerCase()));

  const changeStatus = (order: Order, status: OrderStatus) => {
    const releasesInventory = ["cancelled", "refunded"].includes(status) && !["cancelled", "refunded"].includes(order.status);
    if (releasesInventory) {
      const catalog = readCatalog(seedProducts);
      writeCatalog(catalog.map((product) => {
        const line = order.lines.find((item) => item.id === product.id);
        return line ? { ...product, stock: product.stock + line.quantity, updatedAt: new Date().toISOString() } : product;
      }));
    }
    update(order.id, { status, paymentStatus: status === "refunded" ? "refunded" : order.paymentStatus });
    toast.success("Order status updated");
  };

  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">Operations</p>
    <h1 className="mt-2 text-3xl font-semibold">Orders and fulfilment</h1>
    <div className="mt-7 rounded-[28px] border border-stone-200 bg-white p-4 dark:border-white/10 dark:bg-slate-900"><label className="relative block"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={17} /><Input className="pl-11" placeholder="Search order, customer, or email" value={query} onChange={(e) => setQuery(e.target.value)} /></label></div>
    <div className="mt-5 space-y-4">{visible.map((order) => <article key={order.id} className="rounded-[28px] border border-stone-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
      <div className="flex flex-wrap justify-between gap-4"><div><h2 className="font-semibold">{order.orderNumber}</h2><p className="mt-1 text-sm text-stone-500">{order.address.fullName} · {order.address.email}</p><p className="mt-1 text-xs text-stone-500">{new Date(order.createdAt).toLocaleString()}</p></div><div className="text-right"><p className="text-xl font-semibold">${order.total.toFixed(2)}</p><p className="text-xs uppercase text-stone-500">{order.paymentMethod.replaceAll("_", " ")} · {order.paymentStatus}</p></div></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[180px_1fr_auto]"><select aria-label="Order status" value={order.status} onChange={(e) => changeStatus(order, e.target.value as OrderStatus)} className="h-11 rounded-full border border-stone-200 bg-white px-4 text-sm">{statuses.map((status) => <option key={status}>{status}</option>)}</select><Input aria-label="Tracking number" placeholder="Tracking number" defaultValue={order.trackingNumber} onBlur={(e) => e.target.value !== (order.trackingNumber ?? "") && update(order.id, { trackingNumber: e.target.value, status: e.target.value ? "shipped" : order.status })} /><button onClick={() => { if (confirm("Mark this order refunded?")) changeStatus(order, "refunded"); }} className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 px-4 text-sm font-semibold text-red-700"><Banknote size={16} /> Refund</button></div>
      <details className="mt-4"><summary className="cursor-pointer text-sm font-semibold text-[#8B4513]">{order.lines.length} line items</summary><div className="mt-3 space-y-2">{order.lines.map((line) => <div key={line.id} className="flex justify-between text-sm"><span>{line.quantity} × {line.title}</span><strong>${(line.quantity * line.unitPrice).toFixed(2)}</strong></div>)}</div></details>
    </article>)}{!visible.length && <div className="rounded-[28px] border border-dashed border-stone-300 p-12 text-center text-stone-500"><PackageCheck className="mx-auto mb-3" /> No orders found.</div>}</div>
  </main>;
}
