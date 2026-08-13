import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function fetchRendered(pathname = "/", init = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html", ...(init.headers ?? {}) },
      ...init,
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the premium AI generation studio", async () => {
  const response = await fetchRendered();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>AI Video Generation Platform<\/title>/i);
  assert.match(html, /AOV Studio/);
  assert.match(html, /Prompt Studio/);
  assert.match(html, /Credit Packs/);
  assert.match(html, /Shopify checkout route is built/);
  assert.doesNotMatch(html, /Your site is taking shape|SkeletonPreview/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});

test("reports Shopify setup requirements until live keys are configured", async () => {
  const response = await fetchRendered("/api/shopify/cart", {
    headers: { accept: "application/json" },
  });
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.connected, false);
  assert.ok(json.missing.includes("SHOPIFY_STORE_DOMAIN"));
  assert.ok(
    json.missing.includes(
      "SHOPIFY_STOREFRONT_ACCESS_TOKEN or SHOPIFY_STOREFRONT_PRIVATE_TOKEN",
    ),
  );
});

test("keeps starter preview files removed from the product build", async () => {
  const [page, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<StudioShell \/>/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(
    access(new URL("app/_sites-preview/SkeletonPreview.tsx", templateRoot)),
  );
  await assert.rejects(
    access(new URL("app/_sites-preview/preview.css", templateRoot)),
  );
});
