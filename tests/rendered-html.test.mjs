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
  assert.match(html, /MotionForge AI/i);
  assert.match(html, /Imagine it\./);
  assert.match(html, /Made with imagination\./);
  assert.match(html, /MotionForge keeps the beginning simple/);
  assert.match(html, /Create at your pace\./);
  assert.doesNotMatch(html, /Your site is taking shape|SkeletonPreview/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});

test("reports Stripe setup requirements until live keys are configured", async () => {
  const response = await fetchRendered("/api/stripe/checkout", {
    headers: { accept: "application/json" },
  });
  assert.equal(response.status, 200);

  const json = await response.json();
  assert.equal(json.connected, false);
  assert.ok(json.missing.includes("STRIPE_SECRET_KEY"));
  assert.ok(json.missing.includes("STRIPE_WEBHOOK_SECRET"));
  assert.equal(json.creditPackages.length, 3);
});

test("exposes model catalog and generation pricing", async () => {
  const catalogResponse = await fetchRendered("/api/models", {
    headers: { accept: "application/json" },
  });
  assert.equal(catalogResponse.status, 200);

  const catalog = await catalogResponse.json();
  assert.ok(catalog.models.some((model) => model.id === "veo-3"));
  assert.ok(catalog.models.every((model) => "providerReady" in model));

  const quoteResponse = await fetchRendered("/api/generations/quote", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      mode: "image-to-video",
      modelId: "veo-3",
      durationSeconds: 10,
      quality: "pro",
      aspectRatio: "16:9",
    }),
  });
  assert.equal(quoteResponse.status, 200);

  const quote = await quoteResponse.json();
  assert.equal(quote.quote.model.id, "veo-3");
  assert.ok(quote.quote.creditCost > 0);
  assert.ok(quote.quote.estimatedGrossMarginCents > 0);
});

test("keeps starter preview files removed from the product build", async () => {
  const [page, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<StudioShell \/>/);
  assert.doesNotMatch(page, /legacy checkout/i);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(
    access(new URL("app/_sites-preview/SkeletonPreview.tsx", templateRoot)),
  );
  await assert.rejects(
    access(new URL("app/_sites-preview/preview.css", templateRoot)),
  );
});
