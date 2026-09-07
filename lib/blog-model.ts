import { createHash } from "node:crypto";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

export const BLOG_TAG = "ontor-blog-v1";
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
export function parsePostMeta(value: unknown): PostMeta {
  if (!value || typeof value !== "object") throw new Error("Invalid blog metadata");
  const d = value as Record<string, unknown>;
  const slug = text(d.slug, "slug", 150);
  if (!SLUG.test(slug)) throw new Error("Invalid blog slug");
  const date = text(d.date, "date", 40);
  if (!validDate(date)) throw new Error("Invalid blog date");
  if (d.status !== "draft" && d.status !== "published") throw new Error("Explicit blog status required");
  const result: PostMeta = { slug, title: text(d.title, "title", 500), description: text(d.description, "description"), date, status: d.status };
  for (const field of ["updated", "targetKeyword", "intent", "icp", "heroImage", "ogImage", "heroImageAlt"] as const) {
    if (d[field] !== undefined) result[field] = text(d[field], field);
  }
  if (result.updated && !validDate(result.updated)) throw new Error("Invalid updated date");
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
