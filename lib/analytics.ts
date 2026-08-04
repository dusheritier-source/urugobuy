type AnalyticsWindow = Window & { gtag?: (...args: unknown[]) => void };
export function trackCommerceEvent(name: string, data: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  try { const consent = JSON.parse(localStorage.getItem("urugo-cookie-consent") ?? "{}"); if (consent?.state?.choice !== "all") return; } catch { return; }
  (window as AnalyticsWindow).gtag?.("event", name, { currency: "USD", ...data });
}
