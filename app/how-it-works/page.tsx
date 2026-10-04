import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "../marketing-pages.module.css";
import how from "./page.module.css";
import WorkdayDemo from "./WorkdayDemo";

const description = "How Ontor uses your voice and everyday computer interactions to show changes from your usual patterns and suggest useful breaks.";

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
          <h1>Understand your patterns while you work.</h1>
          <p className={styles.lede}>
            Your voice and the way you interact with your computer offer different views of your day.
            Ontor makes changes in those patterns visible, compares them with what is usual for you,
            and suggests a break or reset when one may help.
          </p>
          <div className={how.overview} aria-label="Two sources of readings in Ontor">
            <div><strong>While you speak</strong><p>Voice patterns → voice readings</p></div>
            <div><strong>While you use your computer</strong><p>Activity and pauses → work rhythm</p></div>
            <p className={how.overviewNote}>See both in Today, with your own history as the reference.</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <h2>Everyday interactions give you something to work with.</h2>
            <p>Ontor runs on your desktop as you go about your day. You can open your readings when you want a closer look.</p>
          </div>
          <div className={styles.ownershipPanel}>
            <div className={styles.ownershipRow}>
              <strong>Your voice</strong>
              <p>During a voice session, Ontor uses how your speech sounds to estimate signals such as stress, focus, and energy. Your voice samples help it recognize your speech. On desktop, sessions can start automatically when your microphone is in use, with status in the menu bar or system tray.</p>
            </div>
            <div className={styles.ownershipRow}>
              <strong>Your work rhythm</strong>
              <p>Basic information about typing, clicking, scrolling, and pauses helps describe the pace of your computer interactions. Ontor also shows how long you have worked without a break. It does not save what you type, which keys you press, or what you click on.</p>
            </div>
            <div className={styles.ownershipRow}>
              <strong>Days with few calls</strong>
              <p>Work rhythm and break reminders still work when there are no voice readings. Voice readings appear when you speak during a session; you do not need to record a check-in just to see your computer activity.</p>
            </div>
          </div>
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
            <p>A change is a reason to check in with yourself. Slower computer interactions can also reflect reading, thinking, or a different task.</p>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <h2>Open Today to see how your day is going.</h2>
            <p>Today brings your available readings together. You can review a change in your voice, look at your work rhythm, or simply see how long your current work stretch has lasted.</p>
          </div>
          <WorkdayDemo />
          <div className={styles.ownershipPanel}>
            <div className={styles.ownershipRow}><strong>Voice readings</strong><p>Follow each signal through the day and compare it with your usual range. Open a past session when you want more detail.</p></div>
            <div className={styles.ownershipRow}><strong>Time at your computer</strong><p>See your total activity today, longest uninterrupted stretch, and current stretch.</p></div>
            <div className={styles.ownershipRow}><strong>Work rhythm</strong><p>See when your pace is higher or lower than usual. This chart is currently labeled Interaction pace in the desktop product.</p></div>
          </div>
          <details className={how.markerDetails}>
            <summary>What do the seven voice signals mean?</summary>
            <p>These are estimates from your voice. They provide context for your own experience and do not diagnose a health condition.</p>
            <dl>{markers.map(([name, meaning]) => <div key={name}><dt>{name}</dt><dd>{meaning}</dd></div>)}</dl>
          </details>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <h2>A reminder gives you a next step.</h2>
            <p>For computer work, Ontor considers time without a break and whether your work rhythm has stayed below your usual level. A long uninterrupted stretch can also prompt a reminder. Voice sessions can suggest a short reset based on changes in your voice.</p>
          </div>
          <div className={styles.ownershipPanel}>
            <div className={styles.ownershipRow}><strong>Take a short break</strong><p>A desktop reminder can suggest a simple action, such as taking a five-minute break. You can move it, snooze it, or dismiss it.</p></div>
            <div className={styles.ownershipRow}><strong>Tell Ontor how you feel</strong><p>Answer “Are you feeling tired?” with Yes or No when you want to. Your answer helps personalize future work-rhythm readings as enough feedback becomes available.</p></div>
            <div className={styles.ownershipRow}><strong>See what helps</strong><p>Try a guided reset when it suits you. A voice check-in before and afterward lets you compare your readings.</p></div>
          </div>
          <p className={how.note}>You can feel well during a long work stretch. Your feedback matters even when it disagrees with a reminder.</p>
        </section>

        <section className={styles.cta}>
          <h2>Start with your next workday.</h2>
          <p>Available for Mac and Windows. Voice analysis needs microphone permission; basic computer activity does not need Accessibility access. Cloud backup is optional.</p>
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
