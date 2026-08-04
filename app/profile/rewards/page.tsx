"use client";

import { Award } from "lucide-react";
import { ReferralProgram } from "@/components/social/referral-program";
import { useAuth } from "@/components/auth/auth-provider";
import { useOrderStore } from "@/store/order-store";

export default function RewardsPage() {
  const { user } = useAuth();
  const spend = useOrderStore((state) => state.orders.filter((order) => order.customerId === user?.uid && order.paymentStatus === "paid").reduce((sum, order) => sum + order.total, 0));
  const points = Math.floor(spend * 10);
  return <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6"><p className="text-sm font-semibold uppercase tracking-[.3em] text-[#FF8C00]">Retention rewards</p><h1 className="mt-2 text-3xl font-semibold">Rewards and referrals</h1><section className="my-8 rounded-[28px] bg-[#8B4513] p-7 text-white"><Award size={30} /><p className="mt-4 text-4xl font-semibold">{points.toLocaleString()} points</p><p className="mt-1 text-sm text-white/75">Earn 10 points per paid dollar. Rewards are calculated from your completed purchases.</p></section><ReferralProgram /></main>;
}
