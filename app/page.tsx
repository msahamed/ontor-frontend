import Image from "next/image";
import Link from "next/link";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import ProductLoop from "./components/landing/ProductLoop";
import styles from "./page.module.css";

const START_FREE = "/login/?next=/dashboard/subscription/";

const liveSignals = [
  ["Energy", "In range", 48, false],
  ["Stress", "In range", 52, false],
  ["Fatigue", "In range", 57, false],
  ["Confidence", "In range", 49, false],
  ["Speech clarity", "Above usual", 70, false],
  ["Vocal strain", "In range", 54, false],
  ["Breathing", "Below usual", 28, true],
] as const;

const comparisonSignals = [
  ["Stress", "down", "9%", true],
  ["Confidence", "up", "7%", true],
  ["Breathing", "up", "6%", true],
  ["Vocal strain", "down", "5%", true],
  ["Speech clarity", "up", "3%", true],
  ["Energy", "down", "2%", false],
  ["Fatigue", "up", "1%", false],
] as const;

export default function Home() {
  return (
    <>
      <Nav />
      <main id="top">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.heroContext}>In your desktop menu bar</p>
            <h1>See what your voice shows.</h1>
            <p className={styles.lede}>
              <strong>Stay sharp for the conversations that matter.</strong>{" "}
              Ontor notices changes in your voice, like stress or fatigue signals, suggests a short reset, and lets you compare your signals afterward.
            </p>
            <div className={styles.actions}>
              <Link className={styles.primaryButton} href={START_FREE}>Try Ontor free</Link>
            </div>
            <p className={styles.trialNote}>14 days free. No card required.</p>
          </div>
          <ProductLoop />
        </section>

        <section className={styles.liveSection} id="how">
          <div className={styles.sectionCopy}>
            <p className={styles.eyebrow}>While you&rsquo;re speaking</p>
            <h2>Voice signals that matter for your performance.</h2>
            <p>Ontor refreshes your reading after each 10 seconds you speak. Keep the live view open, or let it work quietly in the background.</p>
          </div>
          <div className={styles.livePanel} aria-label="Example of Ontor reading voice signals while someone speaks">
            <div className={styles.liveTopline}>
              <span>Listening</span>
              <time>0:32</time>
              <i aria-hidden="true" />
            </div>
            <h3>Ontor is listening.</h3>
            <p className={styles.liveIntro}>Markers refresh with each 10-second voice window.</p>
            <p className={styles.liveLabel}>Latest window</p>
            <div className={styles.liveSignals}>
              {liveSignals.map(([name, status, position, warm], index) => (
                <div className={styles.liveRow} key={name}>
                  <strong>{name}</strong>
                  <div className={styles.liveTrack} aria-hidden="true">
                    <span className={styles.usualRange} />
                    <i className={warm ? styles.warmMarker : undefined} style={{ left: `${position}%`, animationDelay: `${index * -0.35}s` }} />
                  </div>
                  <span className={warm ? styles.warmStatus : undefined}>{status}</span>
                </div>
              ))}
            </div>
            <div className={styles.liveFooter}>
              <span>Latest window · 7 seconds ago</span>
              <button type="button">End</button>
            </div>
          </div>
        </section>

        <div className={styles.facts} aria-label="Product details">
          <span>Conversations, presentations, work calls, and voice check-ins</span>
          <span>Compared with your usual range</span>
          <span>No wearable needed</span>
        </div>

        <section className={styles.reviewSection}>
          <div className={styles.sectionCopy}>
            <p className={styles.eyebrow}>After a session</p>
            <h2>See what changed and when.</h2>
            <p>Review each signal across the session. Ontor shows when it moved outside your usual range and where the biggest shift happened.</p>
          </div>
          <figure className={styles.reviewShot}>
            <Image src="/landing/post-call-reset.png" alt="Ontor session analysis showing stress, energy, and fatigue against the user’s usual range" fill sizes="(max-width: 960px) 100vw, 856px" />
          </figure>
        </section>

        <section className={styles.breakSection}>
          <div className={styles.sectionCopy}>
            <p className={styles.eyebrow}>When a shift lasts</p>
            <h2>Ontor helps you reset based on what changed.</h2>
            <p>If stress, fatigue, confidence, or breathing stays outside your usual range, Ontor suggests a short exercise. Speak again afterward to see the difference.</p>
          </div>
          <div className={styles.resetPanel} aria-label="Example of an Ontor reset and follow-up check-in">
            <div className={styles.compactMoment}>
              <div className={styles.compactMomentCopy}>
                <span>While you&apos;re speaking</span>
                <p>See what changes while you speak on a call, during a presentation, or in everyday conversation.</p>
              </div>
              <div className={styles.compactPreview} aria-label="Compact Ontor view showing stress moving above the usual range">
                <div className={styles.compactTopline}>
                  <div><strong>Listening</strong><span>0:32</span><i aria-hidden="true" /></div>
                  <button type="button">End</button>
                </div>
                <div className={styles.compactSignals}>
                  <div className={styles.compactRow}>
                    <strong>Stress</strong>
                    <div className={styles.compactTrack} aria-hidden="true"><span /><i className={styles.compactAlertDot} /></div>
                    <span className={styles.compactAlertStatus}>Above usual</span>
                  </div>
                  <div className={styles.compactRow}>
                    <strong>Breathing</strong>
                    <div className={styles.compactTrack} aria-hidden="true"><span /><i style={{ left: "49%" }} /></div>
                    <span>In range</span>
                  </div>
                  <div className={styles.compactRow}>
                    <strong>Confidence</strong>
                    <div className={styles.compactTrack} aria-hidden="true"><span /><i style={{ left: "54%" }} /></div>
                    <span>In range</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.resetNotice}>
              <span>If the shift continues</span>
              <h3>Stress stayed above your usual range near the end.</h3>
              <p>Ontor suggests an exercise based on what changed.</p>
            </div>

            <div className={styles.resetSuggestion}>
              <div className={styles.resetSuggestionCopy}>
                <span>Suggested for this shift</span>
                <h3>Extended exhale</h3>
                <p>Breathe in for 4 seconds, then breathe out slowly for 8.</p>
              </div>
              <div className={styles.resetAction}>
                <div className={styles.exhaleVisual} aria-hidden="true"><i /></div>
                <span>1:45</span>
                <button type="button">Begin</button>
              </div>
            </div>

            <div className={styles.resetFollowUp}>
              <div className={styles.resetComparison}>
                <h3>Compare check-ins</h3>
                <div className={styles.comparisonTimes}>
                  <div>
                    <span>Before</span>
                    <strong>10:09 AM</strong>
                  </div>
                  <i aria-hidden="true">→</i>
                  <div>
                    <span>After</span>
                    <strong>10:13 AM</strong>
                  </div>
                </div>
                <div className={styles.comparisonList}>
                  {comparisonSignals.map(([name, direction, amount, improving]) => (
                    <div className={improving ? styles.improvingComparison : undefined} key={name}>
                      <strong>{name}</strong>
                      <span aria-label={`${direction} ${amount}`}>
                        <i aria-hidden="true">{direction === "up" ? "↑" : "↓"}</i> {amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.teamSection} aria-labelledby="team-heading">
          <div className={styles.sectionCopy}>
            <h2 id="team-heading">Help your team stay sharp, too.</h2>
            <p>Give each person feedback and short resets they can use during the workday. Team leaders see aggregate patterns to inform workload, coaching, and support. Individual readings and sessions stay personal.</p>
          </div>
          <Link className={styles.teamLink} href="/for-teams">Explore Ontor for teams <span aria-hidden="true">→</span></Link>
        </section>

        <section className={styles.finalCta} id="start">
          <h2>See how Ontor can help you stay sharp.</h2>
          <Link className={styles.primaryButton} href={START_FREE}>See what your voice shows</Link>
          <p className={styles.trialNote}>14 days free. No card required. Cancel anytime.</p>
        </section>
      </main>

      <Footer />
    </>
  );
}
