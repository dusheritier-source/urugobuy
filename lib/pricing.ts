import type { Locale, SupportedRegion } from "@/lib/locale";
import { getRegionFromLocale } from "@/lib/locale";

export type RegionPricing = {
  taxRate: number;
  shippingCost: number;
};

const REGION_PRICING: Record<SupportedRegion, RegionPricing> = {
  RW: {
    taxRate: 0.18,
    shippingCost: 15,
  },
  KE: {
    taxRate: 0.16,
    shippingCost: 18,
  },
  UG: {
    taxRate: 0.17,
    shippingCost: 17,
  },
};

export function getRegionPricing(locale: Locale | null | undefined): RegionPricing {
  const region = locale ? getRegionFromLocale(locale) : "RW";
  return REGION_PRICING[region] ?? REGION_PRICING.RW;
}

