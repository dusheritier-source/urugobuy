import { z } from "zod";
import { ApiError, apiError, clientAddress, noStoreJson } from "@/lib/server/api";
import { publishedProducts } from "@/lib/server/catalog";
import { boundedJson } from "@/lib/server/request-body";
import { rateLimit } from "@/lib/server/rate-limit";
import { sellingPrice } from "@/lib/assistant/core";

const schema = z.object({ productId: z.string().min(1).max(128), quantity: z.number().int().min(1).max(99), expectedPrice: z.number().finite().nonnegative() }).strict();
export async function POST(request: Request) {
  try {
    rateLimit(`assistant-cart:${clientAddress(request)}`, 30, 60_000);
    const input = schema.parse(await boundedJson(request, 2048));
    const product = (await publishedProducts({ fresh: true })).find((product) => product.id === input.productId);
    if (!product || product.stock < input.quantity) throw new ApiError(409, "This product or quantity is no longer available. Ask the assistant for another option.");
    if (Math.abs(sellingPrice(product) - input.expectedPrice) > 0.005) return noStoreJson({ error: { code: "price_changed", message: "The price changed. Review the updated price and confirm again." }, currentPrice: sellingPrice(product) }, { status: 409 });
    return noStoreJson({ product, quantity: input.quantity });
  } catch (error) {
    const response = apiError(error);
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
}
