// GET /llms.txt — same published catalog as sitemap.xml (fresh Mongo read).
//
// The prose preamble is maintained here; the blog links come from
// getPublishedPostsForDiscovery(), so publishing a post adds it automatically.
// (Replaces the old hand-maintained public/llms.txt — that file was deleted
// so it can't shadow this route.)
// Catalog outages must not 500: serve the preamble plus any known slugs, and
// send no-store so an incomplete Blog posts section is not cached.

import { connection } from "next/server";
import { SITE_ORIGIN, blogPostUrl, withEnsuredPublishedPosts } from "../../lib/blog-model";
import { getPublishedPostsForDiscovery, type PostMeta } from "../../lib/blog";

const BASE_URL = SITE_ORIGIN;

// Same uncached published catalog as sitemap.xml. Request-time so a new slug
// is not omitted behind the hourly ISR snapshot.
export const dynamic = "force-dynamic";

function postLinks(posts: PostMeta[]): string {
  return posts.map((p) => `- ${p.title}: ${blogPostUrl(p.slug)}`).join("\n");
}

async function buildLlmsTxt(posts: PostMeta[]): Promise<string> {
  return `# Ontor

Ontor provides private, real-time voice feedback during calls. Voice analysis runs on-device. Cloud backup is optional.

## Product

Ontor is a wellness and performance intelligence tool for call-intensive professionals, including sales, collections, and customer support. Desktop sessions can start when the microphone is in use, or manually. Voice recognition helps select the user's speech, but recognition can be imperfect.

## Seven voice markers

Stress, Focus, Energy, Fatigue, Vocal strain, Speech clarity, and Hesitation. Readings are compared with personal history. Fatigue is a voice marker; computer activity is used for timing and work stretches, not tiredness inference.

## Experience

During a call, private cues can suggest a small action. Afterward, users can review session history or try a guided reset. Today shows activity time, work stretches, and voice-marker trends.

## Privacy

Analysis runs on-device. Optional sync can upload history and check-in recordings. Product usage and reliability reporting is separate from sync. See the privacy policy for details.

## Key facts

- Desktop: Mac and Windows. Mobile voice check-ins are also supported.
- Founder: Sabber Ahamed, Dallas, TX.
- Pricing: 14-day free trial, then $10/month or $100/year. Team pilots are priced separately.
- Ontor does not diagnose or treat health conditions.

## Links

- Website: ${BASE_URL}
- FAQ: ${BASE_URL}/faq/
- What is a voice biomarker (explainer): ${BASE_URL}/voice-biomarkers/
- Voice biomarkers vs wearables (Oura/WHOOP/Apple Watch): ${BASE_URL}/voice-vs-wearables/
- Blog: ${BASE_URL}/blog/

## Blog posts

${postLinks(posts)}

## Contact

- About the founder: ${BASE_URL}/about/
- TestFlight beta: https://testflight.apple.com/join/JBG3ANFF
- Discord community: https://discord.gg/SyZPw3cgG
`;
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
      console.error("[llms.txt] blog catalog unavailable", err);
      posts = withEnsuredPublishedPosts([]);
    }
    return new Response(await buildLlmsTxt(posts), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": catalogAvailable
          ? "public, max-age=0, must-revalidate"
          : "private, no-store",
      },
    });
  } catch (err) {
    console.error("[llms.txt] unexpected failure", err);
    return new Response(await buildLlmsTxt(withEnsuredPublishedPosts([])), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  }
}
