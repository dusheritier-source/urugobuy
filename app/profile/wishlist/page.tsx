"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const items = useWishlistStore((state) => state.items);
  const toggle = useWishlistStore((state) => state.toggle);
  const addItem = useCartStore((state) => state.addItem);
  return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#FF8C00]">My account</p><h1 className="mt-2 text-3xl font-semibold">Wishlist</h1>{items.length ? <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((product) => <article key={product.id} className="overflow-hidden rounded-[28px] border border-stone-200 bg-white dark:border-white/10 dark:bg-slate-900"><Link href={`/products/${product.slug}`}><div className="relative aspect-[4/3]"><Image src={product.images[0]} alt={product.title} fill className="object-cover" /></div></Link><div className="p-5"><p className="text-xs font-semibold uppercase tracking-wider text-[#FF8C00]">{product.brand}</p><Link href={`/products/${product.slug}`} className="mt-2 block text-lg font-semibold">{product.title}</Link><p className="mt-2 text-xl font-semibold">${product.price}</p><div className="mt-4 flex gap-2"><Button className="flex-1 gap-2" disabled={!product.stock} onClick={() => { const result = addItem(product); if (result.accepted) toast.success("Added to cart"); }}><ShoppingBag size={16} /> Add to cart</Button><Button variant="outline" onClick={() => toggle(product)} aria-label="Remove from wishlist"><Trash2 size={16} /></Button></div></div></article>)}</div> : <div className="mt-8 rounded-[28px] border border-dashed border-stone-300 p-12 text-center"><Heart className="mx-auto text-stone-400" size={42} /><h2 className="mt-4 text-xl font-semibold">Your wishlist is empty</h2><p className="mt-2 text-sm text-stone-500">Save products you want to revisit later.</p><Button asChild className="mt-5"><Link href="/products">Explore products</Link></Button></div>}</main>;
}
