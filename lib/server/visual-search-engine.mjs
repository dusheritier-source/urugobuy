import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import sharp from "sharp";

export const MODEL_ID = "Xenova/clip-vit-base-patch32";
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_PIXELS = 25_000_000;
export const MIN_SIMILARITY = 0.70;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const cacheDirectory = process.env.VISUAL_SEARCH_CACHE_DIR || path.join(os.tmpdir(), "urugo-visual-search-v1");
let encoderPromise;
let inferenceQueue = Promise.resolve();

// Keep one model per process and serialize inference to bound native memory use.
async function encoder() {
  if (!encoderPromise) {
    encoderPromise = (async () => {
      const { AutoProcessor, CLIPVisionModelWithProjection, RawImage, env } = await import("@huggingface/transformers");
      env.cacheDir = path.join(cacheDirectory, "models");
      const [processor, model] = await Promise.all([
        AutoProcessor.from_pretrained(MODEL_ID),
        CLIPVisionModelWithProjection.from_pretrained(MODEL_ID, { dtype: "q8", device: "cpu" }),
      ]);
      return { processor, model, RawImage };
    })().catch((error) => { encoderPromise = undefined; throw error; });
  }
  return encoderPromise;
}

export class InvalidPhotoError extends Error {}

export async function normalizeImage(bytes) {
  // Decode the contents, rather than trusting the extension or MIME type.
  const image = sharp(bytes, { limitInputPixels: MAX_IMAGE_PIXELS, animated: false, failOn: "error" });
  const metadata = await image.metadata();
  if (!["jpeg", "png", "webp"].includes(metadata.format) || !metadata.width || !metadata.height) {
    throw new InvalidPhotoError("Use a valid JPG, PNG, or WebP photo.");
  }
  if (metadata.width < 32 || metadata.height < 32) throw new Error("Choose a photo at least 32 × 32 pixels.");
  const normalized = await image.rotate().resize(512, 512, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: "#ffffff" }).removeAlpha().png().toBuffer();
  const statistics = await sharp(normalized).stats();
  if (statistics.channels.every((channel) => channel.stdev < 2)) {
    throw new InvalidPhotoError("Choose a photo with a visible product and more detail.");
  }
  return normalized;
}

export function normalizeVector(values) {
  const vector = Array.from(values, Number);
  const length = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!length || !Number.isFinite(length)) throw new Error("Invalid image embedding");
  return vector.map((value) => value / length);
}

export function cosineSimilarity(a, b) {
  if (!a.length || a.length !== b.length) return -1;
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

export async function embedImage(normalizedBytes) {
  const task = inferenceQueue.then(async () => {
    const { processor, model, RawImage } = await encoder();
    const image = await RawImage.fromBlob(new Blob([new Uint8Array(normalizedBytes)], { type: "image/png" }));
    const inputs = await processor(image);
    const output = await model(inputs);
    try { return normalizeVector(output.image_embeds.data); }
    finally {
      for (const tensor of Object.values(inputs)) tensor?.dispose?.();
      for (const tensor of Object.values(output)) tensor?.dispose?.();
    }
  });
  inferenceQueue = task.catch(() => {});
  return task;
}

// Restrict catalog image reads to public assets and explicitly trusted hosts.
// Never fetch a URL supplied by the photo-search request.
export async function readCatalogImage(source) {
  if (source.startsWith("/") && !source.startsWith("//")) {
    const root = path.resolve(process.cwd(), "public");
    const target = path.resolve(root, `.${decodeURIComponent(source)}`);
    if (!target.startsWith(root + path.sep)) throw new Error("Invalid catalog image path");
    const bytes = await readFile(target);
    if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Catalog image too large");
    return bytes;
  }
  const url = new URL(source);
  const allowedHosts = new Set(["images.unsplash.com", "firebasestorage.googleapis.com", "storage.googleapis.com"]);
  if (url.protocol !== "https:" || !allowedHosts.has(url.hostname) || url.username || url.password || url.port) {
    throw new Error("Unsupported catalog image host");
  }
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: "error" });
  if (!response.ok || !IMAGE_TYPES.includes(response.headers.get("content-type")?.split(";")[0])) {
    throw new Error("Catalog image unavailable");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty catalog image");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) throw new Error("Catalog image too large");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return Buffer.concat(chunks);
}

export function embeddingKey(product, source) {
  let canonicalSource = source;
  if (source.startsWith("/") && !source.startsWith("//")) {
    try { canonicalSource = decodeURIComponent(source); } catch { /* Literal filename. */ }
  }
  return createHash("sha256").update(`${MODEL_ID}:q8:${product.id}:${product.updatedAt}:${canonicalSource}`).digest("hex");
}

export async function catalogEmbedding(product, source, bundled = {}) {
  const key = embeddingKey(product, source);
  if (bundled[key]?.length === 512) return bundled[key];
  const filename = path.join(cacheDirectory, "embeddings", `${key}.json`);
  try {
    const cached = JSON.parse(await readFile(filename, "utf8"));
    if (cached.length === 512 && cached.every(Number.isFinite)) return cached;
  } catch { /* Cache misses are encoded below. */ }
  const vector = await embedImage(await normalizeImage(await readCatalogImage(source)));
  try {
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, JSON.stringify(vector));
  } catch { /* Read-only hosts can still use the in-memory index. */ }
  return vector;
}

export function rankImages(query, entries, limit = 24) {
  const best = new Map();
  for (const entry of entries) {
    const similarity = cosineSimilarity(query, entry.vector);
    if (similarity < MIN_SIMILARITY) continue;
    const previous = best.get(entry.product.id);
    if (!previous || previous.similarity < similarity) best.set(entry.product.id, { product: entry.product, similarity });
  }
  return [...best.values()].sort((a, b) => b.similarity - a.similarity).slice(0, limit);
}
