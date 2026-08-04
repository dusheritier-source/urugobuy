"use client";

import { useState } from "react";
import { Package, Truck, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface OrderItem {
  id: string;
  productName: string;
  image: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  items: OrderItem[];
  total: number;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

interface OrderHistoryProps {
  orders: Order[];
  className?: string;
}

const statusConfig = {
  processing: {
    icon: Clock,
    label: "Processing",
    color: "text-yellow-600 bg-yellow-50",
  },
  shipped: {
    icon: Truck,
    label: "Shipped",
    color: "text-blue-600 bg-blue-50",
  },
  delivered: {
    icon: CheckCircle,
    label: "Delivered",
    color: "text-green-600 bg-green-50",
  },
  cancelled: {
    icon: Package,
    label: "Cancelled",
    color: "text-red-600 bg-red-50",
  },
};

export function OrderHistory({ orders, className }: OrderHistoryProps) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className={cn("rounded-[28px] border border-stone-200/70 bg-white p-12 shadow-sm text-center", className)}>
        <Package size={48} className="mx-auto text-stone-400" />
        <h3 className="mt-4 text-lg font-semibold text-stone-900">No orders yet</h3>
        <p className="mt-2 text-sm text-stone-600">Start shopping to see your orders here</p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#8B4513] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#6d3410]"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-xl font-semibold text-stone-900">Order History</h3>
      
      <div className="space-y-4">
        {orders.map((order) => {
          const status = statusConfig[order.status];
          const StatusIcon = status.icon;
          const isExpanded = expandedOrder === order.id;

          return (
            <div
              key={order.id}
              className="rounded-[20px] border border-stone-200/70 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-semibold text-stone-900">Order #{order.orderNumber}</h4>
                    <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium", status.color)}>
                      <StatusIcon size={14} />
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {new Date(order.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-stone-900">${order.total.toFixed(2)}</p>
                  <p className="text-sm text-stone-600">{order.items.length} items</p>
                </div>
              </div>

              {order.trackingNumber && (
                <div className="mt-4 rounded-[16px] bg-[#fff8f1] p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <Truck size={16} className="text-[#8B4513]" />
                      <span className="text-stone-700">
                        Tracking: <span className="font-medium">{order.trackingNumber}</span>
                      </span>
                    </div>
                    {order.estimatedDelivery && (
                      <span className="text-sm text-stone-600">
                        Est. delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                className="mt-4 flex items-center gap-2 text-sm font-medium text-[#8B4513] transition hover:text-[#6d3410]"
              >
                {isExpanded ? "Hide details" : "View details"}
                <ChevronRight size={16} className={cn("transition-transform", isExpanded && "rotate-90")} />
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 rounded-[16px] border border-stone-100 p-3">
                      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                        <img src={item.image} alt={item.productName} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-stone-900">{item.productName}</p>
                        <p className="text-sm text-stone-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-stone-900">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}