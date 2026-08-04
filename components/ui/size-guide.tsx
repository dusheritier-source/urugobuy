"use client";

import { useState } from "react";
import { X, Ruler } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface Size {
  label: string;
  measurements: {
    chest?: string;
    waist?: string;
    hips?: string;
    length?: string;
    shoulder?: string;
    sleeve?: string;
  };
}

interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  sizes: Size[];
  type: "clothing" | "shoes" | "accessories";
  className?: string;
}

const sizeCharts = {
  clothing: {
    title: "Clothing Size Guide",
    description: "Measurements in inches",
    columns: ["Size", "Chest", "Waist", "Hips", "Length"],
  },
  shoes: {
    title: "Shoe Size Guide",
    description: "US Sizes",
    columns: ["US", "EU", "UK", "CM"],
  },
  accessories: {
    title: "Accessories Size Guide",
    description: "One size fits most",
    columns: ["Size", "Width", "Height", "Depth"],
  },
};

export function SizeGuide({ isOpen, onClose, sizes, type, className }: SizeGuideProps) {
  const chart = sizeCharts[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl">
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#8B4513]/10">
            <Ruler size={24} className="text-[#8B4513]" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-stone-900">{chart.title}</h2>
            <p className="text-sm text-stone-600">{chart.description}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-stone-200">
                {chart.columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-left text-sm font-semibold text-stone-900"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sizes.map((size, index) => (
                <tr
                  key={index}
                  className="border-b border-stone-100 last:border-0 hover:bg-stone-50"
                >
                  <td className="px-4 py-3 text-sm font-medium text-stone-900">{size.label}</td>
                  {type === "clothing" && (
                    <>
                      <td className="px-4 py-3 text-sm text-stone-700">{size.measurements.chest}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{size.measurements.waist}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{size.measurements.hips}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{size.measurements.length}</td>
                    </>
                  )}
                  {type === "shoes" && (
                    <>
                      <td className="px-4 py-3 text-sm text-stone-700">{size.measurements.chest}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{size.measurements.waist}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{size.measurements.hips}</td>
                    </>
                  )}
                  {type === "accessories" && (
                    <>
                      <td className="px-4 py-3 text-sm text-stone-700">{size.measurements.chest}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{size.measurements.waist}</td>
                      <td className="px-4 py-3 text-sm text-stone-700">{size.measurements.hips}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-[16px] bg-[#fff8f1] p-4">
          <h3 className="text-sm font-semibold text-stone-900">How to Measure</h3>
          <ul className="mt-2 space-y-1 text-sm text-stone-700">
            <li>• Chest: Measure around the fullest part of your chest</li>
            <li>• Waist: Measure around your natural waistline</li>
            <li>• Hips: Measure around the fullest part of your hips</li>
            <li>• Length: Measure from shoulder to desired length</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-full bg-[#8B4513] py-3 font-semibold text-white transition hover:bg-[#6d3410]"
        >
          Got it
        </button>
      </div>
    </Modal>
  );
}