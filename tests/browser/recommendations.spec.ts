import { test, expect } from "@playwright/test";
import { products } from "../../lib/data";
import { complementaryProducts } from "../../lib/recommendations";
import { sellingPrice } from "../../lib/product-pricing";

const current = products.find((product) => product.slug === "arisha-3-ring-pendant-light")!;
const other = products.find((product) => product.slug === "alice-5-tier-corner-shelf")!;
const companions = complementaryProducts(products, current.id).map(({ product }) => product);
const selected = [current, ...companions];
const money = (amount: number) => new Intl.NumberFormat("en", { style: "currency", currency: "USD" }).format(amount);
async function firstPage(page: import("@playwright/test").Page, slug = current.slug) {
  await page.goto(`/en_RW/products/${slug}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Necessary only", exact: true }).click();
}
async function cart(page: import("@playwright/test").Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("urugo-cart") ?? "null")?.state?.items ?? []);
}

test("product views appear newest first, personalize home and can be cleared", async ({ page }) => {
  await firstPage(page);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ui-storage") ?? "null")?.state?.recentlyViewed ?? [])).toContain(current.id);
  await page.goto(`/en_RW/products/${other.slug}`, { waitUntil: "domcontentloaded" });
  const recent = page.getByRole("region", { name: "Recently viewed", exact: true });
  await expect(recent.getByRole("link", { name: new RegExp(current.title) })).toBeVisible();
  await expect(recent.getByRole("link", { name: new RegExp(other.title) })).toHaveCount(0);
  await page.goto("/en_RW", { waitUntil: "domcontentloaded" });
  const history = page.getByRole("region", { name: "Recently viewed", exact: true });
  await expect(history.getByRole("link").first()).toHaveAttribute("href", `/en_RW/products/${other.slug}`);
  const personal = page.getByRole("region", { name: "Picked for your browsing", exact: true });
  await expect(personal).toBeVisible();
  await expect(personal.locator(`a[href="/en_RW/products/${current.slug}"]`)).toHaveCount(0);
  await history.getByRole("button", { name: "Clear browsing history" }).click();
  await expect(history).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Discover our top-rated picks" })).toBeVisible();
});

test("related products exclude the current item and navigate to localized details", async ({ page }) => {
  await firstPage(page);
  const related = page.getByRole("region", { name: "More to explore", exact: true });
  await expect(related).toBeVisible();
  await expect(related.locator(`a[href="/en_RW/products/${current.slug}"]`)).toHaveCount(0);
  expect(await related.getByRole("link").count()).toBeLessThanOrEqual(4);
  const target = await related.getByRole("link").first().getAttribute("href");
  await related.getByRole("link").first().click();
  await expect(page).toHaveURL(new RegExp(`${target}$`));
  await expect(page.getByRole("heading", { name: "Something went wrong" })).toHaveCount(0);
});

test("bundle selections update the total and validated items are added atomically", async ({ page }) => {
  await firstPage(page);
  const bundle = page.getByRole("region", { name: "Complete your setup", exact: true });
  await expect(bundle).toBeVisible();
  await bundle.scrollIntoViewIfNeeded();
  await expect.poll(() => bundle.locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const checkboxes = bundle.getByRole("checkbox");
  await expect(checkboxes.first()).toBeDisabled();
  const total = selected.reduce((sum, product) => sum + sellingPrice(product), 0);
  await expect(bundle.getByLabel("Selected bundle total")).toHaveText(money(total));
  await checkboxes.nth(1).uncheck();
  await expect(bundle.getByLabel("Selected bundle total")).toHaveText(money(total - sellingPrice(companions[0])));
  await checkboxes.nth(1).check();
  const response = page.waitForResponse((response) => response.url().endsWith("/api/recommendations/bundle") && response.status() === 200);
  await bundle.getByRole("button", { name: /Add \d+ selected items/ }).click();
  await response;
  await expect(bundle.getByRole("button", { name: "Added to cart", exact: true })).toBeDisabled();
  const actual = await cart(page);
  expect(actual.map((item: { id: string }) => item.id).sort()).toEqual(selected.map((product) => product.id).sort());
  expect(actual.every((item: { quantity: number }) => item.quantity === 1)).toBe(true);
});

test("price changes require a second click and a full cart cannot receive a partial bundle", async ({ page }) => {
  await page.addInitScript((product) => { localStorage.setItem("urugo-cart", JSON.stringify({ state: { items: [{ ...product, quantity: product.stock }] }, version: 0 })); }, current);
  await firstPage(page);
  const bundle = page.getByRole("region", { name: "Complete your setup", exact: true });
  let count = 0;
  const changed = selected.map((product, index) => index ? product : { ...product, price: product.price + 10 });
  await page.route("**/api/recommendations/bundle", async (route) => {
    count++;
    if (count === 1) return route.fulfill({ status: 409, json: { error: { code: "bundle_changed", message: "Prices changed. Review the updated total and click again to confirm." }, products: changed } });
    expect(route.request().postDataJSON().lines[0].expectedPrice).toBe(sellingPrice(changed[0]));
    await route.fulfill({ json: { products: changed } });
  });
  await bundle.getByRole("button", { name: /Add \d+ selected items/ }).click();
  await expect(bundle.getByRole("status")).toContainText("Prices changed");
  expect((await cart(page)).length).toBe(1);
  await expect(bundle.getByLabel("Selected bundle total")).toHaveText(money(changed.reduce((sum, product) => sum + sellingPrice(product), 0)));
  await bundle.getByRole("button", { name: /Add \d+ selected items/ }).click();
  await expect(bundle.getByRole("status")).toContainText("does not have enough stock");
  const actual = await cart(page);
  expect(actual.length).toBe(1);
  expect(actual[0].quantity).toBe(current.stock);
});

test("mobile recommendations and bundles fit the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await firstPage(page);
  const bundle = page.getByRole("region", { name: "Complete your setup", exact: true });
  await bundle.scrollIntoViewIfNeeded();
  await expect(bundle).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect.poll(() => bundle.locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: "test-results/recommendations-mobile.png" });
});

test("bundle API rejects unknown products, duplicate lines and stale prices", async ({ request }) => {
  const stale = await request.post("/api/recommendations/bundle", { data: { lines: [{ productId: current.id, expectedPrice: 0 }] } });
  expect(stale.status()).toBe(409);
  expect(stale.headers()["cache-control"]).toContain("no-store");
  expect((await stale.json()).error.code).toBe("bundle_changed");
  const unknown = await request.post("/api/recommendations/bundle", { data: { lines: [{ productId: "not-published", expectedPrice: 1 }] } });
  expect(unknown.status()).toBe(409);
  const duplicate = await request.post("/api/recommendations/bundle", { data: { lines: [{ productId: current.id, expectedPrice: sellingPrice(current) }, { productId: current.id, expectedPrice: sellingPrice(current) }] } });
  expect(duplicate.status()).toBe(400);
});

test("quick views also update browsing recommendations", async ({ page }) => {
  const first = [...products].sort((a, b) => b.discount - a.discount)[0];
  await page.goto("/en_RW/products", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Necessary only", exact: true }).click();
  await page.getByRole("button", { name: `Quick view: ${first.title}`, exact: true }).click();
  await expect(page.getByRole("button", { name: "Close modal", exact: true })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("ui-storage") ?? "null")?.state?.recentlyViewed ?? [])).toContain(first.id);
  await page.getByRole("button", { name: "Close modal", exact: true }).click();
  await page.goto("/en_RW", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("region", { name: "Recently viewed", exact: true }).getByRole("link").first()).toHaveAttribute("href", `/en_RW/products/${first.slug}`);
});
