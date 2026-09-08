import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parsePostMeta, parseCatalogPost, renderMarkdown, jsonLd, sha256, BLOG_PREFIX } from "../lib/blog-model.ts";
import { blogPostUrl, renderSitemapXml, sitemapBlogLocs, sitemapEntries } from "../lib/sitemap-entries.ts";
import { prepareArticle } from "../scripts/migrate-blog-to-storage.mjs";

const meta = { slug: "test-article", title: "Test", description: "Useful answer", date: "2026-09-07", status: "published" };
const version = "a".repeat(64);
const record = { ...meta, schemaVersion: 1, version, s3Key: `${BLOG_PREFIX}${meta.slug}/${version}/article.md`, sha256: sha256("Hello"), assets: [] };
test("validates catalog and excludes unknown metadata", () => {
  assert.deepEqual(parseCatalogPost({ ...record, secret: "not rendered" }), record);
});
test("requires explicit publication status and safe slug/date/URLs", () => {
  for (const patch of [{ status: undefined }, { slug: "../profiles" }, { date: "2026-02-30" }, { heroImage: "javascript:alert(1)" }, { heroImage: "//evil.test/a" }, { heroImage: "https://user:secret@a.test/a" }]) assert.throws(() => parsePostMeta({ ...meta, ...patch }));
});
test("article keys cannot escape the allowed version prefix", () => {
  assert.throws(() => parseCatalogPost({ ...record, s3Key: "observations/private.md" }));
  assert.throws(() => parseCatalogPost({ ...record, s3Key: `${BLOG_PREFIX}${meta.slug}/${version}/../article.md` }));
});
test("rejects active or arbitrary assets", () => {
  assert.throws(() => parseCatalogPost({ ...record, assets: [{ name: "x.svg", key: "x.svg", sha256: version, contentType: "image/svg+xml" }] }));
});
test("sanitizes bot HTML while preserving product figures", () => {
  const html = renderMarkdown('<script>alert(1)</script><iframe src="https://evil.test"></iframe><img src="/safe.png" onerror="alert(1)"><a href="javascript:alert(1)">bad</a><figure class="post-shot"><figcaption>Caption</figcaption></figure>');
  assert.doesNotMatch(html, /script|iframe|onerror|javascript:/);
  assert.match(html, /class="post-shot"/);
  assert.match(html, /src="\/safe.png"/);
});
test("JSON-LD cannot close its script element", () => {
  const result = jsonLd({ title: '</script><script>alert(1)</script>' });
  assert.ok(!result.includes("<"));
  assert.equal(JSON.parse(result).title, '</script><script>alert(1)</script>');
});
test("sitemap blog locs follow the published catalog, including new slugs", () => {
  const posts = [
    { slug: "freight-sales-call-block-readiness", date: "2026-09-08" },
    { slug: "nervous-system-coaching-risks", date: "2026-07-29" },
  ];
  const locs = sitemapBlogLocs(posts);
  assert.deepEqual(locs, [
    "https://ontor.ai/blog/freight-sales-call-block-readiness/",
    "https://ontor.ai/blog/nervous-system-coaching-risks/",
  ]);
  const xml = renderSitemapXml(sitemapEntries(posts, new Date("2026-09-08T00:00:00.000Z")));
  for (const loc of locs) assert.match(xml, new RegExp(`<loc>${loc}</loc>`));
  assert.match(xml, /<loc>https:\/\/ontor.ai\/blog\/<\/loc>/);
  assert.equal(blogPostUrl("freight-sales-call-block-readiness"), locs[0]);
});
test("migration is deterministic, rewrites media, and rejects escaping assets", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ontor-blog-test-"));
  try {
    const pub = path.join(dir, "public"); await fs.mkdir(pub);
    await fs.writeFile(path.join(pub, "hero.png"), Buffer.from("fixture-image"));
    const filename = path.join(dir, "index.md");
    const source = '---\ntitle: Test\nslug: test-article\ndescription: Useful answer\ndate: "2026-09-07"\nstatus: published\nheroImage: /hero.png\n---\n# Hello\n<img src="/hero.png" alt="Test">';
    await fs.writeFile(filename, source);
    const a = await prepareArticle(filename, pub), b = await prepareArticle(filename, pub);
    assert.deepEqual(a.record, b.record);
    assert.match(a.record.heroImage, /^\/blog-media\/test-article\//);
    assert.ok(a.objects.find(o => o.key === a.record.s3Key).bytes.toString().includes(a.record.heroImage));
    await fs.writeFile(path.join(pub, "hero.png"), "different-image");
    assert.notEqual((await prepareArticle(filename, pub)).record.version, a.record.version);
    await fs.writeFile(filename, source.replaceAll("/hero.png", "/../index.md"));
    await assert.rejects(prepareArticle(filename, pub));
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
