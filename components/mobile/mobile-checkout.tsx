"use client";

import { useState } from "react";
import { Smartphone, CreditCard, Wallet, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileCheckoutProps {
  total: number;
  onComplete: () => void;
}

export function MobileCheckout({ total, onComplete }: MobileCheckoutProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>("card");
  const [isProcessing, setIsProcessing] = useState(false);

  const paymentMethods = [
    { id: "card", name: "Credit/Debit Card", icon: CreditCard, description: "Visa, Mastercard" },
    { id: "mobile", name: "Mobile Money", icon: Smartphone, description: "MTN, Airtel" },
    { id: "wallet", name: "Digital Wallet", icon: Wallet, description: "PayPal, Apple Pay" },
  ];

  const handleCheckout = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    onComplete();
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="rounded-[20px] border border-stone-200/70 bg-white p-6">
        <h3 className="text-lg font-semibold text-stone-900">Order Summary</h3>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-600">Subtotal</span>
            <span className="font-medium text-stone-900">${total.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-600">Shipping</span>
            <span className="font-medium text-green-600">FREE</span>
          </div>
          <div className="border-t border-stone-200 pt-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-stone-900">Total</span>
              <span className="text-xl font-bold text-[#8B4513]">${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="rounded-[20px] border border-stone-200/70 bg-white p-6">
        <h3 className="text-lg font-semibold text-stone-900">Payment Method</h3>
        <div className="mt-4 space-y-3">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;

            return (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-[16px] border-2 p-4 transition",
                  isSelected ? "border-[#8B4513] bg-[#8B4513]/5" : "border-stone-200 hover:border-stone-300"
                )}
              >
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full",
                  isSelected ? "bg-[#8B4513] text-white" : "bg-stone-100 text-stone-600"
                )}>
                  <Icon size={24} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-stone-900">{method.name}</p>
                  <p className="text-xs text-stone-600">{method.description}</p>
                </div>
                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B4513]">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Checkout Button */}
      <button
        onClick={handleCheckout}
        disabled={isProcessing}
        className="w-full rounded-full bg-[#8B4513] py-4 text-base font-semibold text-white transition hover:bg-[#6d3410] disabled:opacity-50"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Processing...
          </span>
        ) : (
          `Pay $${total.toFixed(2)}`
        )}
      </button>

      {/* Security Note */}
      <p className="text-center text-xs text-stone-500">
        🔒 Secure checkout powered by Stripe
      </p>
    </div>
  );
}