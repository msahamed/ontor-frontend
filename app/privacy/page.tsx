import type { Metadata } from "next";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "./privacy.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy — Ontor",
  description: "How Ontor uses voice, basic computer interactions, and feedback, what is saved, and how optional cloud sync works.",
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
        <p className={styles.updated}>Last updated: October 3, 2026</p>
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
            <li><strong>Your voice.</strong> Audio captured during a check-in or voice session, used to estimate signals such as stress, focus, and energy. Desktop voice sessions can start automatically when your microphone is in use.</li>
            <li><strong>Recognizing your voice.</strong> Ontor uses your voice samples to help distinguish your speech from other speakers and select speech for your readings. This recognition may not always be correct.</li>
            <li><strong>Your results.</strong> The signals Ontor derives, such as energy, stress, focus, and fatigue, plus your personal history, used to compare each reading against your own baseline.</li>
            <li><strong>Your email address.</strong> If you provide one during setup, used to identify your account, send you a sign-in code, and restore your history on a new device.</li>
            <li><strong>How you use your computer.</strong> While Ontor is running on Mac or Windows, it uses basic information about how often you type, click, or scroll, and when you are active or take a pause. This helps show your work rhythm and suggest when a break may help. It does not save what you type, which keys you press, or what you click on.</li>
            <li><strong>Your feedback and reminders.</strong> We save when a reminder appears, whether you dismiss or snooze it, and any answer you give about feeling tired. We use this information, together with your recent readings, to personalize your experience and assess how useful the reminders are.</li>
            <li><strong>Product usage and reliability data.</strong> See section 5.</li>
          </ul></section>

          <section className={styles.policySection} id="analysis"><p className={styles.sectionNumber}>02</p><h2>On-device analysis</h2><p>Your voice readings are calculated on your device. Your results and work patterns are compared with your own history to make the readings relevant to you. Cloud backup is optional, as described below.</p></section>
          <section className={styles.policySection} id="sync"><p className={styles.sectionNumber}>03</p><h2>Optional sync</h2><p>Sync is off by default. If you turn it on in Settings, your results, history, and voice recordings from your check-ins are uploaded to and stored on Ontor&apos;s servers, so your history can be restored on another device. On desktop, work rhythm and daily activity summaries also sync, along with reminder history, your feedback, and personalization data used to adapt your readings. These summaries do not contain typed text, key identities, or click targets. You can turn sync off in Settings to stop further backups. Usage and reliability data are handled separately, as described in section 5.</p></section>
          <section className={styles.policySection} id="storage"><p className={styles.sectionNumber}>04</p><h2>Data storage</h2><p>Data on your device is kept in Ontor&apos;s private storage. If you enable sync, the synced portion of your data is stored on Ontor&apos;s servers.</p><p>Voice clips are kept on your device for 180 days. With sync enabled, clips awaiting upload are retained until they have been backed up. Cloud recordings have no automatic expiry and remain until deleted. Local audio cleanup does not delete your markers or history.</p><p>Desktop updates download automatically and install when no call or reset is active.</p></section>
          <section className={styles.policySection} id="analytics"><p className={styles.sectionNumber}>05</p><h2>Analytics and tracking</h2><p>Ontor sends usage and reliability data, such as which screens you open, when onboarding or a check-in completes, and crash reports, to Ontor&apos;s servers. This is independent of sync and happens whether or not sync is on.</p><p>We send a small set of setup events, including email verification, onboarding completion, trial start, and first check-in, to Google Analytics and FullStory. These events use a randomly generated user identifier. They do not include your email address, voice recordings, transcripts, or check-in results.</p><p>On ontor.ai, Google Analytics measures page visits and download clicks. FullStory records website interactions and session replays so we can see where the install process is confusing. FullStory does not record your screens or microphone inside the installed product.</p><p>Ontor does not use advertising identifiers or advertising SDKs, and does not sell your data.</p></section>
          <section className={styles.policySection} id="microphone"><p className={styles.sectionNumber}>06</p><h2>Microphone</h2><p>Ontor needs microphone permission for voice analysis. On desktop, a session can start automatically when your microphone is in use; its status appears in the menu bar or system tray. You can also start a session manually. Basic computer activity readings do not need microphone permission or Accessibility access.</p></section>
          <section className={styles.policySection} id="children"><p className={styles.sectionNumber}>07</p><h2>Children&apos;s privacy</h2><p>Ontor is not directed at children under 13. We do not knowingly collect personal information from children.</p></section>
          <section className={styles.policySection} id="rights"><p className={styles.sectionNumber}>08</p><h2>Your rights</h2><ul>
            <li><strong>Delete any check-in.</strong> Delete an individual check-in directly in Ontor. It is removed from your device, and if sync is on, the recording, transcript, and derived signals for that check-in are cleared from your synced history too.</li>
            <li><strong>Turn off sync.</strong> Stop further backups in Settings. This does not delete data already synced, and it does not stop the usage and reliability reporting described above.</li>
            <li><strong>Delete local data.</strong> Removing the desktop program may leave saved data on your computer. Use the account deletion option in Settings to remove your account data, or contact us for help clearing local files.</li>
            <li><strong>Delete your account entirely.</strong> Use Delete account in Settings to delete your account and its saved data, including synced recordings and personalization data. You can also contact us at the address below for help.</li>
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
