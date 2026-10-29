import { test, expect, type Page } from "@playwright/test";
import { products } from "../../lib/data";
import { sellingPrice } from "../../lib/product-pricing";

const product = products.find((product) => product.slug === "arisha-3-ring-pendant-light")!;
const id = "price-alert-test-user";
const email = "shopper@example.test";
function token() {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ sub: id, user_id: id, aud: "demo-project", iss: "https://securetoken.google.com/demo-project", email, email_verified: true, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600, auth_time: Math.floor(Date.now() / 1000), firebase: { sign_in_provider: "password" } })}.test-signature`;
}
const watch = (item = product) => ({ productId: item.id, productTitle: item.title, productSlug: item.slug, priceAtSubscription: item.price, targetPrice: null as number | null, currency: "USD", active: true, emailEnabled: false, createdAt: new Date().toISOString(), currentPrice: sellingPrice(item), stock: item.stock, available: true });
const notification = () => ({ id: "notification-1", productId: product.id, productTitle: product.title, productSlug: product.slug, oldPrice: product.price, newPrice: sellingPrice(product), currency: "USD", createdAt: new Date().toISOString(), read: false });

async function signIn(page: Page, options = { active: false, emailAvailable: false, error: false, paginated: false }) {
  const state = { alert: { ...watch(), active: options.active }, notifications: [notification()], requests: [] as Array<{ method: string; body: Record<string, unknown> }> };
  const jwt = token();
  await page.route("https://identitytoolkit.googleapis.com/**", async (route) => {
    const url = route.request().url();
    if (url.includes("accounts:signInWithPassword")) return route.fulfill({ json: { kind: "identitytoolkit#VerifyPasswordResponse", localId: id, email, displayName: "Price shopper", idToken: jwt, refreshToken: "test-refresh", expiresIn: "3600", registered: true } });
    if (url.includes("accounts:lookup")) return route.fulfill({ json: { users: [{ localId: id, email, displayName: "Price shopper", emailVerified: true, providerUserInfo: [{ providerId: "password", email, rawId: email }], createdAt: "1700000000000", lastLoginAt: String(Date.now()) }] } });
    await route.fulfill({ json: {} });
  });
  await page.route("https://securetoken.googleapis.com/**", (route) => route.fulfill({ json: { access_token: jwt, id_token: jwt, refresh_token: "test-refresh", expires_in: "3600", token_type: "Bearer", user_id: id, project_id: "demo-project" } }));
  await page.route("**/api/auth/**", (route) => route.fulfill({ status: 204 }));
  await page.route("**/api/price-alerts**", async (route) => {
    const method = route.request().method();
    const params = new URL(route.request().url()).searchParams;
    if (method === "GET") {
      if (options.error) return route.fulfill({ status: 503, json: { error: { message: "Price alerts temporarily unavailable" } } });
      if (params.has("productId")) return route.fulfill({ json: { active: state.alert.active, alert: state.alert.active ? state.alert : null, currency: "USD", emailAvailable: options.emailAvailable, emailVerified: true } });
      const alerts = params.has("cursor") ? [watch(products.find((candidate) => candidate.id !== product.id)!)] : [state.alert];
      const visible = params.has("notificationCursor") ? [{ ...notification(), id: "older-notification", productTitle: "Older price drop", read: true }] : state.notifications;
      return route.fulfill({ json: { alerts, notifications: visible, nextNotificationCursor: options.paginated && !params.has("notificationCursor") ? "older-page" : null, unreadCount: state.notifications.filter((item) => !item.read).length, nextCursor: options.paginated && !params.has("cursor") ? "page-2" : null } });
    }
    const body = route.request().postDataJSON();
    state.requests.push({ method, body });
    if (method === "POST") {
      if (body.targetPrice != null && body.targetPrice >= sellingPrice(product)) return route.fulfill({ status: 400, json: { error: { message: "Choose a target below the current price." } } });
      state.alert = { ...state.alert, active: true, targetPrice: body.targetPrice, emailEnabled: body.emailEnabled };
      return route.fulfill({ status: 201, json: { active: true, alert: state.alert } });
    }
    if (method === "DELETE") { state.alert.active = false; return route.fulfill({ status: 204 }); }
    if (method === "PATCH") { state.notifications.forEach((item) => { if (body.notificationIds.includes(item.id)) item.read = true; }); return route.fulfill({ json: { updated: state.notifications.length } }); }
    await route.fulfill({ status: 405 });
  });
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Necessary only", exact: true }).click();
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill("test-only-password");
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await expect(page).toHaveURL(/\/profile$/);
  return state;
}

test("guest price alerts link to sign in and the account alerts page stays protected", async ({ page }) => {
  await page.goto(`/en_RW/products/${product.slug}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Necessary only", exact: true }).click();
  await expect(page.getByRole("link", { name: "Sign in for price alerts" })).toHaveAttribute("href", "/login");
  await page.goto("/profile/price-alerts", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Sign in to save products and receive price-drop alerts.")).toBeVisible();
});

test("signed-in shoppers save a target without email and can pause their alert", async ({ page }) => {
  const state = await signIn(page);
  await page.goto(`/en_RW/products/${product.slug}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Alert me when the price drops", exact: true }).click();
  await page.getByRole("spinbutton", { name: "Target price", exact: true }).fill("150");
  await expect(page.getByRole("checkbox", { name: "Also email me" })).toBeDisabled();
  await page.getByRole("button", { name: "Save price alert", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Price alert saved" })).toBeVisible();
  expect(state.requests.find((item) => item.method === "POST")?.body).toEqual({ productId: product.id, targetPrice: 150, emailEnabled: false });
  await page.getByRole("button", { name: "Pause alert", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Price alert paused" })).toBeVisible();
  expect(state.alert.active).toBe(false);
});

test("email is an explicit option and invalid target errors are recoverable", async ({ page }) => {
  const state = await signIn(page, { active: false, emailAvailable: true, error: false, paginated: false });
  await page.goto(`/en_RW/products/${product.slug}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Alert me when the price drops", exact: true }).click();
  const input = page.getByRole("spinbutton", { name: "Target price", exact: true });
  await input.fill("99999");
  await page.getByRole("button", { name: "Save price alert", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Choose a target below" })).toBeVisible();
  await input.fill("100");
  await page.getByRole("checkbox", { name: "Also email me" }).check();
  await page.getByRole("button", { name: "Save price alert", exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: "Price alert saved" })).toBeVisible();
  expect(state.alert.emailEnabled).toBe(true);
});

test("notification inbox, unread badge, pagination and pausing work in the account page", async ({ page }) => {
  const state = await signIn(page, { active: true, emailAvailable: false, error: false, paginated: true });
  await page.goto("/profile/price-alerts", { waitUntil: "domcontentloaded" });
  const inbox = page.getByRole("region", { name: "Price drop notifications", exact: true });
  await expect(inbox.getByText(product.title, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Mark shown alerts as read" }).click();
  await expect(inbox.getByText("New price drop", { exact: true })).toHaveCount(0);
  expect(state.notifications[0].read).toBe(true);
  await page.getByRole("button", { name: "Older notifications", exact: true }).click();
  await expect(inbox.getByText("Older price drop", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Newer notifications", exact: true }).click();
  await expect(inbox.getByText(product.title, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Load more watches", exact: true }).click();
  await expect(page.getByRole("region", { name: "Watched products", exact: true }).getByRole("article")).toHaveCount(2);
  await page.getByRole("button", { name: `Pause ${product.title}`, exact: true }).click();
  await expect(page.getByText(/Paused ·/).first()).toBeVisible();
  expect(state.alert.active).toBe(false);
});

test("load failures show retry controls and the mobile inbox fits the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, { active: false, emailAvailable: false, error: true, paginated: false });
  await page.goto("/profile/price-alerts", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Could not load watches.", { exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: "Retry", exact: true }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: "test-results/price-alerts-mobile.png" });
});

test("real price-alert APIs reject unauthenticated reads, writes and job runs", async ({ request }) => {
  expect((await request.get("/api/price-alerts")).status()).toBe(401);
  for (const method of ["POST", "DELETE", "PATCH"]) {
    const response = await request.fetch("/api/price-alerts", { method, data: { productId: product.id } });
    expect(response.status()).toBe(401);
  }
  expect((await request.post("/api/internal/price-alerts")).status()).toBe(401);
});
