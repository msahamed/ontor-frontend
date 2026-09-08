import type { PostMeta } from "./blog-model";

export const SITE_ORIGIN = "https://ontor.ai";

type ChangeFrequency = "weekly" | "monthly" | "yearly";

export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: ChangeFrequency;
  priority: number;
}

const STATIC_ROUTES: ReadonlyArray<{ path: string; changeFrequency: ChangeFrequency; priority: number }> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/how-it-works/", changeFrequency: "monthly", priority: 0.9 },
  { path: "/for-teams/", changeFrequency: "monthly", priority: 0.9 },
  { path: "/sales/", changeFrequency: "monthly", priority: 0.9 },
  { path: "/pricing/", changeFrequency: "monthly", priority: 0.8 },
  { path: "/faq/", changeFrequency: "monthly", priority: 0.8 },
  { path: "/install/", changeFrequency: "monthly", priority: 0.7 },
  { path: "/install/mac/", changeFrequency: "monthly", priority: 0.7 },
  { path: "/voice-biomarkers/", changeFrequency: "monthly", priority: 0.8 },
  { path: "/voice-vs-wearables/", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog/", changeFrequency: "weekly", priority: 0.7 },
  { path: "/about/", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy/", changeFrequency: "yearly", priority: 0.5 },
  { path: "/terms/", changeFrequency: "yearly", priority: 0.5 },
];

/** Trailing-slash permalink matching the live site and blog index. */
export function blogPostUrl(slug: string): string {
  return `${SITE_ORIGIN}/blog/${slug}/`;
}

export function sitemapBlogLocs(posts: ReadonlyArray<Pick<PostMeta, "slug">>): string[] {
  return posts.map((post) => blogPostUrl(post.slug));
}

export function sitemapEntries(
  posts: ReadonlyArray<Pick<PostMeta, "slug" | "date" | "updated">>,
  now = new Date(),
): SitemapEntry[] {
  const staticRoutes = STATIC_ROUTES.map((route) => ({
    url: `${SITE_ORIGIN}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
  const postRoutes = posts.map((post) => ({
    url: blogPostUrl(post.slug),
    lastModified: post.updated || post.date ? new Date(post.updated || post.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
  return [...staticRoutes, ...postRoutes];
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderSitemapXml(entries: ReadonlyArray<SitemapEntry>): string {
  const urls = entries.map((entry) =>
    [
      "<url>",
      `<loc>${escapeXml(entry.url)}</loc>`,
      `<lastmod>${entry.lastModified.toISOString()}</lastmod>`,
      `<changefreq>${entry.changeFrequency}</changefreq>`,
      `<priority>${entry.priority}</priority>`,
      "</url>",
    ].join("\n"),
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}
