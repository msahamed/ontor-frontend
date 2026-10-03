import type { Metadata } from "next";
import Link from "next/link";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import styles from "../marketing-pages.module.css";

export const metadata: Metadata = {
  title: "Ontor for teams",
  description: "Help people understand their workday with personal voice readings, work rhythm, and timely breaks. Explore aggregate insights in a team pilot.",
};

export default function ForTeamsPage() {
  return (
    <div className={styles.page}>
      <Nav />
      <main className={styles.main}>
        <section className={styles.hero}>
          <p className={styles.eyebrow}>Ontor for teams</p>
          <h1>Help your team find time to reset.</h1>
          <p className={styles.lede}>
            Give each person a view of their voice readings and work rhythm, with short resets and break reminders during the day. Explore aggregate patterns together in a team pilot.
          </p>
          <div className={styles.actions}>
            <a className={styles.primaryButton} href="https://calendly.com/sabber-ahamed/30min" target="_blank" rel="noreferrer">Discuss a team pilot</a>
            <Link className={styles.secondaryButton} href="/how-it-works">See how Ontor works</Link>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <p className={styles.eyebrow}>A clearer view of the buildup</p>
            <h2>Make workload and recovery part of the conversation.</h2>
            <p>Group patterns can give a team a reason to discuss meeting pressure, long work stretches, and opportunities to pause. Use a pilot to understand what is useful for your team.</p>
          </div>
          <div className={styles.teamDashboard} aria-label="Illustrative aggregate team overview">
            <div className={styles.dashboardHead}>
              <div>
                <span>Illustrative team view</span>
                <h3>Team overview</h3>
              </div>
              <div className={styles.dashboardPeriod}>Last 30 days</div>
            </div>
            <div className={styles.dashboardTabs} aria-hidden="true">
              <span className={styles.activeTab}>Overview</span>
              <span>Patterns</span>
              <span>Resets</span>
            </div>
            <div className={styles.dashboardBody}>
              <div className={styles.trendCard}>
                <div className={styles.cardHeading}>
                  <div>
                    <h4>Signals over time</h4>
                    <p>Compared with the team&apos;s usual range</p>
                  </div>
                  <div className={styles.chartLegend}><span>Energy</span><span>Stress</span></div>
                </div>
                <div className={styles.trendChart} aria-hidden="true">
                  <i className={styles.usualTeamBand} />
                  <svg viewBox="0 0 520 190" preserveAspectRatio="none">
                    <path d="M8 102 C62 96 96 94 138 99 S216 111 264 105 S340 71 390 78 S463 92 512 75" fill="none" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                    <path d="M8 112 C58 106 96 101 138 104 S216 98 264 102 S343 116 392 109 S464 94 512 98" fill="none" stroke="#0F766E" strokeWidth="4" strokeLinecap="round" />
                    {[8, 138, 264, 390, 512].map((x) => <circle key={`energy-${x}`} cx={x} cy={x === 8 ? 112 : x === 138 ? 104 : x === 264 ? 102 : x === 390 ? 109 : 98} r="4" fill="#0F766E" />)}
                    {[8, 138, 264, 390, 512].map((x) => <circle key={`stress-${x}`} cx={x} cy={x === 8 ? 102 : x === 138 ? 99 : x === 264 ? 105 : x === 390 ? 78 : 75} r="4" fill="#F59E0B" />)}
                  </svg>
                </div>
                <div className={styles.timeLabels}><span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span></div>
              </div>
              <div className={styles.patternCard}>
                <h4>What changed</h4>
                <div className={styles.signalRow}><span>Stress</span><strong className={styles.attention}>Above usual more often</strong></div>
                <div className={styles.signalRow}><span>Energy</span><strong>Near the usual range</strong></div>
                <div className={styles.signalRow}><span>After resets</span><strong className={styles.positive}>Moving toward usual</strong></div>
                <p className={styles.dashboardNote}>A reason to look at workload and support before the outcome shows up.</p>
              </div>
            </div>
            <div className={styles.dashboardPrivacy}><span aria-hidden="true">●</span> Group patterns only. Individual sessions and readings stay personal.</div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <p className={styles.eyebrow}>Personal help, team-level context</p>
            <h2>The individual experience stays personal.</h2>
            <p>Each person gets practical feedback throughout the workday, including time between calls.</p>
          </div>
          <div className={styles.ownershipPanel}>
            <div className={styles.ownershipRow}>
              <strong>Each person sees</strong>
              <p>Their Today view, voice readings, work rhythm, work stretches, and suggested breaks. They can snooze a reminder or say whether they feel tired.</p>
            </div>
            <div className={styles.ownershipRow}>
              <strong>Team leaders see</strong>
              <p>Aggregate patterns that can inform workload, coaching, and support. Personal sessions and individual readings stay with the person.</p>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionCopy}>
            <p className={styles.eyebrow}>Where businesses can use Ontor</p>
            <h2>Where Ontor can help.</h2>
          </div>
          <div className={styles.useCases}>
            <article className={styles.useCase}>
              <div className={styles.useCaseCopy}>
                <span>Sales teams</span>
                <h3>Help strong representatives stay steady through demanding conversations.</h3>
                <p>A representative can see when stress rises, focus shifts, or vocal strain builds. Ontor can suggest a reset before the next conversation, while leaders use aggregate patterns to improve coaching and workload decisions.</p>
              </div>
              <div className={styles.conversationVisual} aria-label="Illustration of strain building across several conversations">
                {[44,55,48,67,78,72].map((height,index)=><div key={index}><i style={{height}}/><span>{index===0?"Earlier":index===5?"Later":""}</span></div>)}
              </div>
            </article>

            <article className={styles.useCase}>
              <div className={styles.useCaseCopy}>
                <span>Workplace teams</span>
                <h3>Help people notice long stretches without a break.</h3>
                <p>Each person can see how long they have worked and how their work rhythm compares with their usual range. Break reminders offer a moment to pause, including on days with few calls.</p>
              </div>
              <div className={styles.workweekVisual} aria-label="Illustration of aggregate team patterns across a workweek">
                {["Mon","Tue","Wed","Thu","Fri"].map(day=><div className={styles.workday} key={day}><span/><span/><span/><small>{day}</small></div>)}
              </div>
            </article>

            <article className={styles.useCase}>
              <div className={styles.useCaseCopy}>
                <span>Spas and medical spas</span>
                <h3>Give customers a before-and-after experience they can see.</h3>
                <p>A short voice check-in before and after a service can show how the customer&apos;s signals changed. Providers can use that context to personalize the experience and make the result easier to understand.</p>
              </div>
              <div className={styles.spaCompare} aria-label="Illustrative before-and-after customer check-in">
                <div className={styles.spaState}>
                  <span>Before</span>
                  <div className={styles.spaMetric}><b>Stress</b><i/></div>
                  <div className={styles.spaMetric}><b>Energy</b><i/></div>
                </div>
                <i className={styles.spaArrow} aria-hidden="true">→</i>
                <div className={styles.spaState}>
                  <span>After</span>
                  <div className={styles.spaMetric}><b>Stress</b><i/></div>
                  <div className={styles.spaMetric}><b>Energy</b><i/></div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className={styles.cta}>
          <h2>Start with a focused pilot.</h2>
          <p>Choose one team or customer journey, decide what you want to learn, and measure the experience before expanding.</p>
          <div className={styles.actions}>
            <a className={styles.primaryButton} href="https://calendly.com/sabber-ahamed/30min" target="_blank" rel="noreferrer">Discuss a team pilot</a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
