import "server-only";
import { SLUG, type Post, type PostMeta } from "./blog-model";
import { getRemoteCatalog, getRemoteHtml, getRemoteRecord } from "./blog-remote";
export type { Post, PostMeta } from "./blog-model";

/** Public catalog only: listing/sitemap never fetch every S3 article body. */
export async function getPublishedPosts(): Promise<PostMeta[]> {
  return getRemoteCatalog();
}
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  if (!SLUG.test(slug) || slug.length > 150) return undefined;
  const record = await getRemoteRecord(slug);
  if (!record) return undefined;
  return { ...record, html: await getRemoteHtml(record.s3Key, record.sha256) };
}
