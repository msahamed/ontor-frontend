import "server-only";
import { MongoClient } from "mongodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { unstable_cache } from "next/cache";
import { BLOG_BUCKET, BLOG_COLLECTION, BLOG_DATABASE, BLOG_TAG, MAX_ARTICLE_BYTES, MAX_ASSET_BYTES, parseCatalogPost, renderMarkdown, sha256, SLUG, type CatalogPost } from "./blog-model";

let mongo: Promise<MongoClient> | undefined;
let s3: S3Client | undefined;
function catalog() {
  // Never fall back to the product's broad MONGODB_URI.
  const uri = process.env.BLOG_MONGODB_URI;
  if (!uri) throw new Error("BLOG_MONGODB_URI required for remote blogs");
  if (!mongo) {
    const client = new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 8000 });
    mongo = client.connect().catch(async () => {
      mongo = undefined;
      await client.close();
      throw new Error("Blog database connection failed");
    });
  }
  return mongo.then(client => client.db(BLOG_DATABASE).collection(BLOG_COLLECTION));
}
function storage() {
  if (!s3) {
    const region = process.env.BLOG_S3_REGION;
    const accessKeyId = process.env.BLOG_AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.BLOG_AWS_SECRET_ACCESS_KEY;
    if (!region || !accessKeyId || !secretAccessKey) throw new Error("Dedicated BLOG_S3_REGION and BLOG_AWS credentials required");
    s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey, sessionToken: process.env.BLOG_AWS_SESSION_TOKEN }, maxAttempts: 2 });
  }
  return s3;
}
export async function readBlogObject(key: string, checksum: string, maxBytes = MAX_ARTICLE_BYTES) {
  const result = await storage().send(new GetObjectCommand({ Bucket: BLOG_BUCKET, Key: key }), { abortSignal: AbortSignal.timeout(15000) });
  if (!result.Body || (result.ContentLength ?? Infinity) > maxBytes) throw new Error("Invalid blog object size");
  const bytes = await result.Body.transformToByteArray();
  if (bytes.byteLength > maxBytes || sha256(bytes) !== checksum) throw new Error("Blog object checksum mismatch");
  return bytes;
}
// Compatible with this project's existing non-Cache-Components configuration.
export const getRemoteCatalog = unstable_cache(async (): Promise<CatalogPost[]> => {
  const rows = await (await catalog()).find({ status: "published" }, { projection: { _id: 0 } }).sort({ date: -1, slug: 1 }).limit(10000).toArray();
  return rows.map(parseCatalogPost);
}, [BLOG_TAG, "catalog"], { revalidate: 3600, tags: [BLOG_TAG] });
export const getRemoteRecord = unstable_cache(async (slug: string): Promise<CatalogPost | null> => {
  if (!SLUG.test(slug) || slug.length > 150) return null;
  const row = await (await catalog()).findOne({ slug, status: "published" }, { projection: { _id: 0 } });
  return row ? parseCatalogPost(row) : null;
}, [BLOG_TAG, "record"], { revalidate: 3600, tags: [BLOG_TAG] });
export const getRemoteHtml = unstable_cache(async (key: string, checksum: string) => {
  return renderMarkdown(Buffer.from(await readBlogObject(key, checksum)).toString("utf8"));
}, [BLOG_TAG, "body"], { revalidate: 3600, tags: [BLOG_TAG] });
export async function getRemoteAsset(slug: string, version: string, name: string) {
  const record = await getRemoteRecord(slug);
  // Not a general S3 proxy or draft preview.
  if (!record || record.version !== version) return null;
  const asset = record.assets.find(a => a.name === name);
  if (!asset) return null;
  return { asset, bytes: await readBlogObject(asset.key, asset.sha256, MAX_ASSET_BYTES) };
}
