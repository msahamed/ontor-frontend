import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "../marketing-pages.module.css";

export const metadata: Metadata = {
  title: "How Ontor works",
  description: "See how Ontor reads changes in your voice, compares them with your usual range, and suggests a reset when a shift lasts.",
  alternates: { canonical: "/how-it-works/" },
  openGraph: {
    title: "How Ontor works",
    description: "See how Ontor reads changes in your voice, compares them with your usual range, and suggests a reset when a shift lasts.",
    url: "https://ontor.ai/how-it-works/",
  },
};

const markers = [
  ["Energy", "How activated your voice sounds through pace, effort, and flow.", 68, "More activated"],
  ["Stress", "How much tension and instability show in your voice.", 72, "More tension"],
  ["Fatigue", "How much tiredness shows through slower speech and longer pauses.", 29, "Less fatigue"],
  ["Confidence", "How fluent and steady your voice sounds.", 62, "More steady"],
  ["Speech clarity", "How crisp and distinct your speech sounds.", 66, "More crisp"],
  ["Vocal strain", "How hard your voice appears to be working.", 34, "Less strain"],
  ["Breathing", "How relaxed your breathing pattern appears between phrases.", 58, "More relaxed"],
] as const;

const waveHeights = [18, 34, 48, 25, 56, 42, 22, 38, 54, 29, 46, 20, 36, 52, 31, 44, 24, 50, 33, 19, 41, 55, 27, 38, 21, 47, 32, 52, 24, 39];

export default function HowItWorksPage() {
  return (
    <div className={styles.page}>
      <Nav />
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>How Ontor works</p>
          <h1>Your voice changes with your state. Ontor helps you see it.</h1>
          <p className={styles.lede}>
            Use Ontor while you speak. It compares your voice with your usual range, notices changes that last, and suggests a short reset when one may help.
          </p>
          <div className={styles.voicePanel} aria-label="Voice patterns Ontor can read while you speak">
            <div className={styles.voiceTop}>
              <strong>A natural speaking sample</strong>
              <span>Only the way you sound is used for these signals</span>
            </div>
            <div className={styles.wave} aria-hidden="true">
              {waveHeights.map((height, index) => <i key={index} style={{ height, animationDelay: `${index * -0.07}s` }} />)}
            </div>
            <div className={styles.waveLabels}>
              <span>Pace and pauses</span><span>Vocal effort</span><span>Voice stability</span><span>Breathing rhythm</span>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <p className={styles.eyebrow}>From speaking to a useful next step</p>
            <h2>One simple loop.</h2>
            <p>Ontor looks for a pattern across your speech. It does not react to every unusual second.</p>
          </div>
          <div className={styles.flowPanel} aria-label="How an Ontor session works">
            <div className={styles.flowStep}><span>Speak</span><strong>Talk naturally</strong></div>
            <i className={styles.flowArrow} aria-hidden="true">→</i>
            <div className={styles.flowStep}><span>Compare</span><strong>See your usual range</strong></div>
            <i className={styles.flowArrow} aria-hidden="true">→</i>
            <div className={styles.flowStep}><span>Notice</span><strong>Find a lasting shift</strong></div>
            <i className={styles.flowArrow} aria-hidden="true">→</i>
            <div className={styles.flowStep}><span>Reset</span><strong>Try something relevant</strong></div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <p className={styles.eyebrow}>The seven signals</p>
            <h2>What each signal means.</h2>
            <p>Each signal describes how your voice sounds compared with your own usual range.</p>
          </div>
          <div className={styles.markerInstrument}>
            {markers.map(([name, description, position, direction]) => (
              <div className={styles.markerRow} key={name}>
                <strong>{name}</strong>
                <p>{description}</p>
                <div className={styles.miniRead} aria-label={`${name}: example reading, ${direction.toLowerCase()}`}>
                  <span className={styles.miniTrack} aria-hidden="true">
                    <i className={styles.miniBand} />
                    <i className={styles.miniDot} style={{ left: `${position}%` }} />
                  </span>
                  <small>{direction}</small>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sciencePanel}>
            <div>
              <h3>Why voice can show a shift</h3>
              <p>The way you speak can change with activation, pressure, tiredness, vocal effort, and breathing. Ontor reads these acoustic patterns together instead of trying to judge you from a single feature.</p>
              <p>Ontor does not determine your mood or diagnose a health condition.</p>
            </div>
            <div className={styles.acousticList} aria-label="Examples of voice patterns Ontor considers">
              <div className={styles.acousticRow}><span>Pace</span><span className={styles.acousticBar}><i style={{ width: "72%" }} /></span></div>
              <div className={styles.acousticRow}><span>Pauses</span><span className={styles.acousticBar}><i style={{ width: "48%" }} /></span></div>
              <div className={styles.acousticRow}><span>Vocal effort</span><span className={styles.acousticBar}><i style={{ width: "63%" }} /></span></div>
              <div className={styles.acousticRow}><span>Stability</span><span className={styles.acousticBar}><i style={{ width: "56%" }} /></span></div>
              <div className={styles.acousticRow}><span>Breathing rhythm</span><span className={styles.acousticBar}><i style={{ width: "68%" }} /></span></div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.baselinePanel}>
            <h3>Your usual range is the reference.</h3>
            <p>Ontor learns what is typical for you over time. A higher or lower reading is not automatically good or bad. It shows what changed for you.</p>
            <div className={styles.baselineVisual} aria-label="Example reading inside a personal usual range">
              <i className={styles.baselineLine} aria-hidden="true" />
              <i className={styles.baselineRange} aria-hidden="true" />
              <i className={styles.baselineCenter} aria-hidden="true" />
              <i className={styles.baselinePoint} aria-hidden="true" />
              <div className={styles.baselineLabels}><span>Lower than usual</span><span>Your usual range</span><span>Higher than usual</span></div>
            </div>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>See what your voice shows.</h2>
          <p>Start with a conversation, presentation, work call, or voice check-in.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/login/?next=/dashboard/subscription/">Try Ontor free</Link>
            <Link className={styles.secondaryButton} href="/for-teams">See Ontor for teams</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
