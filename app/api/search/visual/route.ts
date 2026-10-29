import { ApiError, apiError, clientAddress, noStoreJson } from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { IMAGE_TYPES, InvalidPhotoError, MAX_IMAGE_BYTES, normalizeImage } from "@/lib/server/visual-search-engine.mjs";
import { searchByPhoto } from "@/lib/server/visual-search";

export const runtime = "nodejs";
export const maxDuration = 300;

async function limitedBody(request: Request) {
  const maximum = MAX_IMAGE_BYTES + 64 * 1024;
  if (Number(request.headers.get("content-length")) > maximum) throw new ApiError(413, "Choose a photo smaller than 10 MB.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Choose a photo to search.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) throw new ApiError(413, "Choose a photo smaller than 10 MB.");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return Buffer.concat(chunks);
}

export async function POST(request: Request) {
  try {
    rateLimit(`visual-search:${clientAddress(request)}`, 10, 60_000);
    if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) throw new ApiError(415, "Upload a JPG, PNG, or WebP photo.");
    const body = await limitedBody(request);
    let form: FormData;
    try {
      form = await new Response(new Uint8Array(body), { headers: { "Content-Type": request.headers.get("content-type")! } }).formData();
    } catch { throw new ApiError(400, "The photo upload could not be read. Please choose it again."); }
    const file = form.get("image");
    if (!(file instanceof File) || !file.size) throw new ApiError(400, "Choose a photo to search.");
    if (file.size > MAX_IMAGE_BYTES) throw new ApiError(413, "Choose a photo smaller than 10 MB.");
    if (!IMAGE_TYPES.includes(file.type)) throw new ApiError(415, "Use a JPG, PNG, or WebP photo.");
    let bytes: Buffer;
    try { bytes = await normalizeImage(Buffer.from(await file.arrayBuffer())); }
    catch (error) { throw new ApiError(422, error instanceof InvalidPhotoError ? error.message : "This photo could not be read. Use a JPG, PNG, or WebP between 32 pixels and 25 megapixels."); }
    return noStoreJson(await searchByPhoto(bytes));
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
