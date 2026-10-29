import { defineConfig } from "@playwright/test";
import path from "node:path";

export default defineConfig({
  testDir: "./tests/browser",
  timeout: 120_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } : {},
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next start --port 3100",
    url: "http://127.0.0.1:3100/products",
    timeout: 120_000,
    reuseExistingServer: false,
    env: { VISUAL_SEARCH_CACHE_DIR: path.resolve(".cache/visual-search") },
  },
});
