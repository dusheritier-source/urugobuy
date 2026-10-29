import type { Product } from "@/types";

export function mergeBundle<T extends Product & { quantity: number }>(items: T[], products: Product[]) {
  if (!products.length || products.length > 4 || new Set(products.map((product) => product.id)).size !== products.length) {
    return { accepted: false as const, message: "Choose between one and four different products.", items };
  }
  const unavailable = products.find((product) => {
    const quantity = items.find((item) => item.id === product.id)?.quantity ?? 0;
    return !Number.isInteger(product.stock) || product.stock < quantity + 1;
  });
  if (unavailable) return { accepted: false as const, message: `${unavailable.title} does not have enough stock for another item.`, items };
  const fresh = new Map(products.map((product) => [product.id, product]));
  const merged = items.map((item) => fresh.has(item.id) ? { ...item, ...fresh.get(item.id)!, quantity: item.quantity + 1 } : item);
  const existingIds = new Set(items.map((item) => item.id));
  const additions = products.filter((product) => !existingIds.has(product.id)).map((product) => ({ ...product, quantity: 1 }));
  return { accepted: true as const, message: `${products.length} selected items added to your cart.`, items: [...merged, ...additions] };
}
