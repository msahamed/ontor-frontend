import Nav from "../components/Nav";
import Footer from "../components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

// ── FAQ: drives both the visible page and the FAQPage schema (GEO).
// Answer-shaped, definitional text so AI answer engines can quote it.
const FAQ: { q: string; a: string }[] = [
  {
    "q": "What is Ontor?",
    "a": "Ontor helps you understand how your workday is going. It shows changes in your voice and work rhythm compared with what is usual for you, and suggests a short reset or break when one may help."
  },
  {
    "q": "What can I see in Today?",
    "a": "Today brings together your voice readings, time spent at your computer, longest work stretch, current stretch, and work rhythm. You can see how your day has changed and compare readings with your usual range."
  },
  {
    "q": "What does work rhythm mean?",
    "a": "Work rhythm describes the pace of your interactions with your computer, using basic activity counts and timing. It appears as Interaction pace in the desktop product. A lower reading means a slower pace compared with your usual pattern. It does not by itself mean you are tired."
  },
  {
    "q": "Does Ontor help when I am not speaking?",
    "a": "Yes. On desktop, your work rhythm and time without a break can inform break reminders even when there are no voice readings. Voice readings appear when you speak during a session."
  },
  {
    "q": "Do I have to start every voice session?",
    "a": "On desktop, Ontor can start a voice session automatically when your microphone is in use. Automatic sessions stay in the menu bar, and you can open the live view when you want to see your readings. You can also start a session manually. Microphone permission is required for voice analysis."
  },
  {
    "q": "What voice signals can I see?",
    "a": "Stress, Focus, Energy, Fatigue, Vocal strain, Speech clarity, and Hesitation. These are estimates based on patterns in your voice, compared with your personal reference. They are not a diagnosis or a direct measure of how you feel."
  },
  {
    "q": "Why does Ontor suggest a break?",
    "a": "Ontor considers how long you have worked without a break and whether your work rhythm has stayed below your usual level. A long uninterrupted stretch can also prompt a reminder. You can snooze or dismiss it, and answer “Are you feeling tired?” to help personalize future readings."
  },
  {
    "q": "What information does Ontor use from my computer?",
    "a": "While Ontor is running, it uses basic information such as how often you type, click, or scroll, and the timing of activity and pauses. This helps show your work rhythm and suggest breaks. It does not save what you type, which keys you press, or what you click on. Desktop activity does not require Accessibility access."
  },
  {
    "q": "What is saved or synced?",
    "a": "Your readings, activity summaries, and feedback are saved on your device. If you turn on cloud sync, Ontor also backs up your history, check-in recordings, and information used to personalize your readings. Product usage and reliability data are handled separately, as explained in the privacy policy."
  },
  {
    "q": "Can my team see my personal readings?",
    "a": "Personal sessions and individual readings stay with you. Team views show aggregate patterns for discussions about workload and support. Contact us to discuss what is included in a team pilot."
  },
  {
    "q": "Is Ontor a medical device?",
    "a": "No. Ontor is a general wellness and performance tool. It does not diagnose or treat health conditions. Your own experience matters, and a reading or reminder may not match how you feel."
  },
  {
    "q": "What does Ontor cost and where can I use it?",
    "a": "Ontor is available for Mac and Windows. Start with a 14-day free trial, with no card required. After the trial, choose $20 a month or $168 a year. Team pilots are priced separately."
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
  "Answers about Ontor for Mac and Windows: voice readings, work rhythm, break reminders, privacy, and pricing.";

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
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Ontor voice readings and work rhythm",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions — Ontor",
    description: PAGE_DESCRIPTION,
    images: ["/og.png"],
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
              Voice readings, work rhythm, break reminders, and your data.
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
                See how your workday is going.
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
