"use client";

import { useState } from "react";
import { Minus, Plus, X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart-store";
import { toast } from "react-hot-toast";

interface CartItemProps {
  id: string;
  title: string;
  price: number;
  discount?: number;
  image: string;
  quantity: number;
  color?: string;
  size?: string;
  stock: number;
  className?: string;
}

export function CartItem({
  id,
  title,
  price,
  discount = 0,
  image,
  quantity,
  color,
  size,
  stock,
  className,
}: CartItemProps) {
  const [isRemoving, setIsRemoving] = useState(false);
  const [removedItem, setRemovedItem] = useState<CartItemProps | null>(null);
  const { updateQuantity, removeItem } = useCartStore();

  const finalPrice = price - (price * discount) / 100;
  const itemTotal = finalPrice * quantity;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemove();
    } else if (newQuantity <= stock) {
      updateQuantity(id, newQuantity);
    }
  };

  const handleRemove = () => {
    setIsRemoving(true);
    setRemovedItem({ id, title, price, discount, image, quantity, color, size, stock });
    
    setTimeout(() => {
      removeItem(id);
      toast.error("Item removed from cart", {
        duration: 3000,
        icon: "🗑️",
      });
      setIsRemoving(false);
    }, 300);
  };

  const { addItem } = useCartStore();

  const handleUndo = () => {
    if (removedItem) {
      // `CartItemProps` is based on `Product` + `quantity`, so it's safe for the cart store.
      // `CartItemProps` is not the same type as `Product` expected by the store.
      // Undo should re-add only the product fields + quantity.
      const { id: removedId, title: removedTitle, price, discount, image, color, size, stock } = removedItem;
      addItem(
        {
          id: removedId,
          title: removedTitle,
          slug: "", // slug/category/brand are not used for cart operations; store requires Product shape.
          description: "",
          category: "",
          brand: "",
          price,
          discount: discount ?? 0,
          images: [image],
          rating: 0,
          stock,
          colors: color ? [color] : [],
          sizes: size ? [size] : [],
          createdAt: "",
          updatedAt: "",
        },
        removedItem.quantity,
      );
      setRemovedItem(null);
      setIsRemoving(false);
      toast.success("Item restored to cart", {
        duration: 3000,
        icon: "✅",
      });
    }
  };

  if (isRemoving && removedItem) {
    return (
      <div className={cn("rounded-[20px] border border-red-200 bg-red-50 p-4", className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-lg">
              <img src={removedItem.image} alt={removedItem.title} className="h-full w-full object-cover" />
            </div>
            <div>
              <p className="font-medium text-stone-900">{removedItem.title}</p>
              <p className="text-sm text-stone-600">Removed from cart</p>
            </div>
          </div>
          <button
            onClick={handleUndo}
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#8B4513] shadow-sm transition hover:bg-stone-50"
          >
            <RotateCcw size={16} />
            Undo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-[20px] border border-stone-200/70 bg-white p-4 transition", className)}>
      <div className="flex gap-4">
        {/* Product Image */}
        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-[16px]">
          <img src={image} alt={title} className="h-full w-full object-cover" />
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-stone-900 line-clamp-1">{title}</h3>
              <div className="mt-1 flex items-center gap-2 text-sm text-stone-600">
                {color && <span>{color}</span>}
                {color && size && <span>•</span>}
                {size && <span>{size}</span>}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-lg font-bold text-[#8B4513]">${finalPrice.toFixed(2)}</span>
                {discount > 0 && (
                  <span className="text-sm text-stone-500 line-through">${price.toFixed(2)}</span>
                )}
              </div>
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemove}
              className="rounded-full p-2 text-stone-600 transition hover:bg-red-50 hover:text-red-600"
              aria-label="Remove item"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quantity and Total */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 transition hover:border-[#8B4513] hover:text-[#8B4513] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span className="w-12 text-center font-medium text-stone-900">{quantity}</span>
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= stock}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 transition hover:border-[#8B4513] hover:text-[#8B4513] disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-stone-900">${itemTotal.toFixed(2)}</p>
              {quantity > stock && (
                <p className="text-xs text-red-600">Only {stock} available</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}