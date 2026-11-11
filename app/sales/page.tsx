import type { Metadata } from "next";
import Image from "next/image";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "../marketing-pages.module.css";
import salesStyles from "./sales.module.css";
import { CompactPreview } from "../landing-preview/ProductPreviews";
import { SOCIAL_IMAGE } from "../site-metadata";

const PILOT_URL = "https://calendly.com/sabber-ahamed/30min";

export const metadata: Metadata = {
  title: "Ontor for sales teams | Real-time voice feedback during calls",
  description:
    "Give reps private voice feedback and cues during demanding sales calls, with guided resets afterward and aggregate context for team pilots.",
  alternates: { canonical: "/sales" },
  openGraph: {
    title: "Ontor for sales teams",
    description:
      "Support reps during demanding sales calls with private voice feedback, in-call cues, and guided resets afterward.",
    url: "https://ontor.ai/sales",
    images: [
      {
        url: SOCIAL_IMAGE.url,
        width: 1200,
        height: 630,
        alt: "Ontor: Real-time voice feedback while you speak",
      },
    ],
  },
  twitter: {
    title: "Ontor for sales teams",
    description:
      "Support reps during demanding sales calls with private voice feedback, in-call cues, and guided resets afterward.",
    images: [SOCIAL_IMAGE.url],
  },
};

const signalRows = [
  {
    name: "Stress",
    meaning: "Higher means more pressure",
    status: "Above usual more often",
    points: [0, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1],
  },
  {
    name: "Vocal strain",
    meaning: "Higher means more strained",
    status: "Rises in late call blocks",
    points: [0, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1],
  },
  {
    name: "Speech clarity",
    meaning: "Higher means clearer",
    status: "Near the usual range",
    points: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
];

export default function SalesPage() {
  return (
    <div className={styles.page}>
      <Nav />
      <main className={salesStyles.main}>
        <section className={salesStyles.hero}>
          <h1>Private voice feedback for demanding sales calls.</h1>
          <p>
            Ontor shows reps changes in their voice while they speak, with private
            cues when a reset may help. Review the session or try a guided
            exercise afterward.
          </p>
          <a className={styles.primaryButton} href={PILOT_URL} target="_blank" rel="noreferrer">
            Talk through a sales-team pilot
          </a>
        </section>

        <section className={salesStyles.productSection}>
          <div className={salesStyles.sectionCopy}>
            <h2>A private cue while the conversation is happening.</h2>
            <p>
              Ontor compares voice readings with the rep&rsquo;s usual range. A
              discreet cue suggests an action they can take while speaking.
              Between calls, they can try a guided reset and compare readings
              before and afterward.
            </p>
          </div>
          <div style={{ maxWidth: 520, margin: "0 auto 32px" }}>
            <CompactPreview />
            <p style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 12 }}>Illustrative live feedback, not measured results.</p>
          </div>
          <figure className={salesStyles.productShot}>
            <Image
              src="/landing/post-call-reset.png"
              alt="Ontor session view showing a completed reset and stress, energy, and fatigue during a call"
              fill
              sizes="(max-width: 980px) 100vw, 920px"
              priority
            />
          </figure>
        </section>

        <section className={salesStyles.managerSection}>
          <div className={salesStyles.sectionCopy}>
            <h2>The manager sees whether the same change is showing up across the team.</h2>
            <p>
              This is an illustrative aggregate view. It uses the same markers
              and usual-range comparison as the rep&rsquo;s view, but removes the
              individual readings.
            </p>
          </div>

          <div className={salesStyles.teamView} aria-label="Illustrative aggregate view of a sales team's voice markers over 30 days">
            <header>
              <div><strong>Sales team</strong><span>Last 30 days</span></div>
              <p>12 reps contributing</p>
            </header>
            <div className={salesStyles.signalList}>
              {signalRows.map((signal) => (
                <div className={salesStyles.signalRow} key={signal.name}>
                  <div className={salesStyles.signalName}>
                    <strong>{signal.name}</strong>
                    <span>{signal.meaning}</span>
                  </div>
                  <div className={salesStyles.dotLine} aria-hidden="true">
                    <i className={salesStyles.usualBand} />
                    {signal.points.map((warm, index) => (
                      <b
                        className={warm ? salesStyles.warmDot : undefined}
                        key={index}
                        style={{ left: `${4 + index * 8.25}%`, top: `${warm ? 18 + (index % 3) * 5 : 36 + (index % 2) * 5}%` }}
                      />
                    ))}
                  </div>
                  <span className={signal.status === "Near the usual range" ? salesStyles.steadyStatus : salesStyles.attentionStatus}>
                    {signal.status}
                  </span>
                </div>
              ))}
            </div>
            <div className={salesStyles.managerRead}>
              <strong>What the manager can check</strong>
              <p>
                Stress and vocal strain are showing up more often in late call
                blocks, while speech clarity is steady. Review the afternoon call
                load before assigning another talk-track drill.
              </p>
            </div>
            <footer>Team totals only. Individual readings stay with the rep.</footer>
          </div>
        </section>

        <section className={salesStyles.turnoverSection}>
          <div className={salesStyles.sectionCopy}>
            <h2>Demanding calls leave little room for missed details.</h2>
            <p>
              A rushed response or missed question can make a customer conversation
              harder. We are testing whether timely voice feedback helps reps
              recognize a change and respond during the call.
            </p>
          </div>
          <div className={salesStyles.turnoverPath} aria-label="Proposed use of Ontor during and after a sales call">
            <div><span>During a call</span><strong>See voice markers against your usual range</strong></div>
            <div><span>A reading shifts</span><strong>Consider a discreet cue while you speak</strong></div>
            <div><span>Between calls</span><strong>Try a guided reset when it may help</strong></div>
            <div><span>Afterward</span><strong>Review the session and compare readings</strong></div>
          </div>
          <p className={salesStyles.limitNote}>
            Voice readings provide context for the rep. They do not establish
            call quality or predict whether a deal will close. Business impact
            needs to be evaluated in pilots.
          </p>
        </section>

        <section className={salesStyles.pilotSection}>
          <h2>Test it against the numbers you already use.</h2>
          <p>
            Start with one sales team and an agreed success measure. Evaluate
            whether reps find the live cues useful and keep using them, then
            examine qualified meetings or conversion alongside that usage.
            Improvements in sales outcomes have not yet been established.
          </p>
          <a className={styles.primaryButton} href={PILOT_URL} target="_blank" rel="noreferrer">
            Talk through the pilot
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
