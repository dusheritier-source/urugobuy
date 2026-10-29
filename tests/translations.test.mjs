import test from "node:test";
import assert from "node:assert/strict";
import { LOCALES, languageTag, stripLocalePrefix } from "../lib/locale.ts";
import { productContent, translate } from "../lib/translations.ts";
import { productSchema } from "../lib/server/schemas.ts";

test("all ten storefront locales are supported with script-aware Chinese tags", () => {
  assert.equal(LOCALES.length, 10);
  assert.equal(languageTag("zh_RW"), "zh-Hans-RW");
  assert.deepEqual(stripLocalePrefix("/profile/price-alerts"), { locale: "en_RW", rest: "/profile/price-alerts" });
  assert.deepEqual(stripLocalePrefix("/fr_RW/products/widget"), { locale: "fr_RW", rest: "/products/widget" });
});

test("shared interface strings are available in every supported language", () => {
  for (const language of ["en", "rw", "fr", "zh", "sw", "ar", "es", "pt", "hi", "de"]) {
    assert.ok(translate(language, "products"));
    assert.ok(translate(language, "language"));
  }
});

test("product content uses manual translations and falls back field by field", () => {
  const product = {
    title: "Original title",
    description: "Original description",
    translations: { fr: { title: "Titre traduit" } },
  };
  assert.deepEqual(productContent(product, "fr"), {
    ...product,
    title: "Titre traduit",
    description: "Original description",
  });
  assert.equal(productContent(product, "de").title, "Original title");
});

test("catalog validation accepts partial translations and rejects unsupported languages", () => {
  const product = {
    title: "Product",
    slug: "product",
    description: "Description",
    category: "Home",
    brand: "Brand",
    price: 10,
    discount: 0,
    images: ["https://example.com/product.jpg"],
    rating: 0,
    stock: 1,
    colors: [],
    sizes: [],
    status: "published",
    translations: { rw: { title: "Igicuruzwa" } },
  };
  assert.equal(productSchema.safeParse(product).success, true);
  assert.equal(productSchema.safeParse({ ...product, translations: { xx: { title: "Invalid" } } }).success, false);
});
