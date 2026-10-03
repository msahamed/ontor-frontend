"use client";

import { useState } from "react";
import styles from "./page.module.css";

const moments = [
  {
    label: "On a call",
    description: "Voice readings are available while you speak during a session. Your computer activity appears alongside them in Today.",
    voice: "Stress · Near your usual range",
    stretch: "24 min",
    rhythm: "Near your usual pace",
    points: "0,58 35,50 70,54 105,45 140,58 175,50 210,55 245,42 280,49 315,46 350,53 385,48 420,52",
    reminder: false,
  },
  {
    label: "Working quietly",
    description: "You do not need a voice session to see your work rhythm. Reading, writing, and switching tasks can produce different patterns.",
    voice: "No voice readings in this example",
    stretch: "32 min",
    rhythm: "Varying around your usual pace",
    points: "0,48 35,60 70,46 105,63 140,53 175,40 210,60 245,44 280,58 315,51 350,42 385,53 420,49",
    reminder: false,
  },
  {
    label: "A longer stretch",
    description: "After sustained work, a slower rhythm can prompt a break suggestion. The reminder is an invitation to check how you feel.",
    voice: "No voice readings in this example",
    stretch: "65 min",
    rhythm: "Below your usual pace",
    points: "0,50 35,46 70,55 105,59 140,52 175,64 210,70 245,66 280,78 315,71 350,80 385,76 420,81",
    reminder: true,
  },
];

export default function WorkdayDemo() {
  const [selected, setSelected] = useState(0);
  const [answer, setAnswer] = useState<"yes" | "no" | null>(null);
  const [snoozed, setSnoozed] = useState(false);
  const moment = moments[selected];
  return (
    <div className={styles.demo}>
      <p className={styles.demoCaption}>Illustrative walkthrough · Example readings, not live data</p>
      <div className={styles.demoChoices} role="group" aria-label="Choose an example workday moment">
        {moments.map((item, index) => <button type="button" key={item.label} aria-pressed={selected === index} onClick={() => { setSelected(index); setAnswer(null); setSnoozed(false); }}>{item.label}</button>)}
      </div>
      <div className={styles.demoContent}>
        <h3>Today</h3>
        <p>{moment.voice}</p>
        <div className={styles.demoMetrics}><span>Current stretch <strong>{moment.stretch}</strong></span><span>Work rhythm <strong>{moment.rhythm}</strong></span></div>
        <svg className={styles.demoChart} viewBox="0 0 420 106" role="img" aria-label={`Example work rhythm: ${moment.rhythm.toLowerCase()}. Shading indicates the usual range; the dashed line indicates the usual median.`}>
          <rect x="0" y="32" width="420" height="38" fill="var(--line)" opacity=".55" />
          <line x1="0" y1="51" x2="420" y2="51" stroke="var(--ink-soft)" strokeDasharray="5 5" opacity=".55" />
          <polyline points={moment.points} fill="none" stroke="var(--teal)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        </svg>
        <p className={styles.demoCaption}>Shaded band: usual range · Dashed line: usual median</p>
        {moment.reminder && <div className={styles.demoReminder}>
          <div className={styles.reminderHeading}><strong>Take a 5-minute break.</strong><button type="button" onClick={() => setSnoozed(true)} disabled={snoozed}>{snoozed ? "Snoozed" : "Snooze"}</button></div>
          <p>65 minutes without a break</p>
          <div className={styles.demoFeedback}><strong>Are you feeling tired?</strong><div>{(["yes", "no"] as const).map(value => <button type="button" key={value} aria-pressed={answer === value} onClick={() => setAnswer(value)}>{value === "yes" ? "Yes" : "No"}</button>)}</div></div>
          <p className={styles.demoResponse} role="status">{answer === "yes" ? "In Ontor, this answer tells it the reminder matched how you felt." : answer === "no" ? "In Ontor, this answer helps distinguish a slower rhythm from feeling tired." : snoozed ? "In Ontor, snoozing lets you continue working and be reminded later." : "Try an answer. Your choices in this demo are not saved."}</p>
        </div>}
      </div>
      <p className={styles.demoExplanation}>{moment.description}</p>
    </div>
  );
}
