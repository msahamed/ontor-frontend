// One-time, explicitly authorized catalog staging. Does not upload or publish.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import { prepareArticle } from "./migrate-blog-to-storage.mjs";
import { BLOG_DATABASE, BLOG_COLLECTION } from "../lib/blog-model.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flags = process.argv.slice(2);
if (flags.some(f => f !== "--apply")) throw new Error("Only --apply supported");
const records = [];
for (const entry of (await fs.readdir(path.join(root, "content/blog"), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory()) continue;
  const { record } = await prepareArticle(path.join(root, "content/blog", entry.name, "index.md"), path.join(root, "public"));
  records.push({ _id: record.slug, ...record, status: "draft", migration: { state: "pending_s3_upload", intendedStatus: record.status } });
}
if (new Set(records.map(r => r.slug)).size !== records.length) throw new Error("Duplicate slugs");
if (!flags.includes("--apply")) {
  console.log(`Validated ${records.length} draft records. No network calls or writes.`);
} else {
  // The user authorized the existing frontend credential for this one-time task.
  // Never hand it to a bot or use it for the blog runtime.
  const uri = process.env.BLOG_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MongoDB credential missing");
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  const matches = (row, record) => row && Object.keys(row).length === Object.keys(record).length && Object.keys(record).every(k => JSON.stringify(row[k]) === JSON.stringify(record[k]));
  try {
    await client.connect();
    const collection = client.db(BLOG_DATABASE).collection(BLOG_COLLECTION);
    // Resolve all conflicts before the first insert. Never overwrite existing rows.
    const missing = [];
    for (const record of records) {
      const rows = await collection.find({ $or: [{ _id: record._id }, { slug: record.slug }] }).toArray();
      if (!rows.length) missing.push(record);
      else if (rows.length !== 1 || !matches(rows[0], record)) throw new Error("Existing catalog conflict");
    }
    for (const record of missing) await collection.insertOne(record);
    for (const record of records) {
      const rows = await collection.find({ slug: record.slug }).toArray();
      if (rows.length !== 1 || !matches(rows[0], record)) throw new Error("Verification failed");
      console.log(`VERIFIED draft / pending S3: ${record.slug}`);
    }
    console.log(JSON.stringify({ verified: records.length, inserted: missing.length, published: await collection.countDocuments({ status: "published" }), collection: `${BLOG_DATABASE}.${BLOG_COLLECTION}` }));
  } catch (error) {
    console.error(`Staging stopped (${error.name}). No existing records overwritten; partial inserts may be safely resumed.`);
    process.exitCode = 1;
  } finally { await client.close(); }
}
