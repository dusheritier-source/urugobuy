"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";
import { useCartStore } from "@/store/cart-store";

export function CartNoticeToasts() {
  const notice = useCartStore((state) => state.notice);
  const clearNotice = useCartStore((state) => state.clearNotice);
  useEffect(() => {
    if (!notice) return;
    toast.error(notice.message, { id: notice.id, duration: 5_000 });
    clearNotice();
  }, [clearNotice, notice]);
  return null;
}
