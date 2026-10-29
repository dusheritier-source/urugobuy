"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ImageZoom } from "@/components/ui/image-zoom";
import { cn } from "@/lib/utils";
import type { Product } from "@/types";
import { useUIStore } from "@/store/ui-store";
import { useCartStore } from "@/store/cart-store";
import { BackInStockButton } from "@/components/products/back-in-stock-button";
import toast from "react-hot-toast";
import Link from "next/link";
import type { Route } from "next";
import { useLocale } from "@/components/locale/locale-context";

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const addItem = useCartStore((s) => s.addItem);
  const { locale } = useLocale();
  const remember = useUIStore((state) => state.addToRecentlyViewed);
  useEffect(() => { if (isOpen && product?.id) remember(product.id); }, [isOpen, product?.id, remember]);

  const computed = useMemo(() => {
    if (!product) return null;
    const discount = product.discount || 0;
    const finalPrice = product.price - (product.price * discount) / 100;
    return { discount, finalPrice };
  }, [product]);

  if (!product || !computed) return null;

  const { discount, finalPrice } = computed;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-[20px]">
            <ImageZoom
              src={product.images[selectedImage]}
              alt={product.title}
              className="h-full w-full"
            />
            {discount > 0 && (
              <span className="absolute left-4 top-4 rounded-full bg-[#FF8C00] px-3 py-1 text-sm font-semibold text-white">
                -{discount}%
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedImage(index)}
                  className={cn(
                    "h-20 w-20 overflow-hidden rounded-lg border-2 transition",
                    selectedImage === index
                      ? "border-[#8B4513]"
                      : "border-transparent hover:border-stone-300",
                  )}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          <div className="flex-1">
            <p className="text-sm font-medium uppercase tracking-wider text-[#FF8C00]">
              {product.category}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-stone-900">{product.title}</h2>
            <p className="mt-2 text-sm text-stone-600">{product.description}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[#8B4513]">
                ${finalPrice.toFixed(2)}
              </span>
              {discount > 0 && (
                <span className="text-lg text-stone-500 line-through">
                  ${product.price.toFixed(2)}
                </span>
              )}
            </div>

            <div className="mt-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < Math.floor(product.rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "fill-stone-300 text-stone-300",
                      )}
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-medium text-stone-600">
                  {product.rating} ({product.stock} in stock)
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">Colors</h3>
                <div className="mt-2 flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="rounded-full border-2 border-stone-200 px-4 py-2 text-sm transition hover:border-[#8B4513]"
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-stone-900">Sizes</h3>
                <div className="mt-2 flex gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className="rounded-full border-2 border-stone-200 px-4 py-2 text-sm transition hover:border-[#8B4513]"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Link
            href={`/${locale}/products/${product.slug}` as Route}
            onClick={onClose}
            className="mb-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#8B4513] px-5 py-2.5 text-sm font-semibold text-[#8B4513] transition hover:bg-[#fff8f1]"
          >
            View full product details
          </Link>
          <div className="flex gap-3">
            {product.stock > 0 ? <button
              type="button"
              onClick={() => { const result = addItem(product, 1); if (result.accepted) toast.success(`${product.title} added to cart`); }}
              className="flex-1 rounded-full bg-[#8B4513] px-6 py-3 font-semibold text-white transition hover:bg-[#6d3410]"
            >
              Add to Cart
            </button> : <BackInStockButton productId={product.id} className="flex-1" />}
            <button
              type="button"
              className="rounded-full border border-stone-200 p-3 transition hover:border-[#8B4513] hover:text-[#8B4513]"
            >
              <Heart size={20} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

