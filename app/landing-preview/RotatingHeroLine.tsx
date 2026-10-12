"use client";

import { useState } from "react";
import s from "./preview.module.css";

export default function RotatingHeroLine() {
  const [paused, setPaused] = useState(false);
  return <span className={s.rotatingLine} data-paused={paused}>
    <span className={s.heroQuestionAccessible}>Time for a break? </span>
    <span className={s.heroQuestions} aria-hidden="true">
      {["Losing focus?", "Back pain?", "Neck pain?", "Tired eyes?"].map((phrase, index) =>
        <span key={phrase} style={{ animationDelay: `${index * 3.5}s` }}>{phrase}</span>
      )}
    </span>
    <span className={s.heroQuestionStatic} aria-hidden="true">Time for a break?</span>
    <button type="button" className={s.heroMotionToggle} aria-label={paused ? "Resume rotating headline" : "Pause rotating headline"} onClick={() => setPaused(!paused)}>
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
        {paused ? <path d="M4 2 12 7 4 12Z" fill="currentColor"/> : <path d="M4 3v8M10 3v8" stroke="currentColor" strokeWidth="2"/>}
      </svg>
    </button>
  </span>;
}
