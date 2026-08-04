"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { Copy, Download, Edit3, PackagePlus, Search, Trash2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/types";
import { readCatalog, writeCatalog } from "@/lib/catalog-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const emptyProduct = (): Product => ({ id: crypto.randomUUID(), title: "", slug: "", description: "", category: "", brand: "", price: 0, discount: 0, images: [""], rating: 0, stock: 0, colors: [], sizes: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });

export function ProductManager({ seedProducts }: { seedProducts: Product[] }) {
  const [items, setItems] = useState<Product[]>(seedProducts);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setItems(readCatalog(seedProducts)), 0);
    return () => window.clearTimeout(timer);
  }, [seedProducts]);
  const filtered = useMemo(() => items.filter((p) => `${p.title} ${p.brand} ${p.category} ${p.slug}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const commit = (next: Product[], message: string) => { setItems(next); writeCatalog(next); toast.success(message); };

  const save = () => {
    if (!editing || !editing.title.trim() || !editing.category.trim() || editing.price < 0 || editing.stock < 0) return toast.error("Add a title, category and valid price/stock");
    const product = { ...editing, slug: editing.slug.trim() || editing.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), updatedAt: new Date().toISOString(), images: editing.images.filter(Boolean) };
    if (!product.images.length) return toast.error("Add at least one image URL");
    const exists = items.some((p) => p.id === product.id);
    commit(exists ? items.map((p) => p.id === product.id ? product : p) : [product, ...items], exists ? "Product updated" : "Product created");
    setEditing(null);
  };
  const update = <K extends keyof Product>(key: K, value: Product[K]) => setEditing((current) => current ? { ...current, [key]: value } : current);
  const exportCatalog = () => { const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "urugo-products.json"; link.click(); URL.revokeObjectURL(url); };
  const importCatalog = async (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; try { const parsed = JSON.parse(await file.text()); if (!Array.isArray(parsed)) throw new Error(); commit(parsed, `${parsed.length} products imported`); } catch { toast.error("Choose a valid product JSON export"); } event.target.value = ""; };

  return <div className="space-y-6">
    <div className="flex flex-col gap-3 rounded-[28px] border border-stone-200 bg-white p-5 shadow-sm sm:flex-row dark:border-white/10 dark:bg-slate-900">
      <label className="relative flex-1"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={17} /><Input className="pl-11" placeholder="Search catalog" value={query} onChange={(e) => setQuery(e.target.value)} /></label>
      <Button onClick={() => setEditing(emptyProduct())} className="gap-2"><PackagePlus size={17} /> New product</Button>
      <Button variant="outline" onClick={exportCatalog} className="gap-2"><Download size={17} /> Export</Button>
      <Button variant="outline" onClick={() => importRef.current?.click()} className="gap-2"><Upload size={17} /> Import</Button><input ref={importRef} type="file" accept="application/json" className="hidden" onChange={importCatalog} />
    </div>
    <div className="overflow-x-auto rounded-[28px] border border-stone-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-900"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wider text-stone-500 dark:border-white/10 dark:bg-slate-950"><tr><th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4 text-right">Actions</th></tr></thead><tbody>{filtered.map((p) => <tr key={p.id} className="border-b border-stone-100 last:border-0 dark:border-white/5"><td className="p-4"><p className="font-semibold">{p.title}</p><p className="text-xs text-stone-500">{p.brand} · {p.slug}</p></td><td className="p-4">{p.category}</td><td className="p-4">${p.price.toFixed(2)}</td><td className="p-4"><span className={p.stock < 10 ? "font-semibold text-red-600" : ""}>{p.stock}</span></td><td className="p-4"><div className="flex justify-end gap-1"><button onClick={() => setEditing(p)} className="rounded-full p-2 hover:bg-stone-100" aria-label={`Edit ${p.title}`}><Edit3 size={16} /></button><button onClick={() => { const copy = { ...p, id: crypto.randomUUID(), title: `${p.title} copy`, slug: `${p.slug}-copy`, createdAt: new Date().toISOString() }; commit([copy, ...items], "Product duplicated"); }} className="rounded-full p-2 hover:bg-stone-100" aria-label={`Duplicate ${p.title}`}><Copy size={16} /></button><button onClick={() => { if (confirm(`Archive ${p.title}?`)) commit(items.filter((item) => item.id !== p.id), "Product archived"); }} className="rounded-full p-2 text-red-600 hover:bg-red-50" aria-label={`Archive ${p.title}`}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
    {editing && <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-label="Product editor" className="mx-auto my-8 max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl dark:bg-slate-900"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{items.some((p) => p.id === editing.id) ? "Edit product" : "New product"}</h2><button onClick={() => setEditing(null)} className="rounded-full p-2" aria-label="Close"><X /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Field label="Title"><Input value={editing.title} onChange={(e) => update("title", e.target.value)} /></Field><Field label="Slug"><Input value={editing.slug} placeholder="Generated from title" onChange={(e) => update("slug", e.target.value)} /></Field><Field label="Brand"><Input value={editing.brand} onChange={(e) => update("brand", e.target.value)} /></Field><Field label="Category"><Input value={editing.category} onChange={(e) => update("category", e.target.value)} /></Field><Field label="Price"><Input type="number" min="0" value={editing.price} onChange={(e) => update("price", Number(e.target.value))} /></Field><Field label="Discount %"><Input type="number" min="0" max="100" value={editing.discount} onChange={(e) => update("discount", Number(e.target.value))} /></Field><Field label="Stock"><Input type="number" min="0" value={editing.stock} onChange={(e) => update("stock", Number(e.target.value))} /></Field><Field label="Image URL"><Input value={editing.images[0] ?? ""} onChange={(e) => update("images", [e.target.value])} /></Field><Field label="Colors (comma separated)"><Input value={editing.colors.join(", ")} onChange={(e) => update("colors", e.target.value.split(",").map(v => v.trim()).filter(Boolean))} /></Field><Field label="Sizes (comma separated)"><Input value={editing.sizes.join(", ")} onChange={(e) => update("sizes", e.target.value.split(",").map(v => v.trim()).filter(Boolean))} /></Field><label className="sm:col-span-2 text-sm font-semibold">Description<textarea value={editing.description} onChange={(e) => update("description", e.target.value)} rows={4} className="mt-2 w-full rounded-2xl border border-stone-200 bg-white p-4 font-normal outline-none focus:border-[#8B4513] dark:border-white/10 dark:bg-slate-950" /></label>
    </div><div className="mt-6 flex justify-end gap-3"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={save}>Save product</Button></div></div></div>}
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="text-sm font-semibold">{label}<div className="mt-2">{children}</div></label>; }
