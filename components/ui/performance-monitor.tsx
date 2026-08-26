"use client";

import { useState, useEffect } from "react";
import { Activity, Zap, Clock, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

interface PerformanceLayoutShift extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) {
      return;
    }

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      const newMetrics: Partial<PerformanceMetrics> = {};
      
      entries.forEach((entry) => {
        switch (entry.entryType) {
          case "paint":
            if (entry.name === "first-contentful-paint") {
              newMetrics.fcp = entry.startTime;
            }
            break;
          case "largest-contentful-paint":
            newMetrics.lcp = entry.startTime;
            break;
          case "first-input":
            const eventTiming = entry as PerformanceEventTiming;
            newMetrics.fid = eventTiming.processingStart - entry.startTime;
            break;
          case "layout-shift":
            const layoutShift = entry as PerformanceLayoutShift;
            if (!layoutShift.hadRecentInput) {
              newMetrics.cls = layoutShift.value;
            }
            break;
        }
      });

      if (Object.keys(newMetrics).length > 0) {
        setMetrics((prev) => ({ ...prev, ...newMetrics } as PerformanceMetrics));
      }
    });

    observer.observe({ type: "paint", buffered: true });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
    observer.observe({ type: "first-input", buffered: true });
    observer.observe({ type: "layout-shift", buffered: true });

    // Get TTFB
    const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      setMetrics((prev) => {
        if (!prev) return { fcp: 0, lcp: 0, fid: 0, cls: 0, ttfb: navigationEntry.responseStart - navigationEntry.requestStart };
        return { ...prev, ttfb: navigationEntry.responseStart - navigationEntry.requestStart };
      });
    }

    return () => observer.disconnect();
  }, []);

  const getScore = (metric: keyof PerformanceMetrics, value: number) => {
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[metric];
    if (value <= threshold.good) return "good";
    if (value <= threshold.poor) return "needs-improvement";
    return "poor";
  };

  const getScoreColor = (score: string) => {
    switch (score) {
      case "good":
        return "text-green-600 bg-green-50";
      case "needs-improvement":
        return "text-yellow-600 bg-yellow-50";
      case "poor":
        return "text-red-600 bg-red-50";
      default:
        return "text-stone-600 bg-stone-50";
    }
  };

  if (!metrics) return null;

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-800 shadow-lg"
      >
        <Activity size={16} className="text-[#8B4513]" />
        Performance
      </button>

      {isVisible && (
        <div className="fixed bottom-20 left-4 z-40 w-80 rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-stone-900">Performance Metrics</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="rounded-full p-1 text-stone-600 transition hover:bg-stone-100"
            >
              <Activity size={16} />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {Object.entries(metrics).map(([key, value]) => {
              const score = getScore(key as keyof PerformanceMetrics, value);
              const scoreColor = getScoreColor(score);
              
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {key === "fcp" && <Zap size={16} className="text-stone-600" />}
                    {key === "lcp" && <Gauge size={16} className="text-stone-600" />}
                    {key === "fid" && <Clock size={16} className="text-stone-600" />}
                    {key === "cls" && <Activity size={16} className="text-stone-600" />}
                    {key === "ttfb" && <Activity size={16} className="text-stone-600" />}
                    <span className="text-sm font-medium text-stone-700 uppercase">{key}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-stone-900">{value.toFixed(0)}ms</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", scoreColor)}>
                      {score === "good" ? "✓" : score === "needs-improvement" ? "!" : "✗"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-[16px] bg-[#fff8f1] p-3">
            <p className="text-xs text-stone-700">
              Core Web Vitals: {metrics.fcp < 1800 && metrics.lcp < 2500 && metrics.fid < 100 ? "✅ Good" : "⚠️ Needs improvement"}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
