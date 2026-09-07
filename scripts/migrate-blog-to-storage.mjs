// Node 22.18+; dry-run by default. Never reads the product's .env files.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { MongoClient } from "mongodb";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { BLOG_BUCKET, BLOG_PREFIX, BLOG_DATABASE, BLOG_COLLECTION, MAX_ARTICLE_BYTES, MAX_ASSET_BYTES, parsePostMeta, parseCatalogPost, renderMarkdown, sha256 } from "../lib/blog-model.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mimeTypes = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif" };

export async function prepareArticle(filename, publicDir) {
  const { data, content } = matter(await fs.readFile(filename, "utf8"));
  const meta = parsePostMeta(data);
  renderMarkdown(content); // Check size/renderability before any remote writes.
  const references = new Set([meta.heroImage, meta.ogImage].filter(Boolean));
  for (const match of content.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)) references.add(match[1]);
  for (const match of content.matchAll(/!\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)/g)) references.add(match[1]);
  const assets = [];
  const publicRoot = await fs.realpath(publicDir);
  for (const reference of [...references].sort()) {
    if (!reference.startsWith("/") || reference.startsWith("//") || reference.includes("?") || reference.includes("#")) throw new Error(`Manual media review required for ${meta.slug}`);
    const filename = await fs.realpath(path.resolve(publicRoot, `.${decodeURIComponent(reference)}`));
    if (!filename.startsWith(`${publicRoot}${path.sep}`)) throw new Error("Asset escapes public directory");
    const ext = path.extname(filename).toLowerCase();
    const contentType = mimeTypes[ext];
    if (!contentType) throw new Error(`Unsupported asset type: ${ext}`);
    if ((await fs.stat(filename)).size > MAX_ASSET_BYTES) throw new Error("Asset too large");
    const bytes = await fs.readFile(filename);
    const hash = sha256(bytes);
    assets.push({ reference, name: `${hash}${ext}`, sha256: hash, contentType, bytes });
  }
  // Stable content version covers body, metadata AND binary assets.
  const version = sha256(JSON.stringify({ meta, content, assets: assets.map(a => [a.reference, a.sha256]) }));
  const prefix = `${BLOG_PREFIX}${meta.slug}/${version}/`;
  let markdown = content;
  const migratedMeta = { ...meta };
  const objects = [];
  const manifest = [];
  for (const asset of assets) {
    const url = `/blog-media/${meta.slug}/${version}/${asset.name}/`;
    markdown = markdown.split(asset.reference).join(url);
    if (migratedMeta.heroImage === asset.reference) migratedMeta.heroImage = url;
    if (migratedMeta.ogImage === asset.reference) migratedMeta.ogImage = url;
    if (!manifest.some(a => a.name === asset.name)) {
      const key = `${prefix}assets/${asset.name}`;
      manifest.push({ name: asset.name, key, sha256: asset.sha256, contentType: asset.contentType });
      objects.push({ key, bytes: asset.bytes, contentType: asset.contentType });
    }
  }
  if (Buffer.byteLength(markdown) > MAX_ARTICLE_BYTES) throw new Error("Article too large");
  const record = parseCatalogPost({ ...migratedMeta, schemaVersion: 1, version, s3Key: `${prefix}article.md`, sha256: sha256(markdown), assets: manifest });
  objects.push({ key: record.s3Key, bytes: Buffer.from(markdown), contentType: "text/markdown; charset=utf-8" });
  objects.push({ key: `${prefix}manifest.json`, bytes: Buffer.from(JSON.stringify(record, null, 2)), contentType: "application/json" });
  return { record, objects };
}

async function putImmutable(s3, object) {
  try {
    await s3.send(new PutObjectCommand({ Bucket: BLOG_BUCKET, Key: object.key, Body: object.bytes, ContentType: object.contentType, IfNoneMatch: "*" }), { abortSignal: AbortSignal.timeout(30000) });
  } catch (error) {
    if (error?.$metadata?.httpStatusCode !== 412) throw error;
    // Resume safely only when the existing bytes match; never overwrite.
  }
  const result = await s3.send(new GetObjectCommand({ Bucket: BLOG_BUCKET, Key: object.key }), { abortSignal: AbortSignal.timeout(30000) });
  if (!result.Body || result.ContentLength !== object.bytes.length || sha256(await result.Body.transformToByteArray()) !== sha256(object.bytes)) throw new Error("Uploaded object verification failed");
}

async function main() {
  const flags = process.argv.slice(2);
  if (flags.some(flag => flag !== "--apply")) throw new Error("Only --apply is supported; default is dry-run");
  const apply = flags.includes("--apply");
  const directory = path.join(root, "content/blog");
  const prepared = [];
  for (const entry of (await fs.readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.isDirectory()) prepared.push(await prepareArticle(path.join(directory, entry.name, "index.md"), path.join(root, "public")));
  }
  if (new Set(prepared.map(p => p.record.slug)).size !== prepared.length) throw new Error("Duplicate local slugs");
  for (const { record, objects } of prepared) console.log(`${apply ? "READY" : "DRY RUN"} ${record.slug} (${record.status}): ${objects.length} objects, ${objects.reduce((n, o) => n + o.bytes.length, 0)} bytes`);
  if (!apply) { console.log(`Validated ${prepared.length} articles. No network calls or writes performed.`); return; }

  const { BLOG_MONGODB_URI, BLOG_S3_REGION, BLOG_AWS_ACCESS_KEY_ID, BLOG_AWS_SECRET_ACCESS_KEY, BLOG_AWS_SESSION_TOKEN } = process.env;
  if (!BLOG_MONGODB_URI || !BLOG_S3_REGION || !BLOG_AWS_ACCESS_KEY_ID || !BLOG_AWS_SECRET_ACCESS_KEY) throw new Error("Dedicated BLOG_* credentials required");
  const mongo = new MongoClient(BLOG_MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const s3 = new S3Client({ region: BLOG_S3_REGION, credentials: { accessKeyId: BLOG_AWS_ACCESS_KEY_ID, secretAccessKey: BLOG_AWS_SECRET_ACCESS_KEY, sessionToken: BLOG_AWS_SESSION_TOKEN }, maxAttempts: 2 });
  try {
    await mongo.connect();
    const auth = await mongo.db("admin").command({ connectionStatus: 1, showPrivileges: true });
    const privileges = auth.authInfo?.authenticatedUserPrivileges;
    const allowed = new Set(["find", "insert", "update", "listIndexes"]);
    if (!Array.isArray(privileges) || !privileges.length || privileges.some(p => p.resource?.db !== BLOG_DATABASE || p.resource?.collection !== BLOG_COLLECTION || p.actions.some(a => !allowed.has(a)))) throw new Error("Migration requires collection-scoped credentials; broad or unverifiable permissions rejected");
    const collection = mongo.db(BLOG_DATABASE).collection(BLOG_COLLECTION);
    const indexes = await collection.listIndexes().toArray();
    if (!indexes.some(i => i.unique && i.key?.slug === 1 && Object.keys(i.key).length === 1 && !i.partialFilterExpression && !i.sparse)) throw new Error("Administrator must create a unique non-partial slug index first");
    // Check every existing record before uploading anything.
    for (const item of prepared) {
      const existing = await collection.findOne({ slug: item.record.slug });
      if (existing) {
        const validated = parseCatalogPost(existing);
        if (JSON.stringify(validated) !== JSON.stringify(item.record)) throw new Error(`Existing catalog differs: ${item.record.slug}; refusing overwrite`);
        item.existing = true;
      }
    }
    for (const { record, objects, existing } of prepared) {
      for (const object of objects) await putImmutable(s3, object);
      if (!existing) await collection.insertOne({ _id: record.slug, ...record });
      const verified = parseCatalogPost(await collection.findOne({ slug: record.slug }));
      if (JSON.stringify(verified) !== JSON.stringify(record)) throw new Error("Catalog verification failed");
      console.log(`VERIFIED ${record.slug}`);
    }
    console.log("Migration complete. Website mode unchanged; test remote rendering before switching production.");
  } finally { await mongo.close(); s3.destroy(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    // Driver errors can include credentials/connection details; never dump them.
    console.error(`Migration stopped (${error?.name ?? "Error"}). No existing objects or records were overwritten. Review configuration and permissions.`);
    process.exitCode = 1;
  });
}
