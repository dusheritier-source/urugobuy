"use client";

import { Bell } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { firebaseReady } from "@/lib/firebase";

export function BackInStockButton({ productId, className }: { productId: string; className?: string }) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const subscribe = async () => {
    if (!firebaseReady) return toast("Stock alerts become available when Firebase is configured.");
    if (!user) return toast.error("Sign in to receive a stock alert.");
    setBusy(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/back-in-stock", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ productId }) });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Could not create stock alert");
      setSubscribed(true);
      toast.success("We’ll notify you when this product is back.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create stock alert");
    } finally { setBusy(false); }
  };

  return <Button type="button" variant="outline" className={className} disabled={busy || subscribed} onClick={subscribe}><Bell size={17} /> {subscribed ? "Alert created" : busy ? "Saving…" : "Notify me"}</Button>;
}
