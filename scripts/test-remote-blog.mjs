// Local operator smoke test. Credentials live only in this process and its child.
// Does not alter environment files, remote records, or deployment settings.
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import { MongoClient } from "mongodb";
import { sha256, renderMarkdown } from "../lib/blog-model.ts";
import { prepareArticle } from "./migrate-blog-to-storage.mjs";

const csv = (await fs.readFile("../secrects/healthos-vercel-s3_accessKeys.csv", "utf8")).trim().split(/\r?\n/).map(l => l.split(",").map(v => v.replace(/^"|"$/g, "")));
const secret = randomBytes(32).toString("hex");
const env = { ...process.env, AWS_ACCESS_KEY_ID: csv[1][0], AWS_SECRET_ACCESS_KEY: csv[1][1], AWS_REGION: "us-east-2", BLOG_REVALIDATE_SECRET: secret };
if (!env.MONGODB_URI) throw new Error("Run with --env-file=.env.local");
const build = spawn(process.execPath, ["node_modules/next/dist/bin/next", "build", "--webpack"], { env, stdio: "inherit" });
const [buildCode] = await once(build, "exit");
if (buildCode !== 0) throw new Error("Remote build failed");
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3217"], { env, stdio: "inherit" });
const mongo = new MongoClient(env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
const base = "http://127.0.0.1:3217";
const check = (ok, message) => { if (!ok) throw new Error(message); };
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(`${base}/blog/`)).ok) { ready = true; break; } } catch { /* wait for startup */ }
    await new Promise(r => setTimeout(r, 500));
  }
  check(ready, "Server not ready");
  await mongo.connect();
  const records = await mongo.db("healthos").collection("content_catalog").find({ status: "published" }).toArray();
  check(records.length === 11, "Unexpected article count");
  let assets = 0;
  for (const record of records) {
    const response = await fetch(`${base}/blog/${record.slug}/`);
    const html = await response.text();
    const prepared = await prepareArticle(`content/blog/${record.slug}/index.md`, "public");
    const body = prepared.objects.find(o => o.key === record.s3Key);
    check(response.ok && body && html.includes(renderMarkdown(body.bytes.toString("utf8"))), `Article body mismatch: ${record.slug}`);
    for (const asset of record.assets) {
      const r = await fetch(`${base}/blog-media/${record.slug}/${record.version}/${asset.name}/`);
      check(r.ok && r.headers.get("content-type") === asset.contentType && sha256(new Uint8Array(await r.arrayBuffer())) === asset.sha256, `Media failed: ${record.slug}`);
      check(r.headers.get("cache-control")?.includes("max-age=300"), "Media cache header missing");
      assets++;
    }
    console.log(`REMOTE PAGE + MEDIA VERIFIED ${record.slug}`);
  }
  for (const route of ["/blog/", "/sitemap.xml", "/llms.txt"]) {
    const r = await fetch(base + route); const body = await r.text();
    check(r.ok && records.every(p => body.includes(`/blog/${p.slug}`)), `Listing incomplete: ${route}`);
  }
  check((await fetch(`${base}/blog/missing-migration-test-article/`)).status === 404, "Missing article not 404");
  check((await fetch(`${base}/api/blog/revalidate/`, { method: "POST", body: "{}" })).status === 401, "Webhook auth failed");
  const refresh = await fetch(`${base}/api/blog/revalidate/`, { method: "POST", headers: { authorization: `Bearer ${secret}`, "content-type": "application/json" }, body: JSON.stringify({ slug: records[0].slug }) });
  check(refresh.ok && (await refresh.json()).invalidated, "Cache refresh failed");
  check((await fetch(`${base}/blog/${records[0].slug}/`)).ok, "Page failed after invalidation");
  console.log(JSON.stringify({ remotePagesVerified: records.length, mediaVerified: assets, listingsVerified: 3, missingPage404: true, cacheRefreshVerified: true, persistentConfigurationChanged: false }));
} finally {
  await mongo.close();
  server.kill("SIGTERM");
  await once(server, "exit");
}
