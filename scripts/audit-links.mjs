import { chromium } from '@playwright/test';

const base = process.argv[2] || 'http://127.0.0.1:3100';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.goto(base, { waitUntil: 'networkidle' });
const links = await page.locator('a[href]').evaluateAll(nodes => [...new Set(nodes.map(n => n.getAttribute('href')).filter(h => h.startsWith('/') && !h.startsWith('/_next')))]);
for (const path of links) {
  try {
    const response = await page.request.get(base + path);
    const body = await response.text();
    console.log(JSON.stringify({path, status: response.status(), vercelError: response.headers()['x-vercel-error'], appError: body.includes('Something went wrong'), detail: response.status() >= 400 ? body.replace(/<[^>]*>/g, ' ').slice(0, 200) : undefined}));
  } catch (error) { console.log(JSON.stringify({path, error: error.message})); }
}
for (const path of ['/en_RW/products', '/en_RW/categories', '/en_RW/about', '/en_RW/contact', '/cart']) {
  try {
    await page.goto(base, {waitUntil: 'domcontentloaded'});
    const link = page.locator(`a[href="${path}"]`).filter({visible: true}).first();
    if (!await link.count()) continue;
    await link.click();
    await page.waitForTimeout(1500);
    console.log(JSON.stringify({click: path, url: page.url(), text: (await page.locator('body').innerText()).slice(0, 220)}));
  } catch(error) { console.log(JSON.stringify({click: path, error: error.message})); }
}
console.log(JSON.stringify({browserErrors: errors}));
await browser.close();
