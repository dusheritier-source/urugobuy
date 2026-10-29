import { writeFile } from "node:fs/promises";
import { products } from "../lib/data.ts";
import { catalogEmbedding, embeddingKey, MODEL_ID } from "../lib/server/visual-search-engine.mjs";

// Build once before deployment. Only public catalog image embeddings are saved.
const filename = new URL("../lib/server/visual-search-index.json", import.meta.url);
const embeddings = {};
const pending = products.flatMap((product) => product.images.slice(0, 3).map((source) => ({ product, source })));
let completed = 0;
let failed = 0;
console.log(`Indexing ${pending.length} catalog images with ${MODEL_ID} (q8).`);
async function worker() {
  while (pending.length) {
    const { product, source } = pending.shift();
    try {
      embeddings[embeddingKey(product, source)] = await catalogEmbedding(product, source);
    } catch (error) {
      failed++;
      console.error(`Skipped ${product.id}: ${error.message}`);
    }
    completed++;
    if (completed % 10 === 0) console.log(`${completed} images processed`);
  }
}
await Promise.all(Array.from({ length: 4 }, worker));
if (!Object.keys(embeddings).length) throw new Error("No catalog images could be indexed.");
await writeFile(filename, JSON.stringify(embeddings));
console.log(`Saved ${Object.keys(embeddings).length} embeddings; ${failed} unavailable images.`);
