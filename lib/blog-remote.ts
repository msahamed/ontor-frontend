import "server-only";
import { MongoClient } from "mongodb";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { unstable_cache } from "next/cache";
import { BLOG_BUCKET, BLOG_COLLECTION, BLOG_DATABASE, BLOG_TAG, MAX_ARTICLE_BYTES, MAX_ASSET_BYTES, parseCatalogPost, parsePublishedCatalogRows, parsePublishedDiscoveryPosts, renderMarkdown, sha256, SLUG, type CatalogPost, type PostMeta } from "./blog-model";

let mongo: Promise<MongoClient> | undefined;
let s3: S3Client | undefined;
function catalog() {
  // Shared server credential, explicitly requested by the owner.
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI required for blogs");
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
    const region = process.env.AWS_REGION;
    if (!region) throw new Error("AWS_REGION required for blogs");
    // Same SDK credential provider chain as the observations API.
    s3 = new S3Client({ region, maxAttempts: 2 });
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
async function publishedCatalogRows() {
  // No tighter limit: a cap below the real published count would omit new slugs from listings.
  return (await catalog()).find({ status: "published" }, { projection: { _id: 0 } }).sort({ date: -1, slug: 1 }).limit(10000).toArray();
}
async function loadPublishedCatalog(): Promise<CatalogPost[]> {
  return parsePublishedCatalogRows(await publishedCatalogRows());
}
/** Uncached published slug/title list for sitemap.xml and llms.txt. */
export async function loadPublishedDiscoveryPosts(): Promise<PostMeta[]> {
  return parsePublishedDiscoveryPosts(await publishedCatalogRows());
}
// Compatible with this project's existing non-Cache-Components configuration.
export const getRemoteCatalog = unstable_cache(loadPublishedCatalog, [BLOG_TAG, "catalog"], { revalidate: 3600, tags: [BLOG_TAG] });
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
