import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "../marketing-pages.module.css";
import how from "./page.module.css";
import WorkdayDemo from "./WorkdayDemo";
import { CompactPreview } from "../landing-preview/ProductPreviews";

const description = "See how Ontor provides live voice feedback during calls, suggests in-call cues, and lets you review readings or try a guided reset afterward.";

export const metadata: Metadata = {
  title: "How Ontor works",
  description,
  alternates: { canonical: "/how-it-works/" },
  openGraph: { title: "How Ontor works", description, url: "https://ontor.ai/how-it-works/" },
};

const markers = [
  ["Stress", "Patterns of tension and instability in your voice."],
  ["Focus", "An estimate of focus based on how your speech flows."],
  ["Energy", "How activated your voice sounds through pace and vocal effort."],
  ["Fatigue", "Voice patterns that may accompany tiredness."],
  ["Vocal strain", "How hard your voice appears to be working."],
  ["Speech clarity", "How crisp and distinct your speech sounds."],
  ["Hesitation", "Pauses and interruptions in the flow of your speech."],
] as const;

export default function HowItWorksPage() {
  return (
    <div className={styles.page}>
      <Nav />
      <main className={`${styles.main} ${how.main}`}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>How Ontor works</p>
          <h1>Voice feedback while the conversation is happening.</h1>
          <p className={styles.lede}>
            Ontor analyzes your voice during calls, compares readings with your own history, and offers small cues you can use in the conversation. Afterward, review your day or try a guided reset.
          </p>
          <div className={how.overview} aria-label="During and after a call">
            <div><strong>During your call</strong><p>See live voice feedback and a cue when one may help.</p></div>
            <div><strong>Afterward</strong><p>Review the session or try a guided reset.</p></div>
            <p className={how.overviewNote}>Readings are compared with your own history. You choose whether to act on a cue.</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <h2>Start your call with Ontor nearby.</h2>
            <p>On desktop, a voice session can start automatically when your microphone is in use. You can also start one manually. Its status appears in the menu bar or system tray.</p>
          </div>
          <div className={styles.ownershipPanel}>
            <div className={styles.ownershipRow}><strong>Your speech</strong><p>Ontor uses how your speech sounds to estimate signals such as stress, focus, and energy. Your voice samples help it recognize your speech.</p></div>
            <div className={styles.ownershipRow}><strong>Your live view</strong><p>Open the compact panel beside your call to see readings as you speak, or keep it closed and review the session later.</p></div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <h2>Notice a change while you speak.</h2>
            <p>Voice readings refresh after each 10 seconds of speech. When a reading moves outside your usual range, a small cue can suggest an action during the conversation, such as gently lengthening your next exhale.</p>
          </div>
          <div className={how.liveDemo}><CompactPreview /><p>Illustrative live feedback, not measured results.</p></div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <h2>Your usual pattern gives a reading context.</h2>
            <p>A slower afternoon may feel normal to you. Ontor compares readings with your own history so you can see what has changed relative to your usual patterns.</p>
          </div>
          <div className={styles.baselinePanel}>
            <h3>How to read the range</h3>
            <p>The shaded band shows your usual range. The dashed line marks your usual median, the middle of your past readings. A point outside the band means that reading is unusual for you.</p>
            <div className={how.range} role="img" aria-label="Illustration: a reading above the usual median, inside the shaded usual range">
              <span className={how.rangeBand} />
              <span className={how.rangeMedian} />
              <span className={how.rangePoint} />
            </div>
            <div className={how.rangeLabels}><span>Lower than usual</span><span>Your usual range</span><span>Higher than usual</span></div>
            <p>A change is a reason to check in with yourself. A voice reading may not match how you feel.</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <h2>Take a moment before the next conversation.</h2>
            <p>Choose a guided reset when it suits you. Voice check-ins before and afterward let you compare readings and see what changed.</p>
          </div>
          <div className={styles.ownershipPanel}>
            <div className={styles.ownershipRow}><strong>Try a reset</strong><p>A short guided breathing exercise gives you an action to try between calls. You decide when to start.</p></div>
            <div className={styles.ownershipRow}><strong>Compare readings</strong><p>A change in your voice readings is context to consider alongside how you feel. It does not establish that an exercise caused the change.</p></div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <h2>Review your calls in the context of your day.</h2>
            <p>Choose a voice marker in Today to see its daily trend against your usual range. Open a past session for more detail.</p>
          </div>
          <WorkdayDemo />
          <details className={how.markerDetails}>
            <summary>What do the seven voice signals mean?</summary>
            <p>These are estimates from your voice. They provide context for your own experience and do not diagnose a health condition.</p>
            <dl>{markers.map(([name, meaning]) => <div key={name}><dt>{name}</dt><dd>{meaning}</dd></div>)}</dl>
          </details>
          <details className={how.markerDetails}>
            <summary>What about computer activity and break reminders?</summary>
            <p>Today also shows total activity time, your longest uninterrupted work stretch, and your current stretch. Basic activity counts and pauses provide timing context. Ontor does not save typed text, key identities, or click targets.</p>
            <p>A long work stretch can prompt a break reminder even on days with few calls. You can move, snooze, or dismiss it. Activity timing does not infer tiredness, and it does not require microphone permission or Accessibility access.</p>
          </details>
        </section>

        <section className={styles.cta}>
          <h2>Try it during your next call.</h2>
          <p>Available for Mac and Windows. Allow microphone access for voice analysis, then start a session. Analysis runs on-device; cloud backup is optional.</p>
          <div className={styles.actions}>
            <Link className={styles.primaryButton} href="/install">Try Ontor free</Link>
            <Link className={styles.secondaryButton} href="/privacy">How your data is used</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
