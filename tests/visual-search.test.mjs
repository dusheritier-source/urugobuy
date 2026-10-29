import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import { products } from "../lib/data.ts";
import {
  normalizeImage, normalizeVector, rankImages, readCatalogImage,
  embedImage, embeddingKey, MAX_IMAGE_PIXELS,
} from "../lib/server/visual-search-engine.mjs";

test("accepts real photos and preserves aspect ratio while bounding dimensions", async () => {
  const pixels = Buffer.from(Array.from({ length: 1600 * 800 * 3 }, (_, index) => index % 251));
  const original = await sharp(pixels, { raw: { width: 1600, height: 800, channels: 3 } }).jpeg().toBuffer();
  const metadata = await sharp(await normalizeImage(original)).metadata();
  assert.equal(metadata.width, 512);
  assert.equal(metadata.height, 256);
  assert.equal(metadata.format, "png");
});

test("rejects corrupt data, SVG, tiny images, and decompression bombs", async () => {
  await assert.rejects(normalizeImage(Buffer.from("not an image")));
  await assert.rejects(normalizeImage(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>')));
  const tiny = await sharp({ create: { width: 16, height: 16, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(normalizeImage(tiny), /at least 32/);
  const dimension = Math.ceil(Math.sqrt(MAX_IMAGE_PIXELS)) + 1;
  const huge = await sharp({ create: { width: dimension, height: dimension, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(normalizeImage(huge));
});

test("rejects blank photos instead of recommending unrelated products", async () => {
  const blank = await sharp({ create: { width: 512, height: 512, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(normalizeImage(blank), /visible product/);
});

test("catalog reads reject path traversal and arbitrary network hosts", async () => {
  for (const source of ["/../package.json", "/%2e%2e/package.json", "http://127.0.0.1/a.jpg", "https://example.com/a.jpg", "https://images.unsplash.com:8443/a.jpg", "//127.0.0.1/a.jpg"]) {
    await assert.rejects(readCatalogImage(source));
  }
});

test("ranking excludes unrelated images and deduplicates product gallery matches", () => {
  const a = { id: "a" }, b = { id: "b" }, c = { id: "c" };
  const results = rankImages([1, 0], [
    { product: a, vector: [0.75, 0.661] },
    { product: b, vector: [0, 1] },
    { product: a, vector: [1, 0] },
    { product: c, vector: [0.8, 0.6] },
  ]);
  assert.deepEqual(results.map(({ product }) => product.id), ["a", "c"]);
  assert.equal(results[0].similarity, 1);
  assert.deepEqual(rankImages([1, 0], [{ product: b, vector: [0, 1] }]), []);
  assert.throws(() => normalizeVector([0, 0]));
});

test("catalog changes invalidate cached embeddings", () => {
  const product = { id: "a", updatedAt: "2026-01-01" };
  assert.notEqual(embeddingKey(product, "/a.jpg"), embeddingKey({ ...product, updatedAt: "2026-01-02" }, "/a.jpg"));
  assert.notEqual(embeddingKey(product, "/a.jpg"), embeddingKey(product, "/b.jpg"));
});

test("real model retrieves re-encoded catalog photos across categories", { skip: process.env.RUN_MODEL_TESTS !== "1", timeout: 300_000 }, async () => {
  const bundled = JSON.parse(await readFile(new URL("../lib/server/visual-search-index.json", import.meta.url), "utf8"));
  const entries = products.flatMap((product) => product.images.slice(0, 3).flatMap((source) => {
    const vector = bundled[embeddingKey(product, source)];
    return vector ? [{ product, vector }] : [];
  }));
  assert.ok(entries.length > 100, "Build the index before running model tests");
  for (const category of ["Beauty", "Home", "Electronics", "Sport"]) {
    const product = products.find((product) => product.category === category && bundled[embeddingKey(product, product.images[0])]);
    assert.ok(product, `Missing indexed category ${category}`);
    const original = await readCatalogImage(product.images[0]);
    const changed = await sharp(original).resize({ width: 300 }).jpeg({ quality: 70 }).toBuffer();
    const query = await embedImage(await normalizeImage(changed));
    const result = rankImages(query, entries);
    assert.equal(result[0]?.product.id, product.id, `Incorrect top result for ${product.title}`);
  }
});

test("encoded local image URLs reuse the original catalog embedding keys", () => {
  const product = { id: "x", updatedAt: "2026-10-25" };
  assert.equal(embeddingKey(product, "/images/a b+c.jpg"), embeddingKey(product, "/images/a%20b%2Bc.jpg"));
});
