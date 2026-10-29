import test from "node:test";
import assert from "node:assert/strict";
import { eligiblePriceDrop, needsPriceAlertEvent, priceAlertInput, cancelPriceAlertInput } from "../lib/price-alerts.ts";
import { processPriceAlertEvent } from "../lib/server/price-alert-worker.mjs";
import { productSchema, productUpdateSchema } from "../lib/server/schemas.ts";

const product = { title: "Headphones", slug: "headphones", status: "published", price: 100, discount: 20, stock: 5 };
const watch = { active: true, productId: "p1", currency: "USD", priceAtSubscription: 100, targetPrice: null, watchVersion: "v1", emailEnabled: false, createdAt: "2026-10-25" };

class MemoryDb {
  constructor(entries = []) { this.data = new Map(entries.map(([path, value]) => [path, structuredClone(value)])); this.failPath = null; }
  doc(path) { return new Ref(this, path); }
  collection(path) { return new Query(this, path); }
  collectionGroup(name) { return new Query(this, name, true); }
  async runTransaction(callback) {
    const writes = [];
    const tx = {
      get: async (ref) => new Snapshot(ref), getAll: async (...refs) => refs.map((ref) => new Snapshot(ref)),
      create: (ref, value) => { if (this.data.has(ref.path)) throw new Error("Duplicate create"); writes.push(["create", ref, value]); },
      update: (ref, value) => writes.push(["update", ref, value]),
    };
    const result = await callback(tx);
    if (this.failPath && writes.some(([, ref]) => ref.path.includes(this.failPath))) { this.failPath = null; throw new Error("Injected transaction failure"); }
    for (const [kind, ref, value] of writes) this.data.set(ref.path, structuredClone(kind === "create" ? value : { ...this.data.get(ref.path), ...value }));
    return result;
  }
}
class Ref {
  constructor(db, path) { this.db = db; this.path = path; this.id = path.split("/").at(-1); }
  get parent() { return new Query(this.db, this.path.split("/").slice(0, -1).join("/")); }
  collection(name) { return new Query(this.db, `${this.path}/${name}`); }
}
class Snapshot {
  constructor(ref) { this.ref = ref; this.id = ref.id; this.exists = ref.db.data.has(ref.path); this.value = structuredClone(ref.db.data.get(ref.path)); }
  data() { return this.value; }
}
class Query {
  constructor(db, path, group = false, filters = [], cursor = null, size = Infinity) { Object.assign(this, { db, path, group, filters, cursor, size }); }
  get parent() { const path = this.path.split("/").slice(0, -1).join("/"); return path ? new Ref(this.db, path) : null; }
  doc(id) { return new Ref(this.db, `${this.path}/${id}`); }
  where(field, operator, value) { assert.equal(operator, "=="); return new Query(this.db, this.path, this.group, [...this.filters, [field, value]], this.cursor, this.size); }
  orderBy() { return this; }
  limit(size) { return new Query(this.db, this.path, this.group, this.filters, this.cursor, size); }
  startAfter(ref) { return new Query(this.db, this.path, this.group, this.filters, ref.path, this.size); }
  async get() {
    const docs = [...this.db.data].filter(([path, value]) => (this.group ? path.split("/").at(-2) === this.path : path.split("/").slice(0, -1).join("/") === this.path) && this.filters.every(([field, wanted]) => value[field] === wanted) && (!this.cursor || path > this.cursor)).sort(([a], [b]) => a.localeCompare(b)).slice(0, this.size).map(([path]) => new Snapshot(new Ref(this.db, path)));
    return { docs, size: docs.length, empty: !docs.length };
  }
}
const event = { productId: "p1", currency: "USD", status: "pending", cursor: null, createdAt: "2026-10-25" };
const fixture = (watches = [["users/u1/priceAlerts/p1", watch]]) => new MemoryDb([["products/p1", product], ["priceAlertEvents/e1", event], ...watches]);
const notifications = (db) => [...db.data].filter(([path]) => path.includes("/notifications/"));
const emails = (db) => [...db.data].filter(([path]) => path.startsWith("notificationQueue/"));

test("alerts use effective prices, inclusive targets, and strictly lower cent amounts", () => {
  assert.deepEqual(eligiblePriceDrop(watch, product, "USD"), { oldPrice: 100, newPrice: 80 });
  assert.ok(eligiblePriceDrop({ ...watch, targetPrice: 80 }, product, "USD"));
  assert.equal(eligiblePriceDrop({ ...watch, targetPrice: 79 }, product, "USD"), null);
  assert.equal(eligiblePriceDrop({ ...watch, lastNotifiedPrice: 80 }, product, "USD"), null);
  assert.equal(eligiblePriceDrop({ ...watch, lastNotifiedPrice: 70 }, product, "USD"), null);
});

test("paused, unpublished, out-of-stock, invalid and different-currency records do not notify", () => {
  assert.equal(eligiblePriceDrop({ ...watch, active: false }, product, "USD"), null);
  for (const changes of [{ status: "draft" }, { stock: 0 }, { stock: Number.NaN }, { price: Number.NaN }, { discount: 101 }]) assert.equal(eligiblePriceDrop(watch, { ...product, ...changes }, "USD"), null);
  assert.equal(eligiblePriceDrop(watch, product, "RWF"), null);
});

test("price events include discount changes, republishing and returning stock, but not price increases", () => {
  const previous = { ...product, discount: 0 };
  assert.equal(needsPriceAlertEvent(previous, product), true);
  assert.equal(needsPriceAlertEvent(product, { ...product, price: 110 }), false);
  assert.equal(needsPriceAlertEvent({ ...product, stock: 0 }, product), true);
  assert.equal(needsPriceAlertEvent({ ...product, status: "draft" }, product), true);
  assert.equal(needsPriceAlertEvent(product, { ...product, status: "archived" }), false);
});

test("subscription schemas reject forged owners, invalid IDs and invalid thresholds", () => {
  assert.deepEqual(priceAlertInput.parse({ productId: "p1" }), { productId: "p1", targetPrice: null, emailEnabled: false });
  assert.equal(priceAlertInput.safeParse({ productId: "p1", userId: "someone-else" }).success, false);
  assert.equal(priceAlertInput.safeParse({ productId: "../private" }).success, false);
  assert.equal(priceAlertInput.safeParse({ productId: "p1", targetPrice: -1 }).success, false);
  assert.equal(cancelPriceAlertInput.safeParse({ productId: "p1", email: "other@example.test" }).success, false);
});

test("in-app drops persist once and remain active for successive new lows", async () => {
  const db = fixture();
  assert.equal((await processPriceAlertEvent(db, "e1")).notified, 1);
  assert.equal(notifications(db).length, 1);
  assert.equal(emails(db).length, 0);
  assert.equal(db.data.get("users/u1/priceAlerts/p1").active, true);
  assert.equal(db.data.get("users/u1/priceAlerts/p1").lastNotifiedPrice, 80);
  await processPriceAlertEvent(db, "e1");
  assert.equal(notifications(db).length, 1);
  db.data.set("priceAlertEvents/e2", event);
  await processPriceAlertEvent(db, "e2");
  assert.equal(notifications(db).length, 1);
  db.data.set("products/p1", { ...product, price: 90 });
  db.data.set("priceAlertEvents/e3", event);
  assert.equal((await processPriceAlertEvent(db, "e3")).notified, 1);
  assert.equal(notifications(db).length, 2);
});

test("email is optional and queued only for explicitly opted-in verified email", async () => {
  for (const config of [{ emailEnabled: true, emailVerified: false }, { emailEnabled: false, emailVerified: true }, { emailEnabled: true, emailVerified: true }]) {
    const db = fixture([["users/u1/priceAlerts/p1", { ...watch, ...config, email: "shopper@example.test" }]]);
    await processPriceAlertEvent(db, "e1");
    assert.equal(notifications(db).length, 1);
    assert.equal(emails(db).length, config.emailEnabled && config.emailVerified ? 1 : 0);
    if (emails(db).length) assert.equal(emails(db)[0][1].watchVersion, "v1");
  }
});

test("pagination reaches subscribers beyond the original 400 limit", async () => {
  const subscribers = Array.from({ length: 450 }, (_, index) => [`users/u${String(index).padStart(3, "0")}/priceAlerts/p1`, watch]);
  const db = fixture(subscribers);
  let complete = false, pages = 0;
  while (!complete && pages < 8) { complete = (await processPriceAlertEvent(db, "e1", 100)).complete; pages++; }
  assert.equal(pages, 5);
  assert.equal(notifications(db).length, 450);
  assert.equal(db.data.get("priceAlertEvents/e1").status, "done");
});

test("a failed transaction and replay do not duplicate an earlier subscriber's notification", async () => {
  const db = fixture([["users/a/priceAlerts/p1", watch], ["users/b/priceAlerts/p1", watch]]);
  db.failPath = "users/b/notifications/";
  await assert.rejects(processPriceAlertEvent(db, "e1"));
  assert.equal(notifications(db).length, 1);
  assert.equal(db.data.get("priceAlertEvents/e1").status, "pending");
  await processPriceAlertEvent(db, "e1");
  assert.equal(notifications(db).length, 2);
  assert.equal(new Set(notifications(db).map(([path]) => path)).size, 2);
});

test("live leases, cancellation and wrong collection paths do not create notifications", async () => {
  const db = fixture();
  db.data.set("priceAlertEvents/e1", { ...event, status: "processing", leaseUntil: Date.now() + 90_000 });
  await processPriceAlertEvent(db, "e1");
  assert.equal(notifications(db).length, 0);
  db.data.set("priceAlertEvents/e1", event);
  db.data.set("users/u1/priceAlerts/p1", { ...watch, active: false });
  db.data.set("companies/other/priceAlerts/p1", watch);
  await processPriceAlertEvent(db, "e1");
  assert.equal(notifications(db).length, 0);
});

test("event processing reads the current product instead of delivering stale prices", async () => {
  const db = fixture();
  db.data.set("products/p1", { ...product, price: 150 });
  await processPriceAlertEvent(db, "e1");
  assert.equal(notifications(db).length, 0);
});

test("published product schemas support bundled images and reject unsafe paths", () => {
  const base = { title: "Lamp", slug: "lamp", description: "A light", category: "Home", brand: "Urugo", price: 20, discount: 0, stock: 3, images: ["/images/products/lamp.jpg"], colors: [], sizes: [] };
  assert.equal(productSchema.safeParse(base).success, true);
  assert.equal(productSchema.safeParse({ ...base, images: ["/images/../../secret"] }).success, false);
  assert.equal(productSchema.safeParse({ ...base, images: ["javascript:alert(1)"] }).success, false);
});

test("price-only updates preserve published status and ratings instead of applying create defaults", () => {
  const update = productUpdateSchema.parse({ price: 70 });
  assert.deepEqual(update, { price: 70 });
  const updated = { ...product, rating: 4.7, ...update };
  assert.equal(updated.status, "published");
  assert.equal(updated.rating, 4.7);
  assert.equal(needsPriceAlertEvent(product, updated), true);
});
