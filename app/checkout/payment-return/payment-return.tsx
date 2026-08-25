"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";

type State = "checking" | "paid" | "pending" | "failed";

export function PaymentReturn() {
  const params = useSearchParams();
  const { user, loading } = useAuth();
  const [state, setState] = useState<State>("checking");
  const orderId = params.get("order");
  const transactionId = params.get("transaction_id");
  const providerStatus = params.get("status");

  useEffect(() => {
    if (loading) return;
    if (!user || !orderId || !transactionId || providerStatus === "cancelled" || providerStatus === "failed") {
      setState(providerStatus === "cancelled" || providerStatus === "failed" ? "failed" : "pending");
      return;
    }
    void user.getIdToken().then(async (token) => {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId, transactionId }),
      });
      setState(response.ok ? "paid" : "pending");
    }).catch(() => setState("pending"));
  }, [loading, orderId, providerStatus, transactionId, user]);

  const content = state === "paid"
    ? { icon: CheckCircle2, color: "text-green-600", title: "Payment confirmed", text: "Your payment was verified and your order is ready for processing." }
    : state === "failed"
      ? { icon: XCircle, color: "text-red-600", title: "Payment not completed", text: "No payment was confirmed. You can return to your account and try again." }
      : { icon: Clock3, color: "text-amber-600", title: state === "checking" ? "Confirming payment" : "Payment processing", text: "Mobile Money can take a moment to confirm. Your order will update automatically after verification." };
  const Icon = content.icon;

  return <main className="mx-auto max-w-lg px-4 py-20 text-center"><Icon className={`mx-auto ${content.color}`} size={54} /><h1 className="mt-5 text-3xl font-semibold">{content.title}</h1><p className="mt-3 text-stone-600">{content.text}</p><div className="mt-7 flex justify-center gap-3"><Button asChild><Link href="/profile#orders">View orders</Link></Button><Button asChild variant="outline"><Link href="/products">Continue shopping</Link></Button></div></main>;
}
