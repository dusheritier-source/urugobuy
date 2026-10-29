import { test, expect } from "@playwright/test";
import { products } from "../../lib/data";
import path from "node:path";

const product = products.find((product) => product.slug === "arisha-3-ring-pendant-light")!;
const photo = path.join(process.cwd(), "public", product.images[0]);
async function openSearch(page: import("@playwright/test").Page) {
  await page.goto("/en_RW/products", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Necessary only", exact: true }).click();
  await page.getByRole("button", { name: "Search by photo", exact: true }).filter({ visible: true }).last().click();
  return page.getByRole("dialog", { name: "See it. Find it on Urugo." });
}

test("real upload finds the correct product and opens its localized detail page", async ({ page }) => {
  const dialog = await openSearch(page);
  await dialog.getByLabel("Upload product photo").setInputFiles(photo);
  await expect(dialog.getByAltText("Your photo for product matching")).toBeVisible();
  await dialog.getByRole("button", { name: "Find similar products", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Visually similar products" })).toBeVisible({ timeout: 90_000 });
  const first = dialog.locator('section a').first();
  await expect(first).toHaveAttribute("href", `/en_RW/products/${product.slug}`);
  await dialog.getByLabel("Filter photo matches by category").selectOption("Home");
  await dialog.getByLabel("In stock only").check();
  await first.scrollIntoViewIfNeeded();
  await page.screenshot({ path: "test-results/visual-search-desktop.png", fullPage: false });
  await first.click();
  await expect(page).toHaveURL(new RegExp(`/en_RW/products/${product.slug}$`));
  await expect(page.getByRole("heading", { name: product.title, exact: true })).toBeVisible();
});

test("validation, change photo, Escape, focus restoration and reopening", async ({ page }) => {
  const dialog = await openSearch(page);
  await dialog.getByLabel("Upload product photo").setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("bad") });
  await expect(dialog.getByRole("alert")).toContainText("JPG, PNG, or WebP");
  await dialog.getByLabel("Upload product photo").setInputFiles(photo);
  await dialog.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(dialog.getByText("Drop your product photo here")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close photo search" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Search by photo", exact: true }).last()).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: "See it. Find it on Urugo." })).toBeVisible();
  await expect(page.getByAltText("Your photo for product matching")).toHaveCount(0);
});

test("empty results, retry after server error, and cancelled searches", async ({ page }) => {
  let mode = "error";
  await page.route("**/api/search/visual", async (route) => {
    if (mode === "error") return route.fulfill({ status: 503, json: { error: { message: "Please try again shortly." } } });
    if (mode === "delay") await new Promise((resolve) => setTimeout(resolve, 500));
    await route.fulfill({ json: { results: [], indexedProducts: 174, unavailableProducts: 0 } }).catch(() => {});
  });
  const dialog = await openSearch(page);
  await dialog.getByLabel("Upload product photo").setInputFiles(photo);
  await dialog.getByRole("button", { name: "Find similar products", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("try again");
  mode = "empty";
  await dialog.getByRole("button", { name: "Find similar products", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "No close matches found" })).toBeVisible();
  mode = "delay";
  await dialog.getByRole("button", { name: "Find similar products", exact: true }).click();
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog.getByRole("status")).toHaveCount(0);
  await expect(dialog.getByRole("heading", { name: "No close matches found" })).toHaveCount(0);
});

test("mobile navigation exposes photo search and camera capture", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en_RW/products", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Necessary only", exact: true }).click();
  await page.getByRole("button", { name: "Search by photo", exact: true }).filter({ visible: true }).first().click();
  const dialog = page.getByRole("dialog", { name: "See it. Find it on Urugo." });
  await expect(dialog.getByRole("button", { name: "Take photo", exact: true })).toBeVisible();
  await expect(dialog.getByLabel("Take product photo")).toHaveAttribute("capture", "environment");
  await dialog.getByLabel("Take product photo").setInputFiles(photo);
  await expect(dialog.getByAltText("Your photo for product matching")).toBeVisible();
  await expect(dialog).toBeInViewport();
  await page.screenshot({ path: "test-results/visual-search-mobile.png", fullPage: false });
});

test("API rejects malformed uploads before running image inference", async ({ request }) => {
  expect((await request.post("/api/search/visual", { data: {} })).status()).toBe(415);
  expect((await request.post("/api/search/visual", { multipart: { note: "no photo" } })).status()).toBe(400);
  const corrupt = await request.post("/api/search/visual", { multipart: { image: { name: "fake.jpg", mimeType: "image/jpeg", buffer: Buffer.from("not an image") } } });
  expect(corrupt.status()).toBe(422);
  expect(corrupt.headers()["cache-control"]).toContain("no-store");
});
