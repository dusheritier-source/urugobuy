import "server-only";
import { ApiError } from "@/lib/server/api";

export async function boundedJson(request: Request, maximum = 32 * 1024): Promise<unknown> {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new ApiError(415, "Send a JSON request.");
  if (Number(request.headers.get("content-length")) > maximum) throw new ApiError(413, "This conversation is too long. Start a new chat.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "A message is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) throw new ApiError(413, "This conversation is too long. Start a new chat.");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new ApiError(400, "The message could not be read."); }
}
