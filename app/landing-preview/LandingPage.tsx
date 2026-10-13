import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import HeroDownloadButtons from "../components/landing/HeroDownloadButtons";
import PreservedSections from "./PreservedSections";
import { TodayPreview, NudgePreview, CompactPreview, WorkdayExplorer } from "./ProductPreviews";
import s from "./preview.module.css";
import RotatingHeroLine from "./RotatingHeroLine";

const concepts = [{id:"a",label:"A · Today first"},{id:"b",label:"B · A workday unfolds"},{id:"c",label:"C · The useful moment"}];

function HeroCopy() {
  return <div className={s.heroCopy}>
    <span className={s.privacyBadge}>On-device · Private</span>
    <h1>Hours at your computer.<RotatingHeroLine /><span className={s.heroHighlight}>Take a smart break!!</span></h1>
    <p>Ontor learns how you interact with your computer to notice changes in your focus and work rhythm, then suggests a short break or simple exercise when it may help</p>
    <HeroDownloadButtons />
    <a
      className={s.productHuntBadge}
      href="https://www.producthunt.com/products/healthos-2?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-ontor-ai"
      target="_blank"
      rel="noopener noreferrer"
    >
      {/* Product Hunt serves this live badge directly. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt="Ontor.ai - Know when to take break before screen affects your health | Product Hunt"
        width="250"
        height="54"
        src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1178520&amp;theme=light&amp;t=1791875032796"
      />
    </a>
  </div>;
}

export default function LandingPage({ variant = "a", preview = false }: { variant?: "a" | "b" | "c"; preview?: boolean }) {
  return <div className={`${s.page} ${s[variant]}`}>
    {preview && <div className={s.reviewBar}><span>Local design preview</span><nav aria-label="Landing page variations">{concepts.map(c=><Link key={c.id} href={`/landing-preview/${c.id}/`} aria-current={variant===c.id?"page":undefined}>{c.label}</Link>)}</nav></div>}
    <Nav />
    <main id="top">
      <section className={s.hero}>
        <HeroCopy />
        {variant==="a" && <figure className={s.heroFigure}>
          <div className={s.previewIntro}><h2>When you’re tired, it’s easier to make mistakes.</h2></div>
          <TodayPreview/>
        </figure>}
        {variant==="b" && <figure className={s.dayFigure}><div className={s.dayRail}><span>Your day</span><strong>Work</strong><i/><strong>Notice</strong><i/><strong>Reset</strong></div><div><TodayPreview/><figcaption>Your patterns through the day. Illustrative product preview.</figcaption></div></figure>}
        {variant==="c" && <WorkdayExplorer/>}
      </section>

      {variant !== "a" && (
      <section className={s.todayStory}>
        <h2>Your day, compared with your usual.</h2>
        <div><p>See changes in your voice alongside your work rhythm, total activity, and uninterrupted work stretches. Useful during calls, and in the hours between them.</p><Link href="/how-it-works/">Understand your readings ↗</Link></div>
      </section>
      )}

      <section className={s.supportSection}>
        <header><h2>Know when to pause as focus slips and fatigue builds.</h2></header>
        {variant==="a" && <>
          <div className={s.supportRow}><div><span className={s.context}>Between calls</span><h3>You’ve been working for a while.</h3><p>Take a three-minute walk, then stretch gently. Snooze the reminder when you need more time.</p></div><div className={s.nudgeStage}><NudgePreview/></div></div>
          <div className={s.supportRow}><div><span className={s.context}>During a call</span><h3>Live feedback. Room to keep talking.</h3><p>When your voice shifts from its usual pattern, a small cue suggests an action you can take during the conversation. No need to stop talking or open another screen.</p></div><div className={s.compactStage}><span className={s.menuBar}>◷ &nbsp; Ontor · Listening</span><CompactPreview/></div></div>
        </>}
        {variant==="b" && <div className={s.workdaySteps}>
          <article><div className={s.stepCopy}><span className={s.context}>In the conversation</span><h3>See a change as you speak.</h3><p>Voice readings stay nearby in the compact view. You can keep it closed and check your day later.</p></div><CompactPreview/></article>
          <article><div className={s.stepCopy}><span className={s.context}>Back at your desk</span><h3>Make room for a break.</h3><p>Your work rhythm and time without a break help inform the next reminder. Snooze it if you need to finish something.</p></div><NudgePreview/></article>
          <article><div className={s.stepCopy}><span className={s.context}>Before the next task</span><h3>Try a short reset.</h3><p>Choose a guided exercise when it suits you. A voice check-in before and afterward lets you compare your readings.</p></div><div className={s.exercise}><span>Suggested reset</span><strong>Extended exhale</strong><p>Breathe in for 4 seconds.<br/>Breathe out slowly for 8.</p><Link href="/how-it-works/">Explore how resets work ↗</Link></div></article>
        </div>}
        {variant==="c" && <div className={s.companion}>
          <div className={s.companionTop}><div><h3>Quietly there while you work.</h3><p>See live voice feedback during a call. Let work rhythm inform reminders between conversations.</p><CompactPreview/></div><div className={s.companionNudge}><NudgePreview/></div></div>
          <p className={s.companionNote}>You choose the next step: a break, a simple exercise, or more time to finish what you’re doing.</p>
        </div>}
        <p className={s.healthNote}>Spending more time sedentary is associated with higher risks of type 2 diabetes and cardiovascular disease. Moving more and limiting sedentary time supports health. <a href="https://www.who.int/news-room/fact-sheets/detail/physical-activity" target="_blank" rel="noopener noreferrer">WHO guidance ↗</a></p>
      </section>
      <PreservedSections calm={variant === "a"} />
      <section className={s.close}><div className={s.privacyNote}><p>Your analysis runs on your device. Cloud backup is optional and off by default.</p><Link href="/privacy/">How privacy works ↗</Link></div><h2>Try Ontor during your next workday.</h2><HeroDownloadButtons/><div className={s.closeLinks}><Link href="/for-teams/">Explore Ontor for teams ↗</Link></div></section>
    </main>
    <Footer />
  </div>;
}
