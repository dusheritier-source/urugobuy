"use client";

import { useState } from "react";
import { Mail, Bell, Tag, Truck } from "lucide-react";
import { toast } from "react-hot-toast";

interface EmailPreference {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  enabled: boolean;
}

export default function EmailPreferencesPage() {
  const [preferences, setPreferences] = useState<EmailPreference[]>([
    {
      id: "order-updates",
      title: "Order Updates",
      description: "Receive emails about your order status",
      icon: Truck,
      enabled: true,
    },
    {
      id: "promotions",
      title: "Promotions & Deals",
      description: "Get notified about sales and special offers",
      icon: Tag,
      enabled: true,
    },
    {
      id: "newsletter",
      title: "Newsletter",
      description: "Weekly newsletter with new arrivals and trends",
      icon: Mail,
      enabled: false,
    },
    {
      id: "notifications",
      title: "Push Notifications",
      description: "Receive push notifications on your device",
      icon: Bell,
      enabled: true,
    },
  ]);

  const togglePreference = (id: string) => {
    setPreferences(preferences.map(pref => 
      pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
    ));
  };

  const handleSave = async () => {
    localStorage.setItem("urugo:communication-preferences", JSON.stringify(preferences.map(({ id, enabled }) => ({ id, enabled }))));
    toast.success("Email preferences saved!");
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stone-900">Email Preferences</h1>
        <p className="mt-2 text-stone-600">Manage how you receive communications from us</p>
      </div>

      <div className="space-y-4">
        {preferences.map((preference) => {
          const Icon = preference.icon;
          return (
            <div
              key={preference.id}
              className="rounded-[20px] border border-stone-200/70 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#8B4513]/10">
                  <Icon size={24} className="text-[#8B4513]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-stone-900">{preference.title}</h3>
                      <p className="mt-1 text-sm text-stone-600">{preference.description}</p>
                    </div>
                    <button
                      onClick={() => togglePreference(preference.id)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition",
                        preference.enabled ? "bg-[#8B4513]" : "bg-stone-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition",
                          preference.enabled ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        className="w-full rounded-full bg-[#8B4513] py-3 font-semibold text-white transition hover:bg-[#6d3410]"
      >
        Save Preferences
      </button>
    </div>
  );
}

import { cn } from "@/lib/utils";
