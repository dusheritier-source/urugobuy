"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/auth-provider";
import type { PriceNotification } from "@/lib/price-alerts";

export function usePriceAlertInbox(cursor: string | null = null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["price-alerts", user?.uid, "inbox", cursor], enabled: Boolean(user), staleTime: 30_000, refetchInterval: 60_000, retry: false,
    queryFn: async ({ signal }) => {
      const token = await user!.getIdToken();
      const response = await fetch(`/api/price-alerts?inbox=1${cursor ? `&notificationCursor=${encodeURIComponent(cursor)}` : ""}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error?.message || "Could not load notifications");
      return data as { notifications: PriceNotification[]; unreadCount: number; nextNotificationCursor: string | null };
    },
  });
}
export function useRefreshPriceAlerts() {
  const client = useQueryClient();
  const { user } = useAuth();
  return () => client.invalidateQueries({ queryKey: ["price-alerts", user?.uid] });
}
