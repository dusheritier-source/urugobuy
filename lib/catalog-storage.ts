import type { Product } from "@/types";

export const CATALOG_STORAGE_KEY = "urugo:catalog:v1";

export function readCatalog(fallback: Product[]): Product[] {
  if (typeof window === "undefined") return fallback;
  try {
    const value = JSON.parse(localStorage.getItem(CATALOG_STORAGE_KEY) ?? "null");
    return Array.isArray(value) ? value : fallback;
  } catch { return fallback; }
}

export function writeCatalog(products: Product[]) {
  localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event("urugo:catalog-change"));
}
