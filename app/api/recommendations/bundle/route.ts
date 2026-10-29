import { z } from "zod";
import { ApiError, apiError, clientAddress, noStoreJson } from "@/lib/server/api";
import { rateLimit } from "@/lib/server/rate-limit";
import { boundedJson } from "@/lib/server/request-body";
import { publishedProducts } from "@/lib/server/catalog";
import { sellingPrice } from "@/lib/product-pricing";

const schema = z.object({ lines: z.array(z.object({ productId: z.string().min(1).max(128), expectedPrice: z.number().finite().nonnegative() }).strict()).min(1).max(4) }).strict()
  .refine((input) => new Set(input.lines.map((line) => line.productId)).size === input.lines.length, { message: "Choose distinct products" });
export async function POST(request: Request) {
  try {
    rateLimit(`recommendation-bundle:${clientAddress(request)}`, 30, 60_000);
    const input = schema.parse(await boundedJson(request, 4096));
    const catalog = await publishedProducts({ fresh: true });
    const products = input.lines.map((line) => catalog.find((product) => product.id === line.productId));
    if (products.some((product) => !product || product.stock < 1)) throw new ApiError(409, "One of these products is unavailable. Refresh the page to see current options.", "bundle_unavailable");
    const verified = products.filter((product) => product != null);
    if (verified.some((product, index) => Math.abs(sellingPrice(product) - input.lines[index].expectedPrice) > 0.005)) {
      return noStoreJson({ error: { code: "bundle_changed", message: "Prices changed. Review the updated total and click again to confirm." }, products: verified }, { status: 409 });
    }
    return noStoreJson({ products: verified });
  } catch (error) {
    const response = apiError(error); response.headers.set("Cache-Control", "private, no-store"); return response;
  }
}
