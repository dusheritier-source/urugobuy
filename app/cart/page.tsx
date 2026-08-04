"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CartItem } from "@/components/ui/cart-item";
import { CartSummary } from "@/components/ui/cart-summary";

import { useCartStore } from "@/store/cart-store";

import { useLocale } from "@/components/locale/locale-context";
import { getRegionPricing } from "@/lib/pricing";
import { useState } from "react";
import toast from "react-hot-toast";
import { promotionDiscount, usePromotionStore } from "@/store/promotion-store";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const { locale } = useLocale();

  const { taxRate, shippingCost } = getRegionPricing(locale);
  const [coupon, setCoupon] = useState("");

  const subtotal = items.reduce((sum, item) => {
    const discount = item.discount || 0;
    const finalPrice = item.price - (item.price * discount) / 100;
    return sum + finalPrice * item.quantity;
  }, 0);
  const promotions = usePromotionStore((state) => state.promotions);
  const discount = promotionDiscount(promotions.find((item) => item.code === coupon), subtotal);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[32px] border border-stone-200/70 bg-white p-6 shadow-[0_30px_90px_-45px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-[#fff8f1] p-3 text-[#8B4513]">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-stone-900">Your cart</h1>
              <p className="text-sm text-stone-600">
                {items.length} {items.length === 1 ? "item" : "items"} ready to checkout
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {items.length === 0 ? (
              <div className="rounded-[24px] border border-stone-200/70 bg-[#fffaf4] p-6 text-center text-sm text-stone-600">
                Your cart is empty.
                <div className="mt-4">
                  <Link
                    href="/products"
                    className="inline-flex rounded-full bg-[#8B4513] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#6d3410]"
                  >
                    Browse products
                  </Link>
                </div>
              </div>
            ) : (
              items.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={item.price}
                  discount={item.discount}
                  image={item.images[0]}
                  quantity={item.quantity}
                  color={item.colors?.[0]}
                  size={item.sizes?.[0]}
                  stock={item.stock}
                />
              ))
            )}
          </div>
        </section>

        <aside className="rounded-[32px] border border-stone-200/70 bg-white p-6 shadow-[0_25px_90px_-45px_rgba(139,69,19,0.3)]">
          <CartSummary
            subtotal={subtotal}
            taxRate={taxRate}
            shippingCost={shippingCost}
            discount={discount}
            discountCode={coupon}
            onApplyDiscount={(code) => { const normalized = code.toUpperCase(); const rate = promotionDiscount(promotions.find((item) => item.code === normalized), subtotal); if (rate > 0) { setCoupon(normalized); sessionStorage.setItem("urugo:checkout-coupon", normalized); toast.success("Discount applied"); } else toast.error("That code is invalid or the order is not eligible"); }}
          />

          <Button asChild className="mt-6 w-full" disabled={!items.length}><Link href="/checkout">Proceed to checkout</Link></Button>
          <Link href="/products" className="mt-3 block text-center text-sm font-semibold text-[#8B4513]">
            Continue shopping
          </Link>
        </aside>
      </div>
    </main>
  );
}

