"use client";

import { useState } from "react";
import { MapPin, Plus, Check, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  province: string;
  country: string;
  isDefault: boolean;
}

interface ShippingAddressSelectorProps {
  addresses: Address[];
  selectedAddressId: string | null;
  onSelect: (addressId: string) => void;
  onAdd: (address: Omit<Address, "id">) => void;
  onEdit: (address: Address) => void;
  className?: string;
}

export function ShippingAddressSelector({
  addresses,
  selectedAddressId,
  onSelect,
  onAdd,
  onEdit,
  className,
}: ShippingAddressSelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultAddress = addresses.find((addr) => addr.isDefault);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-stone-900">Shipping Address</h3>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 text-sm font-medium text-[#8B4513] transition hover:text-[#6d3410]"
        >
          <Plus size={16} />
          Add New
        </button>
      </div>

      <div className="grid gap-3">
        {addresses.map((address) => (
          <div
            key={address.id}
            onClick={() => onSelect(address.id)}
            className={cn(
              "relative cursor-pointer rounded-[20px] border-2 p-4 transition",
              selectedAddressId === address.id
                ? "border-[#8B4513] bg-[#8B4513]/5"
                : "border-stone-200 hover:border-stone-300"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2",
                    selectedAddressId === address.id
                      ? "border-[#8B4513] bg-[#8B4513]"
                      : "border-stone-300"
                  )}
                >
                  {selectedAddressId === address.id && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{address.label}</span>
                    {address.isDefault && (
                      <span className="rounded-full bg-[#8B4513]/10 px-2 py-0.5 text-xs font-medium text-[#8B4513]">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-stone-900">{address.fullName}</p>
                  <p className="mt-1 text-sm text-stone-600">{address.phone}</p>
                  <p className="mt-1 text-sm text-stone-600">
                    {address.street}, {address.city}, {address.province}
                  </p>
                  <p className="text-sm text-stone-600">{address.country}</p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(address.id);
                }}
                className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100"
              >
                <Edit2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isAddingNew && (
        <AddressForm
          onSubmit={(address) => {
            onAdd(address);
            setIsAddingNew(false);
          }}
          onCancel={() => setIsAddingNew(false)}
        />
      )}

      {editingId && (
        <AddressForm
          address={addresses.find((a) => a.id === editingId)}
          onSubmit={(address) => {
            onEdit({ ...address, id: editingId });
            setEditingId(null);
          }}
          onCancel={() => setEditingId(null)}
        />
      )}
    </div>
  );
}

interface AddressFormProps {
  address?: Address;
  onSubmit: (address: Omit<Address, "id">) => void;
  onCancel: () => void;
}

function AddressForm({ address, onSubmit, onCancel }: AddressFormProps) {
  const [formData, setFormData] = useState({
    label: address?.label || "Home",
    fullName: address?.fullName || "",
    phone: address?.phone || "",
    street: address?.street || "",
    city: address?.city || "",
    province: address?.province || "",
    country: address?.country || "Rwanda",
    isDefault: address?.isDefault || false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[20px] border border-stone-200 p-4">
      <h4 className="mb-4 font-semibold text-stone-900">
        {address ? "Edit Address" : "Add New Address"}
      </h4>
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Label (e.g., Home, Work)"
          value={formData.label}
          onChange={(e) => setFormData({ ...formData, label: e.target.value })}
          className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm outline-none focus:border-[#8B4513]"
          required
        />
        <input
          type="text"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm outline-none focus:border-[#8B4513]"
          required
        />
        <input
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm outline-none focus:border-[#8B4513]"
          required
        />
        <input
          type="text"
          placeholder="Street Address"
          value={formData.street}
          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
          className="w-full rounded-lg border border-stone-200 px-4 py-2 text-sm outline-none focus:border-[#8B4513]"
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm outline-none focus:border-[#8B4513]"
            required
          />
          <input
            type="text"
            placeholder="Province"
            value={formData.province}
            onChange={(e) => setFormData({ ...formData, province: e.target.value })}
            className="rounded-lg border border-stone-200 px-4 py-2 text-sm outline-none focus:border-[#8B4513]"
            required
          />
        </div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isDefault}
            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
            className="rounded border-stone-300 text-[#8B4513] focus:ring-[#8B4513]"
          />
          <span className="text-sm text-stone-700">Set as default address</span>
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-stone-200 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-full bg-[#8B4513] py-2 text-sm font-semibold text-white transition hover:bg-[#6d3410]"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}