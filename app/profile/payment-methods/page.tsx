"use client";

import { useState } from "react";
import { CreditCard, Plus, Trash2, Check } from "lucide-react";
import { toast } from "react-hot-toast";

interface PaymentMethod {
  id: string;
  type: "card" | "mobile" | "wallet";
  last4?: string;
  brand?: string;
  phoneNumber?: string;
  isDefault: boolean;
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "1",
      type: "card",
      last4: "4242",
      brand: "Visa",
      isDefault: true,
    },
    {
      id: "2",
      type: "mobile",
      phoneNumber: "+250 788 123 456",
      isDefault: false,
    },
  ]);

  const [isAdding, setIsAdding] = useState(false);

  const handleDelete = (id: string) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
    toast.success("Payment method removed");
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id,
    })));
    toast.success("Default payment method updated");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Payment Methods</h1>
          <p className="mt-2 text-stone-600">Manage your saved payment methods</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 rounded-full bg-[#8B4513] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#6d3410]"
        >
          <Plus size={16} />
          Add New
        </button>
      </div>

      <div className="space-y-4">
        {paymentMethods.map((method) => (
          <div
            key={method.id}
            className="rounded-[20px] border border-stone-200/70 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#8B4513]/10">
                <CreditCard size={24} className="text-[#8B4513]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-stone-900">
                      {method.type === "card" && method.brand
                        ? `${method.brand} ending in ${method.last4}`
                        : method.type === "mobile"
                        ? `Mobile Money: ${method.phoneNumber}`
                        : "Digital Wallet"}
                    </h3>
                    {method.isDefault && (
                      <span className="mt-1 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100"
                        title="Set as default"
                      >
                        <Check size={18} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(method.id)}
                      className="rounded-full p-2 text-red-600 transition hover:bg-red-50"
                      title="Remove"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {paymentMethods.length === 0 && (
        <div className="rounded-[28px] border border-stone-200/70 bg-white p-12 text-center">
          <CreditCard size={48} className="mx-auto text-stone-400" />
          <h3 className="mt-4 text-lg font-semibold text-stone-900">No payment methods</h3>
          <p className="mt-2 text-sm text-stone-600">Add a payment method to get started</p>
        </div>
      )}
    </div>
  );
}