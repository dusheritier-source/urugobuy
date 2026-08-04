"use client";

import { useState } from "react";
import { Truck, Gift, Tag, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartSummaryProps {
  subtotal: number;
  taxRate?: number;
  shippingCost?: number;
  discount?: number;
  discountCode?: string;
  onApplyDiscount?: (code: string) => void;
  className?: string;
}

export function CartSummary({
  subtotal,
  taxRate = 0.18,
  shippingCost = 15,
  discount = 0,
  discountCode,
  onApplyDiscount,
  className,
}: CartSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [code, setCode] = useState(discountCode || "");

  const tax = subtotal * taxRate;
  const discountAmount = discount > 0 ? (subtotal * discount) / 100 : 0;
  const freeShippingThreshold = 100;
  const amountForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const effectiveShipping = amountForFreeShipping === 0 ? 0 : shippingCost;
  const total = subtotal + tax + effectiveShipping - discountAmount;

  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

  const handleApplyCode = () => {
    if (code.trim() && onApplyDiscount) {
      onApplyDiscount(code.trim());
    }
  };

  return (
    <div className={cn("rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-sm", className)}>
      <h3 className="text-xl font-semibold text-stone-900">Order Summary</h3>

      {/* Free Shipping Progress */}
      {amountForFreeShipping > 0 && (
        <div className="mt-4 rounded-[16px] bg-[#fff8f1] p-4">
          <div className="flex items-center gap-2 text-sm">
            <Truck size={18} className="text-[#8B4513]" />
            <span className="font-medium text-stone-900">
              Add ${amountForFreeShipping.toFixed(2)} more for free shipping!
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full bg-gradient-to-r from-[#8B4513] to-[#FF8C00] transition-all"
              style={{ width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {amountForFreeShipping === 0 && (
        <div className="mt-4 rounded-[16px] bg-green-50 p-4">
          <div className="flex items-center gap-2 text-sm">
            <Truck size={18} className="text-green-600" />
            <span className="font-medium text-green-900">You qualify for free shipping!</span>
          </div>
        </div>
      )}

      {/* Summary Details */}
      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600">Subtotal</span>
          <span className="font-medium text-stone-900">${subtotal.toFixed(2)}</span>
        </div>

        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-600">Discount ({discount}%)</span>
            <span className="font-medium text-green-600">-${discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600">Shipping</span>
          <span className="font-medium text-stone-900">
            {amountForFreeShipping === 0 ? "FREE" : `$${shippingCost.toFixed(2)}`}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600">Tax ({(taxRate * 100).toFixed(0)}%)</span>
          <span className="font-medium text-stone-900">${tax.toFixed(2)}</span>
        </div>

        <div className="border-t border-stone-200 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-stone-900">Total</span>
            <span className="text-2xl font-bold text-[#8B4513]">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Estimated Delivery */}
      <div className="mt-4 rounded-[16px] bg-[#fff8f1] p-3">
        <div className="flex items-center gap-2 text-sm">
          <Truck size={16} className="text-[#8B4513]" />
          <span className="text-stone-700">
            Estimated delivery: <span className="font-medium">{estimatedDelivery.toLocaleDateString()}</span>
          </span>
        </div>
      </div>

      {/* Discount Code */}
      <div className="mt-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-[#8B4513] transition hover:text-[#6d3410]"
        >
          <Tag size={16} />
          {discountCode ? "Change discount code" : "Have a discount code?"}
          <ChevronDown size={16} className={cn("transition-transform", isExpanded && "rotate-180")} />
        </button>

        {isExpanded && (
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter code"
              className="flex-1 rounded-full border border-stone-200 px-4 py-2 text-sm outline-none transition focus:border-[#8B4513]"
            />
            <button
              onClick={handleApplyCode}
              className="rounded-full bg-[#8B4513] px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#6d3410]"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Gift Option */}
      <div className="mt-4 flex items-center gap-2 rounded-[16px] border border-stone-200 p-3">
        <Gift size={18} className="text-stone-600" />
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-900">Add gift wrapping</p>
          <p className="text-xs text-stone-600">$5.00</p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" className="peer sr-only" />
          <div className="h-6 w-11 rounded-full bg-stone-200 peer-checked:bg-[#8B4513] after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full"></div>
        </label>
      </div>
    </div>
  );
}
