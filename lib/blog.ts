import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { parsePostMeta, renderMarkdown, SLUG, type Post, type PostMeta } from "./blog-model";
import { getRemoteCatalog, getRemoteHtml, getRemoteRecord } from "./blog-remote";
export type { Post, PostMeta } from "./blog-model";

const BLOG_DIR = path.join(process.cwd(), "content", "blog");
export function remoteBlogsEnabled(): boolean {
  const source = process.env.BLOG_CONTENT_SOURCE ?? "local";
  if (source !== "local" && source !== "remote") throw new Error("Invalid BLOG_CONTENT_SOURCE");
  return source === "remote";
}
function localPosts(): Post[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs.readdirSync(BLOG_DIR, { withFileTypes: true }).filter(e => e.isDirectory()).flatMap(entry => {
    const filename = path.join(BLOG_DIR, entry.name, "index.md");
    if (!fs.existsSync(filename)) return [];
    const { data, content } = matter(fs.readFileSync(filename, "utf8"));
    const meta = parsePostMeta({ ...data, slug: data.slug || entry.name, status: data.status || "draft" });
    return [{ ...meta, html: renderMarkdown(content) }];
  }).sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
/** Public catalog only: listing/sitemap never fetch every S3 article body. */
export async function getPublishedPosts(): Promise<PostMeta[]> {
  if (remoteBlogsEnabled()) return getRemoteCatalog();
  return localPosts().filter(p => p.status === "published").map(({ html: _html, ...meta }) => { void _html; return meta; });
}
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  if (!SLUG.test(slug) || slug.length > 150) return undefined;
  if (!remoteBlogsEnabled()) return localPosts().find(p => p.slug === slug && p.status === "published");
  const record = await getRemoteRecord(slug);
  if (!record) return undefined;
  return { ...record, html: await getRemoteHtml(record.s3Key, record.sha256) };
}
