"use client";

import { useEffect } from "react";

type ConversionEvent = 
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "purchase"
  | "view_item"
  | "search"
  | "sign_up"
  | "login";

interface ConversionTrackingProps {
  eventName: ConversionEvent;
  data?: Record<string, unknown>;
}

export function ConversionTracking({ eventName, data }: ConversionTrackingProps) {
  useEffect(() => {
    if (typeof window === "undefined" || !(window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      return;
    }

    const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
    
    gtag("event", eventName, {
      event_category: "ecommerce",
      event_label: eventName,
      ...data,
    });
  }, [eventName, data]);

  return null;
}

// Helper hook for tracking
export function useConversionTracking() {
  const trackEvent = (eventName: ConversionEvent, data?: Record<string, unknown>) => {
    if (typeof window !== "undefined" && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
      const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
      gtag("event", eventName, {
        event_category: "ecommerce",
        event_label: eventName,
        ...data,
      });
    }
  };

  return {
    trackAddToCart: (productId: string, productName: string, price: number) =>
      trackEvent("add_to_cart", { item_id: productId, item_name: productName, price }),
    trackRemoveFromCart: (productId: string) =>
      trackEvent("remove_from_cart", { item_id: productId }),
    trackBeginCheckout: (value: number, items: number) =>
      trackEvent("begin_checkout", { value, items }),
    trackPurchase: (transactionId: string, value: number) =>
      trackEvent("purchase", { transaction_id: transactionId, value }),
    trackViewItem: (productId: string, productName: string) =>
      trackEvent("view_item", { item_id: productId, item_name: productName }),
    trackSearch: (searchTerm: string) =>
      trackEvent("search", { search_term: searchTerm }),
    trackSignUp: (method: string) =>
      trackEvent("sign_up", { method }),
    trackLogin: (method: string) =>
      trackEvent("login", { method }),
  };
}