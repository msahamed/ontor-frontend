import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — Ontor",
  description: "Ontor’s privacy policy explains how voice analysis, optional sync, and product usage data are handled.",
};

const sections = [["#information", "Information we process"], ["#analysis", "On-device analysis"], ["#sync", "Optional sync"], ["#storage", "Data storage"], ["#analytics", "Analytics and tracking"], ["#rights", "Your rights"], ["#contact", "Contact"]];

export default function PrivacyPage() {
  return (<>
    <Nav />
    <main>
      <header className={styles.hero}><div className={styles.heroInner}>
        <p className={styles.eyebrow}>Privacy policy</p>
        <h1>How Ontor handles your data.</h1>
        <p className={styles.intro}>This policy explains what Ontor processes, when information is uploaded, and what you can control.</p>
        <p className={styles.updated}>Last updated: August 31, 2026</p>
      </div></header>
      <div className={styles.pageShell}>
        <aside className={styles.contents} aria-label="On this page"><p className={styles.contentsLabel}>On this page</p><nav>{sections.map(([href, label]) => <a key={href} href={href}>{label}</a>)}</nav></aside>
        <article className={styles.policy}>
          <section className={styles.summary} aria-labelledby="summary-title"><p className={styles.summaryLabel} id="summary-title">At a glance</p><div className={styles.summaryRows}>
            <div><strong>Voice analysis</strong><span>Runs on your device by default.</span></div>
            <div><strong>Sync</strong><span>Off until you turn it on.</span></div>
            <div><strong>Your controls</strong><span>Delete check-ins, turn sync off, or delete your account entirely.</span></div>
          </div></section>

          <section className={styles.policySection} id="information"><p className={styles.sectionNumber}>01</p><h2>Information we process</h2><ul>
            <li><strong>Your voice.</strong> Audio captured while you record a check-in or run a session, analyzed on your device to estimate your nervous-system state.</li>
            <li><strong>Only you.</strong> Ontor is speaker-gated. It analyzes your voice only. When someone else is speaking, Ontor does not record or analyze them.</li>
            <li><strong>Your results.</strong> The signals Ontor derives, such as energy, stress, confidence, and fatigue, plus your personal history, used to compare each reading against your own baseline.</li>
            <li><strong>Your email address.</strong> If you provide one during setup, used to identify your account, send you a sign-in code, and restore your history on a new device.</li>
            <li><strong>Product usage and reliability data.</strong> See section 5.</li>
          </ul></section>

          <section className={styles.policySection} id="analysis"><p className={styles.sectionNumber}>02</p><h2>On-device analysis</h2><p>The voice analysis runs entirely on your device using an on-device model. By default, your audio and results are not sent to Ontor&apos;s servers or any third party.</p></section>
          <section className={styles.policySection} id="sync"><p className={styles.sectionNumber}>03</p><h2>Optional sync</h2><p>Sync is off by default. If you turn it on in Settings, your results and history and the voice recordings from your check-ins are uploaded to and stored on Ontor&apos;s servers, so your history can be restored on another device. If computer activity tracking is also on, daily activity and interaction pace chart summaries sync to your web dashboard. These summaries contain no keys, text, or click targets. You can turn sync off at any time. While it is off, nothing from your check-ins or computer activity is uploaded.</p></section>
          <section className={styles.policySection} id="storage"><p className={styles.sectionNumber}>04</p><h2>Data storage</h2><p>Data on your device is kept in Ontor&apos;s private storage. If you enable sync, the synced portion of your data is stored on Ontor&apos;s servers.</p></section>
          <section className={styles.policySection} id="analytics"><p className={styles.sectionNumber}>05</p><h2>Analytics and tracking</h2><p>Ontor sends usage and reliability data, such as which screens you open, when onboarding or a check-in completes, and crash reports, to Ontor&apos;s servers. This is independent of sync and happens whether or not sync is on.</p><p>We send a small set of setup events, including email verification, onboarding completion, trial start, and first check-in, to Google Analytics and FullStory. These events use a randomly generated user identifier. They do not include your email address, voice recordings, transcripts, or check-in results.</p><p>On ontor.ai, Google Analytics measures page visits and download clicks. FullStory records website interactions and session replays so we can see where the install process is confusing. FullStory does not record your screens or microphone inside the installed product.</p><p>Ontor does not use advertising identifiers or advertising SDKs, and does not sell your data.</p></section>
          <section className={styles.policySection} id="microphone"><p className={styles.sectionNumber}>06</p><h2>Microphone</h2><p>Ontor requests microphone access solely to capture your voice for analysis during a check-in or session.</p></section>
          <section className={styles.policySection} id="children"><p className={styles.sectionNumber}>07</p><h2>Children&apos;s privacy</h2><p>Ontor is not directed at children under 13. We do not knowingly collect personal information from children.</p></section>
          <section className={styles.policySection} id="rights"><p className={styles.sectionNumber}>08</p><h2>Your rights</h2><ul>
            <li><strong>Delete any check-in.</strong> Delete an individual check-in directly in Ontor. It is removed from your device, and if sync is on, the recording, transcript, and derived signals for that check-in are cleared from your synced history too.</li>
            <li><strong>Turn off sync.</strong> Stop syncing at any time in Settings. Nothing further is uploaded from that point.</li>
            <li><strong>Delete local data.</strong> Uninstalling Ontor removes everything stored on that device.</li>
            <li><strong>Delete your account entirely.</strong> Email us at the address in section 10 and we will delete your account and everything we hold for it, including any backed-up recordings.</li>
            <li><strong>Access.</strong> Request a copy of the data we hold for your account by emailing the same address.</li>
          </ul></section>
          <section className={styles.policySection} id="changes"><p className={styles.sectionNumber}>09</p><h2>Changes to this policy</h2><p>We may update this policy as features change. Material changes will be posted here with a new &quot;Last updated&quot; date.</p></section>
          <section className={styles.policySection} id="contact"><p className={styles.sectionNumber}>10</p><h2>Contact</h2><p>Questions about this policy? Contact us at <a href="mailto:sabber@ontor.ai">sabber@ontor.ai</a>.</p></section>
        </article>
      </div>
    </main>
    <Footer />
  </>);
}
