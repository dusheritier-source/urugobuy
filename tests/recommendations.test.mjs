import test from "node:test";
import { catalogImageUrl } from "../lib/catalog-image.mjs";
import assert from "node:assert/strict";
import { relatedProducts, complementaryProducts, personalizedProducts, recentlyViewedProducts, productType } from "../lib/recommendations.ts";
import { mergeBundle } from "../lib/bundle-cart.ts";
import { sellingPrice } from "../lib/product-pricing.mjs";
import { products as catalog } from "../lib/data.ts";

const product = (id, title, category = "Home", extra = {}) => ({ id, slug: id, title, category, brand: "Urugo", description: "A catalog item", price: 100, discount: 10, stock: 10, rating: 4.5, colors: [], sizes: [], images: ["/item.jpg"], createdAt: "2026-10-25", updatedAt: "2026-10-25", ...extra });
const chair = product("chair", "Linen Reading Chair");
const anotherChair = product("chair-2", "Grey Reading Chair");
const light = product("lamp", "Warm Floor Lamp", "Home", { price: 60, discount: 20 });
const cushion = product("cushion", "Soft Sofa Cushion", "Home", { price: 20, discount: 0 });
const sink = product("sink", "Kitchen Sink");
const phone = product("phone", "Apple iPhone 14", "Electronics");
const charger = product("charger", "Wireless Charger", "Electronics");
const unavailable = product("sold", "Matching Reading Chair", "Home", { stock: 0 });
const items = [chair, sink, light, cushion, anotherChair, phone, charger, unavailable];

test("related products prefer matching types, stay in category, exclude current and unavailable items", () => {
  const results = relatedProducts(items, chair.id);
  assert.equal(results[0].product.id, anotherChair.id);
  assert.equal(results.every(({ product }) => product.id !== chair.id && product.stock > 0 && product.category === "Home"), true);
  assert.equal(new Set(results.map(({ product }) => product.id)).size, results.length);
});

test("complements are useful distinct types instead of arbitrary products", () => {
  const results = complementaryProducts(items, chair.id);
  assert.deepEqual(new Set(results.map(({ product }) => product.id)), new Set([cushion.id, light.id]));
  assert.equal(results.some(({ product }) => product.id === anotherChair.id || product.id === sink.id), false);
  assert.deepEqual(complementaryProducts(items, sink.id), []);
  assert.deepEqual(complementaryProducts(items, unavailable.id), []);
});

test("electronics suggestions disclose compatibility uncertainty", () => {
  const results = complementaryProducts(items, phone.id);
  assert.equal(results[0].product.id, charger.id);
  assert.match(results[0].reason, /compatibility/);
  assert.equal(productType(phone), "phone");
});

test("recent views preserve newest-first order and remove missing/current/duplicate IDs", () => {
  const history = ["missing", light.id, phone.id, light.id, chair.id];
  assert.deepEqual(recentlyViewedProducts(items, history, chair.id).map((product) => product.id), [light.id, phone.id]);
});

test("personal recommendations exclude viewed/cart items and unavailable products", () => {
  const results = personalizedProducts(items, [chair.id], [light.id], 4);
  assert.equal(results[0].product.id, anotherChair.id);
  assert.equal(results.every(({ product }) => ![chair.id, light.id, unavailable.id].includes(product.id)), true);
  assert.match(results[0].reason, /browsing/);
});

test("empty history has honest top-rated fallback and results are deterministic", () => {
  const results = personalizedProducts(items, [], [], 4);
  assert.equal(results.every(({ reason }) => reason === "Highly rated in our catalog"), true);
  assert.deepEqual(results, personalizedProducts([...items].reverse(), [], [], 4));
  assert.deepEqual(personalizedProducts([], [], []), []);
  assert.deepEqual(personalizedProducts(items, [], [], 0), []);
  assert.deepEqual(relatedProducts(items, "not-published"), []);
});

test("bundle totals sum per-item discounts without adding percentage discounts together", () => {
  const selected = [chair, light, cushion];
  assert.equal(selected.reduce((sum, item) => sum + sellingPrice(item), 0), 158);
});

test("bundle cart merge is atomic, refreshes pricing, and increments existing items", () => {
  const old = [{ ...chair, price: 999, quantity: 2 }];
  const result = mergeBundle(old, [chair, light]);
  assert.equal(result.accepted, true);
  assert.equal(result.items.find((item) => item.id === chair.id).quantity, 3);
  assert.equal(result.items.find((item) => item.id === chair.id).price, chair.price);
  assert.equal(result.items.find((item) => item.id === light.id).quantity, 1);
  assert.equal(old[0].quantity, 2);
});

test("stock exhaustion, duplicate lines and empty bundles never partially mutate the cart", () => {
  const original = [{ ...chair, quantity: 10 }];
  const stock = mergeBundle(original, [chair, light]);
  assert.equal(stock.accepted, false);
  assert.equal(stock.items, original);
  assert.equal(stock.items.some((item) => item.id === light.id), false);
  assert.equal(mergeBundle([], [chair, chair]).accepted, false);
  assert.equal(mergeBundle([], []).accepted, false);
});

test("actual catalog provides relevant, in-stock companions and safe recommendation limits", () => {
  const item = catalog.find((product) => product.slug === "arisha-3-ring-pendant-light");
  assert.ok(item);
  const results = complementaryProducts(catalog, item.id);
  assert.ok(results.length > 0);
  assert.equal(results.every(({ product }) => productType(product) === "vase" && product.stock > 0), true);
  const recommendations = relatedProducts(catalog, item.id, 4);
  assert.ok(recommendations.length <= 4);
  assert.equal(recommendations.every(({ product }) => product.id !== item.id && product.stock > 0), true);
});

test("local image filenames encode reserved characters and remain idempotent", () => {
  const path = "/images/Photo + Name, 1&2.jpg";
  const encoded = "/images/Photo%20%2B%20Name%2C%201%262.jpg";
  assert.equal(catalogImageUrl(path), encoded);
  assert.equal(catalogImageUrl(encoded), encoded);
  assert.equal(catalogImageUrl("https://images.unsplash.com/a?auto=format&w=500"), "https://images.unsplash.com/a?auto=format&w=500");
});
