// GET /sitemap.xml — same published Mongo catalog as llms.txt.
// Implemented as a Route Handler so Vercel cannot pin a stale metadata-sitemap
// ISR snapshot (app/sitemap.ts was cached by default and threw on catalog errors).

import { connection } from "next/server";
import { renderSitemapXml, withEnsuredPublishedPosts } from "../../lib/blog-model";
import { getPublishedPostsForDiscovery, type PostMeta } from "../../lib/blog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function sitemapResponse(posts: PostMeta[], catalogAvailable: boolean) {
  return new Response(renderSitemapXml(posts), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": catalogAvailable
        ? "public, max-age=0, must-revalidate"
        : "private, no-store",
    },
  });
}

export async function GET() {
  try {
    await connection();
    let posts: PostMeta[] = [];
    let catalogAvailable = false;
    try {
      const result = await getPublishedPostsForDiscovery();
      posts = result.posts;
      catalogAvailable = result.catalogAvailable;
    } catch (err) {
      console.error("[sitemap] blog catalog unavailable", err);
      posts = withEnsuredPublishedPosts([]);
    }
    if (!catalogAvailable) {
      console.error("[sitemap] blog catalog unavailable; returning static routes and known published slugs");
    }
    return sitemapResponse(posts, catalogAvailable);
  } catch (err) {
    console.error("[sitemap] unexpected failure", err);
    return sitemapResponse(withEnsuredPublishedPosts([]), false);
  }
}
