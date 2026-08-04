"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, ShoppingCart, Eye, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  pageViews: number;
  uniqueVisitors: number;
  conversions: number;
  revenue: number;
  topPages: Array<{ path: string; views: number }>;
  topProducts: Array<{ name: string; sales: number }>;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");

  useEffect(() => {
    // Simulate fetching analytics data
    // In a real app, this would come from your analytics backend
    const mockData: AnalyticsData = {
      pageViews: 12543,
      uniqueVisitors: 3892,
      conversions: 456,
      revenue: 125000,
      topPages: [
        { path: "/products", views: 4521 },
        { path: "/", views: 3892 },
        { path: "/categories", views: 2134 },
        { path: "/deals", views: 1876 },
        { path: "/cart", views: 120 },
      ],
      topProducts: [
        { name: "Product A", sales: 234 },
        { name: "Product B", sales: 189 },
        { name: "Product C", sales: 156 },
        { name: "Product D", sales: 98 },
        { name: "Product E", sales: 76 },
      ],
    };

    setData(mockData);
  }, [timeRange]);

  if (!data) {
    return (
      <div className="rounded-[28px] border border-stone-200/70 bg-white p-12 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#8B4513] border-t-transparent" />
        </div>
      </div>
    );
  }

  const conversionRate = ((data.conversions / data.uniqueVisitors) * 100).toFixed(2);

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-stone-900">Analytics Dashboard</h3>
        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                timeRange === range
                  ? "bg-[#8B4513] text-white"
                  : "border border-stone-200 text-stone-700 hover:border-[#8B4513]"
              )}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Eye}
          label="Page Views"
          value={data.pageViews.toLocaleString()}
          change="+12.5%"
          positive
        />
        <MetricCard
          icon={Users}
          label="Unique Visitors"
          value={data.uniqueVisitors.toLocaleString()}
          change="+8.2%"
          positive
        />
        <MetricCard
          icon={ShoppingCart}
          label="Conversions"
          value={data.conversions.toLocaleString()}
          change={`${conversionRate}%`}
          positive
        />
        <MetricCard
          icon={TrendingUp}
          label="Revenue"
          value={`$${data.revenue.toLocaleString()}`}
          change="+15.3%"
          positive
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Pages */}
        <div className="rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <BarChart3 size={20} className="text-[#8B4513]" />
            <h4 className="font-semibold text-stone-900">Top Pages</h4>
          </div>
          <div className="mt-4 space-y-3">
            {data.topPages.map((page, index) => (
              <div key={page.path} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B4513]/10 text-sm font-semibold text-[#8B4513]">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900">{page.path}</p>
                  <p className="text-xs text-stone-600">{page.views.toLocaleString()} views</p>
                </div>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full bg-[#8B4513]"
                    style={{ width: `${(page.views / data.topPages[0].views) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-[28px] border border-stone-200/70 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-[#8B4513]" />
            <h4 className="font-semibold text-stone-900">Top Products</h4>
          </div>
          <div className="mt-4 space-y-3">
            {data.topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8B4513]/10 text-sm font-semibold text-[#8B4513]">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900">{product.name}</p>
                  <p className="text-xs text-stone-600">{product.sales} sales</p>
                </div>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-stone-200">
                  <div
                    className="h-full bg-[#8B4513]"
                    style={{ width: `${(product.sales / data.topProducts[0].sales) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  positive,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-[20px] border border-stone-200/70 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B4513]/10">
          <Icon size={24} className="text-[#8B4513]" />
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            positive ? "text-green-600" : "text-red-600"
          )}
        >
          {change}
        </span>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-stone-900">{value}</p>
        <p className="text-sm text-stone-600">{label}</p>
      </div>
    </div>
  );
}