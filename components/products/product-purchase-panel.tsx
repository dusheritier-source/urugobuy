"use client";

import { useState } from "react";
import { Check, Heart, Minus, Plus, Share2, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { BackInStockButton } from "@/components/products/back-in-stock-button";

export function ProductPurchasePanel({ product }: { product: Product }) {
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((state) => state.addItem);
  const saved = useWishlistStore((state) => (Array.isArray(state.items) ? state.items : []).some((item) => item.id === product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);

  const addToCart = () => {
    const result = addItem(product, quantity);
    if (result.accepted > 0) toast.success(`${result.accepted} × ${product.title} added to cart`);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) await navigator.share({ title: product.title, url });
    else { await navigator.clipboard.writeText(url); toast.success("Product link copied"); }
  };

  return (
    <div className="mt-7 space-y-6">
      {product.colors.length > 0 && <fieldset><legend className="mb-3 text-sm font-semibold">Color: <span className="font-normal text-stone-500">{color}</span></legend><div className="flex flex-wrap gap-2">{product.colors.map((item) => <button key={item} type="button" onClick={() => setColor(item)} aria-pressed={color === item} className={`rounded-full border px-4 py-2 text-sm ${color === item ? "border-[#8B4513] bg-[#fff8f1] text-[#8B4513]" : "border-stone-200"}`}>{item}</button>)}</div></fieldset>}
      {product.sizes.length > 0 && <fieldset><legend className="mb-3 text-sm font-semibold">Size: <span className="font-normal text-stone-500">{size}</span></legend><div className="flex flex-wrap gap-2">{product.sizes.map((item) => <button key={item} type="button" onClick={() => setSize(item)} aria-pressed={size === item} className={`min-w-11 rounded-full border px-4 py-2 text-sm ${size === item ? "border-[#8B4513] bg-[#fff8f1] text-[#8B4513]" : "border-stone-200"}`}>{item}</button>)}</div></fieldset>}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-11 items-center rounded-full border border-stone-200" aria-label="Quantity">
          <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3" aria-label="Decrease quantity"><Minus size={15} /></button>
          <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
          <button type="button" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-3" aria-label="Increase quantity"><Plus size={15} /></button>
        </div>
        {product.stock > 0 ? <Button onClick={addToCart} className="flex-1 gap-2"><ShoppingBag size={17} /> Add to cart</Button> : <BackInStockButton productId={product.id} className="flex-1 gap-2" />}
        <Button variant="outline" onClick={() => { toggleWishlist(product); toast.success(saved ? "Removed from wishlist" : "Saved to wishlist"); }} aria-label="Toggle wishlist">{saved ? <Check size={17} /> : <Heart size={17} />}</Button>
        <Button variant="outline" onClick={share} aria-label="Share product"><Share2 size={17} /></Button>
      </div>
    </div>
  );
}
