// GET /sitemap.xml — same ISR + webhook refresh path as /llms.txt and /blog/.
//
// app/sitemap.ts was a metadata route. On Vercel it was emitted as a static
// build artifact, so newly published catalog posts (e.g. freight-sales-call-
// block-readiness) appeared on /blog/ and in llms.txt but not here.
// Blog locs come from getPublishedPosts(), the same catalog as the blog index.

import { getPublishedPosts } from "../../lib/blog";
import { renderSitemapXml, sitemapEntries } from "../../lib/sitemap-entries";

export const revalidate = 3600;

export async function GET() {
  try {
    const xml = renderSitemapXml(sitemapEntries(await getPublishedPosts()));
    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch {
    // Keep the last successful ISR response instead of caching an empty blog list.
    throw new Error("[sitemap] blog catalog unavailable");
  }
}
