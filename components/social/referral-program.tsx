"use client";

import { useState, useEffect } from "react";
import { Gift, Copy, Check, Users, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  rewardsEarned: number;
  pendingReferrals: number;
}

interface Referral {
  id: string;
  email: string;
  status: "pending" | "signed_up" | "purchased";
  date: string;
  reward: number;
}

export function ReferralProgram() {
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState<ReferralStats>({
    totalReferrals: 0,
    successfulReferrals: 0,
    rewardsEarned: 0,
    pendingReferrals: 0,
  });
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Generate or retrieve referral code
    let code = localStorage.getItem("referral_code");
    if (!code) {
      code = `URUGO-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
      localStorage.setItem("referral_code", code);
    }
    setReferralCode(code);

    // Simulate fetching referral data
    const mockStats: ReferralStats = {
      totalReferrals: 12,
      successfulReferrals: 8,
      rewardsEarned: 4000,
      pendingReferrals: 4,
    };

    const mockReferrals: Referral[] = [
      {
        id: "1",
        email: "friend1@example.com",
        status: "purchased",
        date: "2024-01-15",
        reward: 500,
      },
      {
        id: "2",
        email: "friend2@example.com",
        status: "signed_up",
        date: "2024-01-18",
        reward: 0,
      },
      {
        id: "3",
        email: "friend3@example.com",
        status: "pending",
        date: "2024-01-20",
        reward: 0,
      },
    ];

    setStats(mockStats);
    setReferrals(mockReferrals);
  }, []);

  const copyReferralCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      toast.success("Referral code copied!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy code");
    }
  };

  const shareReferralLink = async () => {
    const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Urugo Buy",
          text: `Use my referral code ${referralCode} to get 500 RWF off your first purchase!`,
          url: referralLink,
        });
      } catch (error) {
        // User cancelled
      }
    } else {
      await copyReferralCode();
    }
  };

  const getStatusColor = (status: Referral["status"]) => {
    switch (status) {
      case "purchased":
        return "text-green-600 bg-green-50";
      case "signed_up":
        return "text-blue-600 bg-blue-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
    }
  };

  const getStatusLabel = (status: Referral["status"]) => {
    switch (status) {
      case "purchased":
        return "Completed";
      case "signed_up":
        return "Signed Up";
      case "pending":
        return "Pending";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B4513]/10">
          <Gift size={24} className="text-[#8B4513]" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-stone-900">Referral Program</h3>
          <p className="text-sm text-stone-600">Earn 500 RWF for each friend who joins!</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-[20px] border border-stone-200/70 bg-white p-4 text-center">
          <Users size={20} className="mx-auto text-[#8B4513]" />
          <p className="mt-2 text-2xl font-bold text-stone-900">{stats.totalReferrals}</p>
          <p className="text-xs text-stone-600">Total Referrals</p>
        </div>
        <div className="rounded-[20px] border border-stone-200/70 bg-white p-4 text-center">
          <TrendingUp size={20} className="mx-auto text-green-600" />
          <p className="mt-2 text-2xl font-bold text-stone-900">{stats.successfulReferrals}</p>
          <p className="text-xs text-stone-600">Successful</p>
        </div>
        <div className="rounded-[20px] border border-stone-200/70 bg-white p-4 text-center">
          <Gift size={20} className="mx-auto text-red-600" />
          <p className="mt-2 text-2xl font-bold text-stone-900">{stats.rewardsEarned}</p>
          <p className="text-xs text-stone-600">RWF Earned</p>
        </div>
        <div className="rounded-[20px] border border-stone-200/70 bg-white p-4 text-center">
          <div className="mx-auto h-5 w-5 rounded-full bg-yellow-100" />
          <p className="mt-2 text-2xl font-bold text-stone-900">{stats.pendingReferrals}</p>
          <p className="text-xs text-stone-600">Pending</p>
        </div>
      </div>

      {/* Referral Code */}
      <div className="rounded-[20px] border border-stone-200/70 bg-white p-6">
        <h4 className="font-semibold text-stone-900">Your Referral Code</h4>
        <p className="mt-1 text-sm text-stone-600">Share this code with friends and earn rewards!</p>
        
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 rounded-full border-2 border-dashed border-stone-300 bg-stone-50 px-6 py-3 text-center">
            <p className="text-lg font-bold text-[#8B4513]">{referralCode}</p>
          </div>
          <button
            onClick={copyReferralCode}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 transition hover:border-[#8B4513] hover:text-[#8B4513]"
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
          </button>
        </div>

        <button
          onClick={shareReferralLink}
          className="mt-4 w-full rounded-full bg-[#8B4513] py-3 text-sm font-semibold text-white transition hover:bg-[#6d3410]"
        >
          Share Referral Link
        </button>
      </div>

      {/* How it Works */}
      <div className="rounded-[20px] border border-stone-200/70 bg-white p-6">
        <h4 className="font-semibold text-stone-900">How it Works</h4>
        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#8B4513] text-xs font-bold text-white">1</div>
            <p className="text-sm text-stone-700">Share your unique referral code with friends</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#8B4513] text-xs font-bold text-white">2</div>
            <p className="text-sm text-stone-700">Your friend signs up and makes their first purchase</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#8B4513] text-xs font-bold text-white">3</div>
            <p className="text-sm text-stone-700">You both get 500 RWF in your wallet!</p>
          </div>
        </div>
      </div>

      {/* Referral History */}
      {referrals.length > 0 && (
        <div className="rounded-[20px] border border-stone-200/70 bg-white p-6">
          <h4 className="font-semibold text-stone-900">Referral History</h4>
          <div className="mt-4 space-y-3">
            {referrals.map((referral) => (
              <div key={referral.id} className="flex items-center justify-between rounded-[16px] border border-stone-100 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900">{referral.email}</p>
                  <p className="text-xs text-stone-600">
                    {new Date(referral.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full px-3 py-1 text-xs font-medium", getStatusColor(referral.status))}>
                    {getStatusLabel(referral.status)}
                  </span>
                  {referral.reward > 0 && (
                    <span className="text-sm font-semibold text-green-600">+{referral.reward} RWF</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}