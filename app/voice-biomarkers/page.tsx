import ContentPage from "../components/ContentPage";
import type { Metadata } from "next";

const DESCRIPTION =
  "A voice biomarker is a measurable feature of how you sound — pitch, loudness, pace, pauses, vocal clarity — that reflects your physiological or psychological state. Here's how voice biomarkers work, what they can read, and how Ontor uses them on-device.";

export const metadata: Metadata = {
  title: "What is a voice biomarker? — Ontor",
  description: DESCRIPTION,
  alternates: { canonical: "/voice-biomarkers" },
  openGraph: {
    title: "What is a voice biomarker?",
    description: DESCRIPTION,
    url: "https://ontor.ai/voice-biomarkers",
    siteName: "Ontor",
    type: "article",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Ontor" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "What is a voice biomarker?",
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

const FAQ = [
  {
    q: "What is a voice biomarker?",
    a: "A voice biomarker is a measurable acoustic feature of how you sound — such as pitch, loudness, speaking rate, pauses, and vocal clarity — that correlates with a physiological or psychological state like stress, fatigue, or energy. It reflects how you say something, not what you say.",
  },
  {
    q: "Are voice biomarkers accurate?",
    a: "Individual acoustic markers are well-established in peer-reviewed speech science — for example, raised pitch and reduced vocal clarity under stress, or slower rate and more pausing under fatigue. Accuracy is strongest as a relative, within-person read against your own baseline rather than a clinical or cross-person diagnosis.",
  },
  {
    q: "Can a voice biomarker app run without sending my audio to the cloud?",
    a: "Yes. Ontor extracts the acoustic features on your phone, so the analysis needs no upload at all — cloud backup is an optional setting that is off by default. Many clinical voice-biomarker systems must upload your audio before they can analyze it; on-device analysis is what makes a private, consumer version possible.",
  },
];

const ARTICLE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What is a voice biomarker?",
  description: DESCRIPTION,
  about: "Voice biomarkers",
  author: { "@type": "Organization", name: "Ontor", url: "https://ontor.ai" },
  publisher: { "@type": "Organization", name: "Ontor", url: "https://ontor.ai" },
  mainEntityOfPage: "https://ontor.ai/voice-biomarkers",
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export default function VoiceBiomarkersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ARTICLE_JSONLD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <ContentPage
        eyebrow="Explainer"
        title="What is a voice biomarker?"
        lede="The science behind reading your nervous-system state from how you sound — and how Ontor turns it into a natural-voice based analysis."
      >
        <p className="lead">
          A voice biomarker is a measurable feature of how you sound — pitch,
          loudness, pace, pauses, vocal clarity — that reflects a physiological
          or psychological state such as stress, fatigue, or energy. It
          captures <strong>how</strong> you say something, not the words you
          say.
        </p>

        <h2>How voice biomarkers work</h2>
        <p>
          When your nervous system shifts, your voice shifts with it — usually
          before you consciously notice. Stress tends to raise pitch and reduce
          vocal clarity; fatigue tends to slow your rate, flatten your tone, and
          add pauses. These changes are subtle and hard to hear yourself, but
          they are measurable. A voice biomarker system extracts those acoustic
          features from a short speech sample and maps them to a state.
        </p>
        <p>
          Crucially, the strongest reads are <strong>relative</strong>:
          comparing today&apos;s voice against your own recent baseline (&quot;higher
          or lower than your usual&quot;) is far more reliable than comparing you
          against the general population.
        </p>

        <h2>What Ontor reads from your voice</h2>
        <p>
          Ontor computes seven voice markers from a few seconds of unscripted
          speech: <strong>stress, focus, energy, fatigue, vocal strain,
          speech clarity, and hesitation</strong>. Each is a
          transparent, deterministic formula — a weighted blend of acoustic
          features compared against your roughly 30-day rolling baseline. It is
          not a black-box model guessing a number.
        </p>

        <h2>Is it grounded in real science?</h2>
        <p>
          Yes. The feature-to-state mappings come from decades of peer-reviewed
          speech research rather than being invented. Ontor composes
          validated markers — for example, pitch and vocal-clarity changes under
          stress, and rate, tone, and pausing changes under fatigue. The honest
          limits matter too: phone-microphone noise means values are best read
          day-over-day within one person, not across different people, and the
          weights that combine markers are research-grounded priors still being
          calibrated against ground truth.
        </p>

        <h2>Why on-device matters</h2>
        <p>
          Most established voice-biomarker technology is clinical and
          cloud-based — your audio has to be uploaded before it can be analyzed
          at all. Ontor inverts that: the features are extracted on your phone,
          so the analysis works with nothing leaving the device. Backing your
          history up to the cloud is an optional setting, off by default, rather
          than a precondition for using the product. That is what makes a
          consumer voice-biomarker tool possible in the first place.
        </p>

        <h2>Voice biomarkers vs. wearables</h2>
        <p>
          Wearables like Oura and WHOOP measure physiology (heart rate, HRV,
          sleep) and infer stress from it. Voice biomarkers read psychological
          and nervous-system state — confidence, vocal strain, expressiveness —
          that a wrist sensor cannot detect. The two are complementary. We go
          deeper on this in our{" "}
          <a href="/voice-vs-wearables">voice vs. wearables comparison</a>.
        </p>

        <p className="src">
          Evidence base draws on established speech-science research, including
          work by Scherer; Juslin &amp; Laukka (vocal emotion); Krajewski
          (fatigue in speech); and Pennebaker (LIWC linguistic analysis).
        </p>
      </ContentPage>
    </>
  );
}
