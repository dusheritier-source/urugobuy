import "server-only";

import { catalogImageUrl } from "@/lib/catalog-image.mjs";
import { cache } from "react";
import { z } from "zod";
import { products as seedProducts } from "@/lib/data";
import type { Product } from "@/types";
import { adminDb } from "@/lib/server/firebase-admin";
import { productTranslationsSchema } from "@/lib/server/schemas";

const publicProduct = z.object({
  id: z.string().min(1).max(128), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().max(200), description: z.string().max(10_000), category: z.string().max(200), brand: z.string().max(200),
  translations: productTranslationsSchema,
  price: z.number().finite().nonnegative(), discount: z.number().min(0).max(100), rating: z.number().min(0).max(5), stock: z.number().int().nonnegative(),
  images: z.array(z.string().max(2048)).min(1).max(12), colors: z.array(z.string().max(200)), sizes: z.array(z.string().max(200)),
  createdAt: z.string(), updatedAt: z.string(),
});
const starterProducts = seedProducts.map((product) => ({ ...product, images: product.images.map(catalogImageUrl) }));
let catalog: { expires: number; promise: Promise<Product[]> } | undefined;
export function hasServerCatalog() {
  return Boolean((process.env.FIREBASE_ADMIN_CLIENT_EMAIL && process.env.FIREBASE_ADMIN_PRIVATE_KEY) ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GOOGLE_CLOUD_PROJECT || process.env.K_SERVICE);
}
export function invalidateCatalog() { catalog = undefined; }
export async function publishedProducts(options: { fresh?: boolean } = {}): Promise<Product[]> {
  if (!hasServerCatalog()) return starterProducts;
  if (options.fresh || !catalog || catalog.expires < Date.now()) {
    const promise = adminDb().collection("products").where("status", "==", "published").get()
      .then((snapshot) => snapshot.docs.flatMap((doc) => {
        const parsed = publicProduct.safeParse({ ...doc.data(), id: doc.id });
        if (!parsed.success) { console.warn("Invalid published product omitted", doc.id); return []; }
        return [{ ...parsed.data, images: parsed.data.images.map(catalogImageUrl) }];
      }))
      .catch((error) => { catalog = undefined; throw error; });
    catalog = { expires: Date.now() + 60_000, promise };
  }
  return catalog.promise;
}
export const findPublishedProduct = cache(async (slug: string) =>
  (await publishedProducts()).find((product) => product.slug === slug),
);
