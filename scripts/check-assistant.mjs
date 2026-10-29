// Optional live evaluation. Start the configured app first. No secrets are printed.
const base = process.env.ASSISTANT_TEST_URL || "http://localhost:3000";
const status = await fetch(new URL("/api/assistant", base)).then((response) => response.json());
if (!status.available) throw new Error("Configure GEMINI_API_KEY on the server and restart it before running live checks.");
const cases = [
  { message: "Find in-stock headphones under 80 USD. Stay within that budget.", validate: (reply) => reply.products.every((product) => product.price <= 80 && product.stock > 0) },
  { message: "What is your return policy? Please show the source.", validate: (reply) => reply.sources.some((source) => source.path === "/returns") },
  { message: "Check my order UR-NOT-A-REAL-ORDER. I am not signed in.", validate: (reply) => reply.sources.some((source) => source.path === "/login") },
];
for (const item of cases) {
  const response = await fetch(new URL("/api/assistant", base), {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: item.message }], locale: "en_RW" }),
    signal: AbortSignal.timeout(80_000),
  });
  const reply = await response.json();
  if (!response.ok) throw new Error(`Live check failed: ${reply.error?.code || response.status}`);
  if (!item.validate(reply)) throw new Error("The assistant did not satisfy a live verification criterion. Review the model and tool behavior before launch.");
  console.log(`Passed: ${item.message} (${reply.products.length} verified product cards)`);
}
