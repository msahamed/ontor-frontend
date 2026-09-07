// GET /llms.txt — generated at build time so the blog link list never drifts.
//
// The prose preamble is maintained here; the blog links are pulled from the
// same source as the sitemap (`getPublishedPosts`), so publishing a post adds
// it to llms.txt automatically. (Replaces the old hand-maintained
// public/llms.txt — that file was deleted so it can't shadow this route.)

import { getPublishedPosts } from "../../lib/blog";

const BASE_URL = "https://ontor.ai";

// One descriptive line per published post. Uses each post's own title so the
// list stays accurate without manual edits.
function postLinks(): string {
  return getPublishedPosts()
    .map((p) => `- ${p.title}: ${BASE_URL}/blog/${p.slug}/`)
    .join("\n");
}

function buildLlmsTxt(): string {
  return `# Ontor

> Ontor is performance intelligence from your voice. A desktop app that sits in your menu bar reads your nervous-system state — stress, energy, confidence, fatigue and more — from *how you sound* across real calls and meetings, in real time. It is speaker-gated: only your own voice is analyzed, never the other person's. There is also a few-second voice check-in on mobile. Everything runs on-device.

## What it is

- **Product:** Ontor — performance intelligence from your voice (a voice-biomarker app).
- **Website:** ${BASE_URL}
- **Platforms:** macOS, Windows, iOS, and Android — one engine and the same personal baseline everywhere.
- **Core idea:** Every sales/productivity tool measures what you *did* (calls, pipeline, activity). Nothing measures *how you are holding up* while you do it. Ontor reads that from how your own voice sounds, so a dip shows up before it costs you the outcome.
- **Desktop session mode (the differentiator):** Press Start in the menu bar and it passively reads your voice across a whole call, producing a timeline of your state minute to minute. It is speaker-gated — when the other person talks, nothing is captured. No bot joins the meeting; it runs beside Zoom / Meet / Teams, not inside them.
- **Mobile check-in:** A few seconds of unscripted speech gives a quick nervous-system read when you are away from your desk.
- **Privacy:** All analysis runs on-device; voice audio is not uploaded. Only your own voice is ever analyzed. Self-tracking, not surveillance.
- **Status:** Live. 14-day free trial (no card required), then $20/month or $168/year.

## The eight signals

Energy, Stress, Confidence, Fatigue, Vocal Strain, Expressiveness, Articulation, and Breathing. Each is a transparent, literature-grounded formula scored against the user's own ~30-day rolling baseline (a relative "higher/lower than your usual" read, not a clinical or population score).

## How it works

Each signal is a deterministic, peer-reviewed-literature-grounded blend of acoustic features (pitch, loudness, pace, pauses, vocal clarity) compared to the user's personal baseline. It is not a black-box model. The read is relative and for self-awareness — it does not diagnose or treat, and makes no clinical claims (positioned as a general wellness / performance tool).

## How it is different

- **vs. wearables (Oura, WHOOP, Apple Watch):** Wearables track physiology — heart rate, HRV, sleep — and infer stress. Ontor reads psychological and nervous-system state (confidence, vocal strain, expressiveness) a wrist sensor cannot detect. No hardware to wear; it complements a wearable rather than replacing it. "Wearables read your body. Your voice reveals your mind."
- **vs. call-recording / conversation-intelligence tools (Gong, Chorus):** Those record *what was said* and are sold to the manager. Ontor reads *how the rep sounds*, is rep-first and speaker-gated, and never captures the other side of the call. Different layer, different buyer.

## Who it is for

Salespeople and sales teams (rep-first performance intelligence for people who live on calls); founders and other performance-minded professionals; coaches who want an objective read on how clients are doing between sessions; and biohackers/self-trackers who want the "mind" layer their wearable cannot read.

## Key facts

- Founder: Sabber Ahamed (Applied ML Scientist), Dallas, TX.
- Category: performance intelligence, voice biomarker app, biometric self-tracking.
- Pricing: 14-day free trial (no card required), then $20/month or $168/year. See https://ontor.ai/pricing/
- Not a medical device; for self-awareness and general wellness / performance only.

## Links

- Website: ${BASE_URL}
- FAQ: ${BASE_URL}/faq/
- What is a voice biomarker (explainer): ${BASE_URL}/voice-biomarkers/
- Voice biomarkers vs wearables (Oura/WHOOP/Apple Watch): ${BASE_URL}/voice-vs-wearables/
- Blog: ${BASE_URL}/blog/

## Blog posts

${postLinks()}

## Contact

- About the founder: ${BASE_URL}/about/
- TestFlight beta: https://testflight.apple.com/join/JBG3ANFF
- Discord community: https://discord.gg/SyZPw3cgG
`;
}

export function GET() {
  try {
    return new Response(buildLlmsTxt(), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  } catch (err) {
    console.error("[llms.txt] failed to build; serving static fallback", err);
    const body = [
      "# Ontor",
      "",
      "> Ontor (https://ontor.ai) is performance intelligence from your voice. On-device, speaker-gated.",
      "",
      `- Website: ${BASE_URL}/`,
      `- Pricing: ${BASE_URL}/pricing/`,
      `- FAQ: ${BASE_URL}/faq/`,
      `- Blog: ${BASE_URL}/blog/`,
      "",
    ].join("\n");
    return new Response(body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  }
}
