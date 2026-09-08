import { createHash } from "node:crypto";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export const BLOG_TAG = "ontor-blog-v2";
export const BLOG_BUCKET = "healthos-exp";
export const BLOG_PREFIX = "seo-growth/articles/";
export const BLOG_DATABASE = "healthos";
export const BLOG_COLLECTION = "content_catalog";
export const MAX_ARTICLE_BYTES = 1024 * 1024;
export const MAX_ASSET_BYTES = 20 * 1024 * 1024;
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const VERSION = /^[a-f0-9]{64}$/;
export const ASSET_NAME = /^[a-f0-9]{64}\.(?:png|jpg|jpeg|webp|gif|avif)$/;

export interface PostMeta {
  slug: string; title: string; description: string; date: string;
  updated?: string; targetKeyword?: string; secondaryKeywords?: string[];
  intent?: string; icp?: string; status: "draft" | "published";
  heroImage?: string; ogImage?: string; heroImageAlt?: string;
  faq?: { q: string; a: string }[];
  sources?: { title: string; url: string }[];
}
export interface Post extends PostMeta { html: string }
export interface BlogAsset { name: string; key: string; sha256: string; contentType: string }
export interface CatalogPost extends PostMeta {
  schemaVersion: 1; version: string; s3Key: string; sha256: string; assets: BlogAsset[];
}
export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}
function text(value: unknown, name: string, max = 5000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`Invalid blog ${name}`);
  return value;
}
export function safeUrl(value: string): boolean {
  if (/[\u0000-\u0020\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; }
  catch { return false; }
}
function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
/** YYYY-MM-DD, plus Mongo Date / ISO datetime from publishing bots. */
function catalogDay(value: unknown, name: string): string {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    const day = value.toISOString().slice(0, 10);
    if (validDate(day)) return day;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (validDate(trimmed)) return trimmed;
    if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
      const parsed = Date.parse(trimmed);
      if (Number.isFinite(parsed)) {
        const day = new Date(parsed).toISOString().slice(0, 10);
        if (validDate(day)) return day;
      }
    }
  }
  throw new Error(`Invalid blog ${name}`);
}
export function parsePostMeta(value: unknown): PostMeta {
  if (!value || typeof value !== "object") throw new Error("Invalid blog metadata");
  const d = value as Record<string, unknown>;
  const slug = text(d.slug, "slug", 150);
  if (!SLUG.test(slug)) throw new Error("Invalid blog slug");
  const date = catalogDay(d.date, "date");
  if (d.status !== "draft" && d.status !== "published") throw new Error("Explicit blog status required");
  const result: PostMeta = { slug, title: text(d.title, "title", 500), description: text(d.description, "description"), date, status: d.status };
  if (d.updated !== undefined) result.updated = catalogDay(d.updated, "updated");
  for (const field of ["targetKeyword", "intent", "icp", "heroImage", "ogImage", "heroImageAlt"] as const) {
    if (d[field] !== undefined) result[field] = text(d[field], field);
  }
  for (const field of ["heroImage", "ogImage"] as const) {
    if (result[field] && !safeUrl(result[field])) throw new Error("Unsafe blog image URL");
  }
  if (d.secondaryKeywords !== undefined) {
    if (!Array.isArray(d.secondaryKeywords) || d.secondaryKeywords.length > 30) throw new Error("Invalid keywords");
    result.secondaryKeywords = d.secondaryKeywords.map(x => text(x, "keyword", 200));
  }
  if (d.faq !== undefined) {
    if (!Array.isArray(d.faq) || d.faq.length > 30) throw new Error("Invalid FAQ");
    result.faq = d.faq.map(x => ({ q: text(x?.q, "FAQ question"), a: text(x?.a, "FAQ answer", 15000) }));
  }
  if (d.sources !== undefined) {
    if (!Array.isArray(d.sources) || d.sources.length > 100) throw new Error("Invalid sources");
    result.sources = d.sources.map(x => {
      const url = text(x?.url, "source URL");
      if (!safeUrl(url)) throw new Error("Unsafe source URL");
      return { title: text(x?.title, "source title"), url };
    });
  }
  return result;
}
export function parseCatalogPost(value: unknown): CatalogPost {
  const meta = parsePostMeta(value);
  const d = value as Record<string, unknown>;
  const version = text(d.version, "version", 64);
  const checksum = text(d.sha256, "checksum", 64);
  if (d.schemaVersion !== 1 || !VERSION.test(version) || !VERSION.test(checksum)) throw new Error("Invalid catalog version");
  const base = `${BLOG_PREFIX}${meta.slug}/${version}/`;
  if (d.s3Key !== `${base}article.md`) throw new Error("Article key outside its version prefix");
  if (!Array.isArray(d.assets) || d.assets.length > 100) throw new Error("Invalid asset manifest");
  const assets: BlogAsset[] = d.assets.map(a => {
    if (!a || !ASSET_NAME.test(a.name) || a.key !== `${base}assets/${a.name}` || !VERSION.test(a.sha256)) throw new Error("Invalid asset key");
    const extension = a.name.split(".").pop();
    const mime = ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif", avif: "image/avif" } as Record<string, string>)[extension];
    if (a.contentType !== mime || !a.name.startsWith(`${a.sha256}.`)) throw new Error("Invalid asset type/hash");
    return { name: a.name, key: a.key, sha256: a.sha256, contentType: mime };
  });
  if (new Set(assets.map(a => a.name)).size !== assets.length) throw new Error("Duplicate asset name");
  return { ...meta, schemaVersion: 1, version, s3Key: d.s3Key as string, sha256: checksum, assets };
}
function rowSlug(row: unknown): string {
  return row && typeof row === "object" && typeof (row as { slug?: unknown }).slug === "string"
    ? (row as { slug: string }).slug
    : "unknown";
}
/**
 * Listing/sitemap must not fail closed on one bad published row.
 * A throwing `.map(parseCatalogPost)` 500s the sitemap and leaves ISR stuck on a stale URL set.
 */
export function parsePublishedCatalogRows(rows: unknown[]): CatalogPost[] {
  const posts: CatalogPost[] = [];
  for (const row of rows) {
    try {
      const post = parseCatalogPost(row);
      if (post.status === "published") posts.push(post);
    } catch {
      console.error(`[blog] skipping invalid published catalog row: ${rowSlug(row)}`);
    }
  }
  return posts;
}
function parseDiscoveryPost(row: unknown): PostMeta | undefined {
  try {
    const post = parseCatalogPost(row);
    return post.status === "published" ? post : undefined;
  } catch { /* full catalog parse is stricter than a public URL list */ }
  try {
    const meta = parsePostMeta(row);
    return meta.status === "published" ? meta : undefined;
  } catch { /* last-resort slug so a live published URL is not dropped */ }
  if (!row || typeof row !== "object") return undefined;
  const d = row as Record<string, unknown>;
  if (d.status !== "published" || typeof d.slug !== "string" || d.slug.length > 150 || !SLUG.test(d.slug)) return undefined;
  const title = typeof d.title === "string" && d.title.trim() ? d.title.trim().slice(0, 500) : d.slug;
  const description = typeof d.description === "string" && d.description.trim() ? d.description.trim().slice(0, 5000) : title;
  let date: string;
  try { date = catalogDay(d.date, "date"); } catch { date = new Date().toISOString().slice(0, 10); }
  console.error(`[blog] discovery fallback for published slug ${d.slug}`);
  return { slug: d.slug, title, description, date, status: "published" };
}
/** Slug/title list for sitemap.xml and llms.txt — includes rows the full catalog parser rejects. */
export function parsePublishedDiscoveryPosts(rows: unknown[]): PostMeta[] {
  const posts: PostMeta[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const post = parseDiscoveryPost(row);
    if (!post || seen.has(post.slug)) continue;
    seen.add(post.slug);
    posts.push(post);
  }
  return posts;
}
export function renderMarkdown(markdown: string): string {
  if (Buffer.byteLength(markdown) > MAX_ARTICLE_BYTES) throw new Error("Article too large");
  // Bot-authored HTML is data, never executable JS, MDX, SVG or CSS.
  return sanitizeHtml(marked.parse(markdown, { async: false }) as string, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, "img", "figure", "figcaption"],
    allowedAttributes: { "*": ["class", "id"], a: ["href", "title"], img: ["src", "alt", "width", "height", "loading"], th: ["scope", "colspan", "rowspan"], td: ["colspan", "rowspan"] },
    allowedSchemes: ["https", "http", "mailto"], allowedSchemesByTag: { img: ["https"] }, allowProtocolRelative: false,
  });
}
export function jsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export const SITE_ORIGIN = "https://ontor.ai";
/** Known-live published slugs that ISR has dropped before. Not substitutes for the catalog. */
export const ENSURE_PUBLISHED_POSTS: { slug: string; title: string }[] = [
  {
    slug: "freight-sales-call-block-readiness",
    title: "Freight sales leaders can see dials. They still miss readiness between call blocks.",
  },
  {
    slug: "collections-cool-down-between-hostile-calls",
    title: "Collections leaders can see dials and recovery rates. They still miss readiness after a hostile call.",
  },
];
export function blogPostUrl(slug: string): string {
  return `${SITE_ORIGIN}/blog/${slug}/`;
}
export function withEnsuredPublishedPosts(posts: PostMeta[]): PostMeta[] {
  const have = new Set(posts.map((p) => p.slug));
  const extra: PostMeta[] = [];
  for (const known of ENSURE_PUBLISHED_POSTS) {
    if (have.has(known.slug) || !SLUG.test(known.slug)) continue;
    extra.push({
      slug: known.slug,
      title: known.title,
      description: known.title,
      date: new Date().toISOString().slice(0, 10),
      status: "published",
    });
  }
  return extra.length ? [...posts, ...extra] : posts;
}
export function postLastModified(post: Pick<PostMeta, "date" | "updated">, fallback: Date): Date {
  const raw = post.updated || post.date;
  const date = new Date(raw);
  return Number.isFinite(date.getTime()) ? date : fallback;
}
