// Operator-only migration using credentials explicitly authorized by the owner.
// No credential values are logged or persisted; no existing S3 bytes overwritten.
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { prepareArticle } from "./migrate-blog-to-storage.mjs";
import { BLOG_BUCKET, BLOG_DATABASE, BLOG_COLLECTION, sha256 } from "../lib/blog-model.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const flags = process.argv.slice(2);
if (flags.some(f => f !== "--apply")) throw new Error("Only --apply supported");
const packages = [];
for (const entry of (await fs.readdir(path.join(root, "content/blog"), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
  if (entry.isDirectory()) packages.push(await prepareArticle(path.join(root, "content/blog", entry.name, "index.md"), path.join(root, "public")));
}
if (new Set(packages.map(p => p.record.slug)).size !== packages.length) throw new Error("Duplicate slugs");
const equal = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every(k => Object.hasOwn(b, k) && equal(a[k], b[k]));
};
if (!flags.includes("--apply")) {
  console.log(`Validated ${packages.length} article packages. No cloud calls or writes.`);
} else {
  const rows = (await fs.readFile(path.join(root, "../secrects/healthos-vercel-s3_accessKeys.csv"), "utf8")).trim().split(/\r?\n/).map(l => l.split(",").map(v => v.replace(/^"|"$/g, "")));
  if (rows[0][0] !== "Access key ID" || rows[0][1] !== "Secret access key" || !rows[1]?.[0] || !rows[1]?.[1]) throw new Error("Unexpected AWS credential file format");
  const uri = process.env.BLOG_MONGODB_URI || process.env.MONGODB_URI;
  if (!uri) throw new Error("MongoDB credential missing");
  const mongo = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  const s3 = new S3Client({ region: "us-east-2", credentials: { accessKeyId: rows[1][0], secretAccessKey: rows[1][1] }, maxAttempts: 2 });
  try {
    await mongo.connect();
    const catalog = mongo.db(BLOG_DATABASE).collection(BLOG_COLLECTION);
    for (const item of packages) {
      const published = { _id: item.record.slug, ...item.record };
      const staged = { ...published, status: "draft", migration: { state: "pending_s3_upload", intendedStatus: item.record.status } };
      const found = await catalog.find({ slug: item.record.slug }).toArray();
      if (found.length !== 1 || (!equal(found[0], staged) && !equal(found[0], published))) throw new Error("Catalog differs from expected migration state");
      item.before = found[0];
      item.after = published;
    }
    // Finish and verify ALL uploads before publishing any catalog pointers.
    let verifiedObjects = 0;
    for (const item of packages) {
      for (const object of item.objects) {
        try {
          await s3.send(new PutObjectCommand({ Bucket: BLOG_BUCKET, Key: object.key, Body: object.bytes, ContentType: object.contentType, IfNoneMatch: "*" }), { abortSignal: AbortSignal.timeout(30000) });
        } catch (error) {
          if (error.$metadata?.httpStatusCode !== 412) throw error;
        }
        const result = await s3.send(new GetObjectCommand({ Bucket: BLOG_BUCKET, Key: object.key }), { abortSignal: AbortSignal.timeout(30000) });
        if (!result.Body || result.ContentLength !== object.bytes.length || result.ContentType !== object.contentType || sha256(await result.Body.transformToByteArray()) !== sha256(object.bytes)) throw new Error("S3 verification failed");
        verifiedObjects++;
      }
      console.log(`S3 VERIFIED ${item.record.slug}: ${item.objects.length} objects`);
    }
    for (const item of packages) {
      if (!equal(item.before, item.after)) {
        // Compare the entire staged document atomically; don't overwrite edits.
        const result = await catalog.replaceOne({ _id: item.before._id, $expr: { $eq: ["$$ROOT", { $literal: item.before }] } }, item.after);
        if (result.matchedCount !== 1) throw new Error("Catalog changed during upload; promotion stopped");
      }
      const found = await catalog.find({ slug: item.record.slug }).toArray();
      if (found.length !== 1 || !equal(found[0], item.after)) throw new Error("Final catalog verification failed");
      console.log(`CATALOG VERIFIED ${item.record.slug}: ${item.record.status}`);
    }
    console.log(JSON.stringify({ verifiedArticles: packages.length, verifiedObjects, bucket: BLOG_BUCKET, collection: `${BLOG_DATABASE}.${BLOG_COLLECTION}`, websiteModeChanged: false, localFilesDeleted: false }));
  } catch (error) {
    console.error(`Migration stopped: ${error.name}, HTTP ${error.$metadata?.httpStatusCode ?? "n/a"}. Partial work may be resumed; no existing S3 objects overwritten.`);
    process.exitCode = 1;
  } finally { await mongo.close(); s3.destroy(); }
}
