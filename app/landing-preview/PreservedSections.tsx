import Image from "next/image";
import styles from "../page.module.css";
import preview from "./preview.module.css";
const liveSignals = [
  ["Energy", "In range", 48, false],
  ["Stress", "In range", 52, false],
  ["Fatigue", "In range", 57, false],
  ["Focus", "In range", 49, false],
  ["Speech clarity", "Above usual", 70, false],
  ["Vocal strain", "In range", 54, false],
  ["Hesitation", "Below usual", 28, true],
] as const;


export default function PreservedSections({ calm = false }: { calm?: boolean }) { return <>
        <section className={`${styles.liveSection} ${calm ? preview.alignedSection : ""}`} id="how">
          <div className={styles.sectionCopy}>
            <p className={styles.eyebrow}>While you&rsquo;re speaking</p>
            <h2>Voice signals that matter for your conversations.</h2>
            <p>Ontor refreshes your reading after each 10 seconds you speak. Keep the live view open, or let it work quietly in the background.</p>
          </div>
          <div className={calm ? `${preview.visualStage} ${preview.liveStage}` : undefined}>
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
          </div>
        </section>

        <div className={`${styles.facts} ${calm ? preview.alignedFacts : ""}`} aria-label="Product details">
          <span>Conversations, presentations, work calls, and voice check-ins</span>
          <span>Compared with your usual range</span>
          <span>No wearable needed</span>
        </div>

        <section className={`${styles.reviewSection} ${calm ? preview.alignedSection : ""}`}>
          <div className={styles.sectionCopy}>
            <p className={styles.eyebrow}>After a session</p>
            <h2>See what changed and when.</h2>
            <p>Review each signal across the session. Ontor shows when it moved outside your usual range and where the biggest shift happened.</p>
          </div>
          <div className={calm ? `${preview.visualStage} ${preview.reviewStage}` : undefined}>
          <figure className={styles.reviewShot}>
            <Image src="/landing/post-call-reset.png" alt="Ontor session analysis showing stress, energy, and fatigue against the user’s usual range" fill sizes="(max-width: 960px) 100vw, 856px" />
          </figure>
          </div>
        </section>


</>; }
