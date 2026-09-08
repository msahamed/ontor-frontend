import "server-only";
import { SLUG, type Post, type PostMeta, withEnsuredPublishedPosts } from "./blog-model";
import { getRemoteCatalog, getRemoteHtml, getRemoteRecord, loadPublishedDiscoveryPosts } from "./blog-remote";
export type { Post, PostMeta } from "./blog-model";

/** Public catalog only: listing/sitemap never fetch every S3 article body. */
export async function getPublishedPosts(): Promise<PostMeta[]> {
  return getRemoteCatalog();
}
export type DiscoveryPosts = { posts: PostMeta[]; catalogAvailable: boolean };
/**
 * Fresh published catalog for sitemap.xml / llms.txt.
 * Bypasses the hourly data cache so a newly published slug is not omitted for up to an hour,
 * and never throws: callers must still serve static routes when Mongo is down.
 */
export async function getPublishedPostsForDiscovery(): Promise<DiscoveryPosts> {
  try {
    return { posts: withEnsuredPublishedPosts(await loadPublishedDiscoveryPosts()), catalogAvailable: true };
  } catch (err) {
    console.error("[blog] published catalog unavailable for discovery", err);
    return { posts: withEnsuredPublishedPosts([]), catalogAvailable: false };
  }
}
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  if (!SLUG.test(slug) || slug.length > 150) return undefined;
  const record = await getRemoteRecord(slug);
  if (!record) return undefined;
  return { ...record, html: await getRemoteHtml(record.s3Key, record.sha256) };
}
