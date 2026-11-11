import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

// ── FAQ: drives both the visible page and the FAQPage schema (GEO).
// Answer-shaped, definitional text so AI answer engines can quote it.
const FAQ: { q: string; a: string }[] = [
  {
    "q": "What is Ontor?",
    "a": "Ontor provides private, real-time voice feedback while you speak. It compares voice markers with your usual range and offers cues during demanding conversations. Afterward, you can review the session or try a guided reset."
  },
  {
    "q": "Do I have to start every voice session?",
    "a": "On desktop, Ontor can start a voice session automatically when your microphone is in use. You can open the live view or start a session manually. Microphone permission is required."
  },
  {
    "q": "What voice markers can I see?",
    "a": "Stress, Focus, Energy, Fatigue, Vocal strain, Speech clarity, and Hesitation. These are voice-based estimates compared with your personal reference. They are not a diagnosis or a direct measure of how you feel."
  },
  {
    "q": "Why does Ontor suggest a reset or break?",
    "a": "Changes in voice markers can prompt a small cue during a call or a suggested reset. A long uninterrupted computer-work stretch can also prompt a break reminder. You choose whether to act on it."
  },
  {
    "q": "What can I see in Today?",
    "a": "Your total activity time, longest work stretch, current stretch, and a combined computer-and-voice timeline. Select a voice marker to see its daily score, direction, and readings against your usual range."
  },
  {
    "q": "Does Ontor analyze my state from typing or mouse movements?",
    "a": "No. Voice markers come from your speech. Basic computer activity provides timing and work-stretch context, and can support long-stretch break reminders."
  },
  {
    "q": "What does Fatigue mean here?",
    "a": "Fatigue is a voice marker based on speech patterns. It is separate from computer activity timing. Ontor does not infer tiredness from your typing or mouse activity."
  },
  {
    "q": "What information does Ontor use from my computer?",
    "a": "Ontor uses basic activity counts and timing to show activity periods and work stretches. It does not save typed text, key identities, or click targets. Basic activity does not require Accessibility access."
  },
  {
    "q": "What is saved or synced?",
    "a": "Readings and activity history are saved on your device. Optional cloud sync backs up supported history and check-in recordings. Usage and reliability data are handled separately, as explained in the privacy policy."
  },
  {
    "q": "Can my team see my personal readings?",
    "a": "Team pilots focus on aggregate patterns. Individual sharing is controlled separately. Contact us to discuss access and sharing for your pilot."
  },
  {
    "q": "Is Ontor a medical device?",
    "a": "No. Ontor is a wellness and performance tool. It does not diagnose or treat health conditions. Your own experience matters, and a reading or reminder may not match how you feel."
  },
  {
    "q": "What does Ontor cost and where can I use it?",
    "a": "Ontor is available for Mac and Windows. Start with a 14-day free trial, with no card required. After the trial, choose $10 a month or $100 a year. Team pilots are priced separately."
  }
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

const PAGE_DESCRIPTION =
  "Answers about live voice feedback, call sessions, guided resets, privacy, and pricing for Ontor on Mac and Windows.";

export const metadata: Metadata = {
  title: "FAQ — Ontor",
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Frequently Asked Questions — Ontor",
    description: PAGE_DESCRIPTION,
    url: "https://ontor.ai/faq",
    siteName: "Ontor",
    type: "website",
    images: [
      {
        url: "/og-voice.png",
        width: 1200,
        height: 630,
        alt: "Ontor: Real-time voice feedback while you speak",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions — Ontor",
    description: PAGE_DESCRIPTION,
    images: ["/og-voice.png"],
  },
};

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
      />
      <Nav />

      <main id="top" className="flex-1">
        <section className="faq-hero">
          <div className="faq-wrap">
            <span className="faq-eyebrow">Questions</span>
            <h1 className="font-serif-display">
              Frequently asked questions.
            </h1>
            <p className="faq-lede">
              Live voice feedback, cues, guided resets, and your data.
            </p>
          </div>
        </section>

        <section className="faq-body">
          <div className="faq-wrap">
            <div className="faq-list">
              {FAQ.map(({ q, a }) => (
                <details className="faq-item" key={q}>
                  <summary>
                    <span>{q}</span>
                    <svg
                      className="faq-chev"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>

            <div className="faq-cta">
              <h2 className="font-serif-display">
                Try voice feedback during your next call.
              </h2>
              <Link href="/install" className="faq-cta-btn">
                Try Ontor free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <style>{FAQ_CSS}</style>
    </>
  );
}

const FAQ_CSS = `
.faq-wrap { max-width: 820px; margin: 0 auto; padding: 0 32px; }

.faq-hero {
  background: var(--paper);
  color: var(--ink); padding: 80px 0 64px; text-align: left;
}
.faq-eyebrow {
  font-size: 12.5px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--teal); display: inline-flex; align-items: center; gap: 9px;
}
.faq-eyebrow::before {
  content: ""; width: 7px; height: 7px; border-radius: 50%; background: var(--amber);
}
.faq-hero h1 {
  font-size: clamp(34px, 4.6vw, 50px); line-height: 1.06; margin: 18px 0 0;
  color: var(--ink); letter-spacing: -0.02em;
}
.faq-lede {
  margin: 18px 0 0; max-width: 560px; font-size: 18px; line-height: 1.6; color: var(--ink-soft);
}

.faq-body { background: var(--paper-3); padding: 64px 0 80px; }
.faq-list { margin: 0 auto; }
.faq-item {
  border: 1px solid var(--line); border-radius: 14px;
  background: #fff; padding: 0 22px; margin-bottom: 12px;
  transition: border-color .2s, box-shadow .2s;
}
.faq-item:hover { border-color: var(--line-strong); }
.faq-item[open] { box-shadow: 0 10px 28px rgba(27,26,23,.06); }
.faq-item summary {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  cursor: pointer; list-style: none; padding: 20px 0;
  font-size: 17px; font-weight: 600; color: var(--ink); letter-spacing: -0.01em;
}
.faq-item summary::-webkit-details-marker { display: none; }
.faq-chev { color: var(--teal); flex: none; transition: transform .25s ease; }
.faq-item[open] .faq-chev { transform: rotate(180deg); }
.faq-item p {
  margin: 0; padding: 0 0 22px; font-size: 15.5px; line-height: 1.62; color: var(--ink-soft);
  max-width: 64ch;
}

.faq-cta { text-align: left; margin-top: 56px; }
.faq-cta h2 { font-size: clamp(24px, 3vw, 32px); line-height: 1.12; margin: 0 0 22px; max-width: 560px; }
.faq-cta-btn {
  display: inline-block; background: var(--teal); color: #fff; text-decoration: none;
  font-weight: 600; font-size: 15px; border-radius: 12px; padding: 12px 22px;
  box-shadow: 0 6px 18px rgba(15,118,110,.22); transition: transform .15s, box-shadow .2s;
}
.faq-cta-btn:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(15,118,110,.28); }

.faq-foot { border-top: 1px solid var(--line); padding: 32px 0 48px; background: var(--paper); }
.faq-foot-inner {
  display: flex; align-items: center; justify-content: space-between; gap: 18px; flex-wrap: wrap;
}
.faq-foot-brand {
  display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; color: var(--ink);
}
.faq-foot-links { display: flex; gap: 22px; font-size: 14px; color: var(--ink-soft); }
.faq-foot-links a { color: inherit; text-decoration: none; transition: color .15s; }
.faq-foot-links a:hover { color: var(--ink); }

@media (max-width: 560px) {
  .faq-wrap { padding: 0 20px; }
  .faq-hero { padding: 60px 0 48px; }
}
`;
