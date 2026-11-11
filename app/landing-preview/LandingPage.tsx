import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import HeroDownloadButtons from "../components/landing/HeroDownloadButtons";
import ProductLoop from "../components/landing/ProductLoop";
import PreservedSections from "./PreservedSections";
import { TodayPreview, NudgePreview, CompactPreview, WorkdayExplorer } from "./ProductPreviews";
import s from "./preview.module.css";


const concepts = [{id:"a",label:"A · Today first"},{id:"b",label:"B · A workday unfolds"},{id:"c",label:"C · The useful moment"}];

function HeroCopy() {
  return <div className={s.heroCopy}>
    <span className={s.privacyBadge}>Real-time · Private · On-device</span>
    <h1>Real-time voice feedback while you speak.</h1>
    <p>See how your voice changes during demanding conversations, with cues when a reset may help, so you can work under pressure with confidence.</p>
    <HeroDownloadButtons />
  </div>;
}

export default function LandingPage({ variant = "a", preview = false }: { variant?: "a" | "b" | "c"; preview?: boolean }) {
  return <div className={`${s.page} ${s[variant]}`}>
    {preview && <div className={s.reviewBar}><span>Local design preview</span><nav aria-label="Landing page variations">{concepts.map(c=><Link key={c.id} href={`/landing-preview/${c.id}/`} aria-current={variant===c.id?"page":undefined}>{c.label}</Link>)}</nav></div>}
    <Nav />
    <main id="top">
      <section className={s.hero}>
        <HeroCopy />
        {variant==="a" && <div className={s.callHero}>
          <p className={s.callHeroContext}>Keep Ontor beside your everyday calls.</p>
          <ProductLoop />
        </div>}
        {variant==="b" && <figure className={s.dayFigure}><div className={s.dayRail}><span>Your day</span><strong>Work</strong><i/><strong>Notice</strong><i/><strong>Reset</strong></div><div><TodayPreview/><figcaption>Interactive product preview · Illustrative readings</figcaption><figcaption>Your patterns through the day. Illustrative product preview.</figcaption></div></figure>}
        {variant==="c" && <WorkdayExplorer/>}
      </section>

      {variant !== "a" && (
      <section className={s.todayStory}>
        <h2>Your day, compared with your usual.</h2>
        <div><p>Review voice readings alongside activity time and work stretches. Select a marker to explore its daily trend.</p><Link href="/how-it-works/">Understand your readings ↗</Link></div>
      </section>
      )}

      <section className={s.supportSection}>
        <header><h2>A small cue during a demanding conversation.</h2></header>
        {variant==="a" && <>
          <div className={s.supportRow}><div><span className={s.context}>During a call</span><h3>Real-time support, within reach.</h3><p>When your voice shifts from its usual pattern, a small cue suggests an action you can take during the conversation.</p></div><div className={s.compactStage}><CompactPreview/></div></div>
          <div className={s.supportRow}><div><span className={s.context}>After the call</span><h3>A moment to settle before the next conversation.</h3><p>Choose a guided breathing exercise when you want a reset. Compare voice readings before and afterward to see what changed.</p></div><div className={s.exercise}><span>Example guided reset</span><strong>Slowly breathe out</strong><p>Let your next exhale last a little longer.<br/>Keep it comfortable.</p><Link href="/how-it-works/">See how resets work ↗</Link></div></div>
        </>}
        {variant==="b" && <div className={s.workdaySteps}>
          <article><div className={s.stepCopy}><span className={s.context}>In the conversation</span><h3>See a change as you speak.</h3><p>Voice readings stay nearby in the compact view. You can keep it closed and check your day later.</p></div><CompactPreview/></article>
          <article><div className={s.stepCopy}><span className={s.context}>Back at your desk</span><h3>Make room for a break.</h3><p>Time without a break can prompt a reminder. Snooze it if you need to finish something.</p></div><NudgePreview/></article>
          <article><div className={s.stepCopy}><span className={s.context}>Before the next task</span><h3>Try a short reset.</h3><p>Choose a guided exercise when it suits you. A voice check-in before and afterward lets you compare your readings.</p></div><div className={s.exercise}><span>Suggested reset</span><strong>Extended exhale</strong><p>Breathe in for 4 seconds.<br/>Breathe out slowly for 8.</p><Link href="/how-it-works/">Explore how resets work ↗</Link></div></article>
        </div>}
        {variant==="c" && <div className={s.companion}>
          <div className={s.companionTop}><div><h3>Quietly there while you work.</h3><p>See live voice feedback during a call. Review your readings and try a reset between conversations.</p><CompactPreview/></div><div className={s.companionNudge}><NudgePreview/></div></div>
          <p className={s.companionNote}>You choose the next step: a break, a simple exercise, or more time to finish what you’re doing.</p>
        </div>}

      </section>
      <PreservedSections calm={variant === "a"} />
      <section className={s.close}><div className={s.privacyNote}><p>Your analysis runs on your device. Cloud backup is optional and off by default.</p><Link href="/privacy/">How privacy works ↗</Link></div><h2>Try Ontor during your next call.</h2><HeroDownloadButtons/><div className={s.closeLinks}><Link href="/for-teams/">Explore Ontor for teams ↗</Link></div></section>
    </main>
    <Footer />
  </div>;
}
