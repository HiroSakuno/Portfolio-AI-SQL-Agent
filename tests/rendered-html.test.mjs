import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
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

test("server-renders the SQL Agent workspace", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>SQL Agent — Ask your data\. Get the signal\.<\/title>/i);
  assert.match(html, /Ask the schema/);
  assert.match(html, /Power BI report/);
  assert.match(html, /Supabase database/);
  assert.match(html, /title="Power BI embedded report"/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site|codex-preview/i);
});

test("the page keeps its integration configuration client-side", async () => {
  const [page, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /NEXT_PUBLIC_CHAT_WEBHOOK_URL/);
  assert.match(page, /NEXT_PUBLIC_POWER_BI_EMBED_URL/);
  assert.match(page, /method: "POST"/);
  assert.match(page, /<iframe/);
  assert.match(page, /explanation/);
  assert.match(layout, /lang="en"/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
});
