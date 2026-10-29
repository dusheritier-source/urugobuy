import test from "node:test";
import assert from "node:assert/strict";
import { sellingPrice, shouldNotifyPriceDrop } from "../lib/product-pricing.mjs";

test("price alerts compare discounted selling prices and require an in-stock product", () => {
  assert.equal(sellingPrice({ price: 100, discount: 10 }), 90);
  assert.equal(shouldNotifyPriceDrop(100, 90, 1), true);
  assert.equal(shouldNotifyPriceDrop(90, 90, 1), false);
  assert.equal(shouldNotifyPriceDrop(90, 95, 1), false);
  assert.equal(shouldNotifyPriceDrop(100, 80, 0), false);
});

test("price alerts reject missing or invalid subscription prices", () => {
  assert.equal(shouldNotifyPriceDrop(Number.NaN, 80, 1), false);
  assert.equal(shouldNotifyPriceDrop(100, Number.NaN, 1), false);
});
