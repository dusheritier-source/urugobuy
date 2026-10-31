import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("Firebase Admin loads when the runtime disables require(ESM)", () => {
  // Vercel fails during module loading, before any credentials or requests.
  const result = spawnSync(process.execPath, [
    "--no-experimental-require-module",
    "-e",
    "require('firebase-admin/auth'); require('firebase-admin/firestore');",
  ], { encoding: "utf8", timeout: 30_000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr || result.stdout);
});
