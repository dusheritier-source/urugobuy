import "server-only";

import type { Product } from "@/types";
import { publishedProducts } from "@/lib/server/catalog";
import { ApiError } from "@/lib/server/api";
import { catalogEmbedding, embedImage, rankImages } from "./visual-search-engine.mjs";
import bundledEmbeddings from "./visual-search-index.json";

type Entry = { product: Product; vector: number[] };
type Index = { entries: Entry[]; skipped: number; productCount: number };
let indexCache: { expires: number; promise: Promise<Index> } | undefined;

async function buildIndex(): Promise<Index> {
  const products = await publishedProducts();
  const entries: Entry[] = [];
  let skipped = 0;
  for (const product of products) {
    let indexed = false;
    for (const source of (product.images ?? []).slice(0, 3)) {
      try {
        const vector = await catalogEmbedding(product, source, bundledEmbeddings);
        entries.push({ product, vector });
        indexed = true;
      } catch (error) {
        console.warn(`Photo search could not index product ${product.id}`, error instanceof Error ? error.message : "Image unavailable");
      }
    }
    if (!indexed) skipped++;
  }
  if (products.length && !entries.length) throw new ApiError(503, "Product images are temporarily unavailable. Please try again shortly.", "index_unavailable");
  return { entries, skipped, productCount: products.length };
}

function getIndex() {
  if (!indexCache || indexCache.expires < Date.now()) {
    const promise = buildIndex().catch((error) => { indexCache = undefined; throw error; });
    indexCache = { expires: Date.now() + 5 * 60_000, promise };
  }
  return indexCache.promise;
}

let activeSearches = 0;
export async function searchByPhoto(bytes: Buffer) {
  if (activeSearches >= 2) throw new ApiError(503, "Photo search is busy. Please try again shortly.", "search_busy");
  activeSearches++;
  try {
    // Encode the query first so model initialization failures stop indexing early.
    let query: number[];
    try { query = await embedImage(bytes); }
    catch (error) {
      console.error("Photo search model failed to load", error);
      throw new ApiError(503, "Photo search is temporarily unavailable. Please try again shortly.", "model_unavailable");
    }
    const index = await getIndex();
    return {
      results: rankImages(query, index.entries),
      indexedProducts: index.productCount - index.skipped,
      unavailableProducts: index.skipped,
    };
  } finally { activeSearches--; }
}
