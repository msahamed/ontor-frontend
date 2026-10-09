"use client";

import { useState } from "react";
import Image from "next/image";
import Logo from "../components/Logo";
import s from "./preview.module.css";

const markers = ["Stress", "Focus", "Energy", "Fatigue", "Vocal strain", "Speech clarity", "Hesitation"];
const paths = [
  "M20 48 L25 77 L32 71 L40 93 L48 75 M98 84 L104 78 L115 91 L123 110 L130 108 L140 93 M198 67 L203 90 L211 69 L218 56 L225 37 L233 64 M278 71 L285 98 L293 105 L302 84 M370 70 L380 55 L388 37 L400 44",
  "M20 90 L28 81 L38 94 L48 87 M98 83 L107 67 L116 73 L126 55 L139 65 M198 77 L207 85 L216 67 L228 75 M278 86 L286 68 L294 80 L302 70 M370 66 L380 81 L389 68 L400 75",
  "M20 63 L28 71 L39 59 L48 72 M98 70 L108 83 L119 69 L129 89 L140 77 M198 82 L207 62 L217 75 L233 69 M278 79 L287 84 L294 98 L302 81 M370 86 L380 92 L390 105 L400 98",
];

export function PaceChart({voice = false, marker = 0}: {voice?:boolean; marker?:number}) {
  return <svg className={s.chart} viewBox="0 0 500 162" role="img" aria-label={voice ? `Illustrative ${markers[marker]} readings compared with a usual range` : "Illustrative work rhythm throughout the day compared with a usual range"}>
    <rect x="35" y="47" width="449" height="58" fill="#efebe2" />
    {[35,149,263,377,484].map(x=><line key={x} x1={x} x2={x} y1="15" y2="135" stroke="#e8e2d7" strokeWidth=".8"/>)}
    {[32,76,122].map(y=><line key={y} x1="35" x2="484" y1={y} y2={y} stroke="#e8e2d7" strokeWidth=".8"/>)}
    <line x1="35" x2="484" y1="76" y2="76" stroke="#a6a190" strokeWidth="1" strokeDasharray="4 4"/>
    <g fill="#888374" fontSize="8"><text x="12" y="35">75</text><text x="12" y="79">50</text><text x="12" y="125">25</text><text x="85" y="151">8 AM</text><text x="205" y="151">12 PM</text><text x="328" y="151">4 PM</text><text x="443" y="151">8 PM</text></g>
    <g transform="translate(45 0)" fill="none" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      <path d={voice?paths[marker%3]:"M20 74 L26 65 L30 110 L37 118 L45 83 L55 45 L60 71 L69 56 L77 90 L86 66 L95 73 L104 57 L112 79 L120 94 L130 71 L140 87 L149 106 L156 59 L163 47 L174 78 L183 66 L190 96 L199 83 L207 61 L215 91 L224 103 L232 61 L238 48 M269 57 L278 78 L287 66 L293 115 L302 99 L310 72 L320 81 L328 66 L337 88 L345 62 L356 81 L365 92 L375 102 L386 81 L400 79"} stroke="#a8a28f" />
      {!voice && <path d="M26 65 L30 110 L37 118 M287 66 L293 115 L302 99" stroke="#b95037"/>}
      {voice && marker===0 && <><path d="M115 91 L123 110 L130 108" stroke="#14766c"/><path d="M380 55 L388 37 L400 44" stroke="#b95037"/></>}
    </g>
  </svg>;
}

export function TodayPreview({compact=false, phase}: {compact?:boolean; phase?:number}) {
  const [marker,setMarker]=useState(0);
  if (phase === undefined) return <div className={s.dashboardCapture}>
    <a href="/landing/dashboard-oct-8.jpg" target="_blank" rel="noopener noreferrer" aria-label="Open October 8 dashboard at full size"><Image src="/landing/dashboard-oct-8.jpg" width={2218} height={1720} priority alt="Ontor dashboard for October 8: 7 hours 15 minutes active, longest stretch 1 hour 37 minutes. Computer activity and voice readings appear above a tiredness chart, starting at 48, reaching 61, and ending at 49." /></a>
    <svg className={s.dashboardAnnotation} viewBox="0 0 1000 774" role="img" aria-label="Highlighted early sharp rise and later spike in tiredness: detect and pause before fatigue hurts. Illustrative guidance.">
      {/* Hide the capture-specific timestamp in the landing-page presentation. */}
      <rect x="632" y="445" width="270" height="28" fill="#fff" />
      <path d="M660 490 C681 490 687 490 703 511" fill="none" stroke="#b63e2e" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m693 510 11 3-2-11" fill="none" stroke="#b63e2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M370 510 C370 532 390 538 405 554" fill="none" stroke="#b63e2e" strokeWidth="2.5" strokeLinecap="round" />
      <path d="m395 548 10 6-2-11" fill="none" stroke="#b63e2e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="650" y="498" textAnchor="end" fill="#913326" fontSize="25" fontWeight="750">Detect &amp; pause before fatigue hurts.</text>
    </svg>
  </div>;
  return <div className={`${s.today} ${compact?s.todayCompact:""}`}>
    <div className={s.windowBar}><span aria-hidden="true"><i/><i/><i/></span><strong>Ontor</strong></div>
    <div className={s.todayBody}>
      <div className={s.todayTitle}><h3>Today</h3><span>{phase === undefined ? "Sep 29" : ["10:15 AM", "11:20 AM", "12:25 PM"][phase]}</span></div>
      <div className={s.markerTabs} role="group" aria-label="Preview a voice signal">{markers.map((m,i)=><button key={m} type="button" onClick={()=>setMarker(i)} aria-pressed={i===marker}>{m}</button>)}</div>
      <div className={s.chartBox}>{phase === 1 ? <p className={s.noVoice}>No voice readings in this quiet-work example.</p> : <PaceChart voice marker={marker}/>}</div>
      <h4>Computer activity</h4>
      <div className={s.activityBox}>
        <div className={s.activityNumbers}><span>Total today<strong>{phase === undefined ? "5h 38m" : ["1h 15m", "2h 5m", "3h 10m"][phase]}</strong></span><span>Longest stretch<strong>{phase === undefined ? "1h 53m" : ["45m", "50m", "1h 5m"][phase]}</strong></span><span>Current stretch<strong>{phase === undefined ? "—" : ["24m", "35m", "1h 5m"][phase]}</strong></span></div>
        <svg viewBox="0 0 500 52" className={s.activityChart} role="img" aria-label="Example periods of computer activity across a day">
          <line x1="35" x2="484" y1="20" y2="20" stroke="#e8e2d7"/>
          <g stroke="#a8a28f" strokeWidth="7" strokeLinecap="round"><path d="M87 20h2 M115 20h76 M201 20h54 M270 20h35 M320 20h20 M357 20h28 M442 20h3"/></g>
          <g fill="#888374" fontSize="8"><text x="85" y="45">8 AM</text><text x="205" y="45">12 PM</text><text x="328" y="45">4 PM</text><text x="443" y="45">8 PM</text></g>
        </svg>
      </div>
      <h4>Interaction pace</h4><p className={s.chartHint}>Higher = more energetic</p>
      <div className={s.chartBox}><PaceChart/></div>
    </div>
    <div className={s.todayFoot}><span>▦ Today</span><span className={s.mic} aria-label="Voice check-in"><svg width="18" height="22" viewBox="0 0 18 22" aria-hidden="true"><rect x="6" y="1" width="6" height="12" rx="3" fill="currentColor"/><path d="M3 9v1a6 6 0 0012 0V9M9 16v5M6 21h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg></span><span>Resets</span></div>
  </div>;
}

export function NudgePreview() {
  const [answer,setAnswer]=useState<string|null>(null);
  const [snoozed,setSnoozed]=useState(false);
  return <div className={s.nudge}>
    <div className={s.nudgeTop}><span><Logo size={25}/> <strong>Ontor</strong> <small>30s</small></span><button type="button" onClick={()=>setSnoozed(!snoozed)}><span>{snoozed?"Snoozed":"Snooze"}</span><svg width="8" height="6" viewBox="0 0 10 7" aria-hidden="true"><path d="m1 1 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg></button></div>
    <h3>65 minutes without a break</h3><p>Take a 5-minute walk.</p>
    <div className={s.feedback}><strong>Are you feeling tired?</strong><div>{["Yes","Sort of","No"].map(x=><button type="button" key={x} aria-pressed={answer===x} onClick={()=>setAnswer(x)}>{x}</button>)}</div></div>
    <p className={s.feedbackHint}>Your feedback helps Ontor learn when a reminder is useful.</p>
    {answer && <p className={s.answer} role="status">{answer==="Yes"?"You’re feeling tired.":answer==="Sort of"?"You’re feeling a little tired.":"You’re not feeling tired."} Demo only; answer not saved.</p>}
  </div>;
}

export function CompactPreview() {
  return <div className={s.compact} aria-label="Illustrative live view during a call">
    <div className={s.compactHeader}><strong>Listening</strong><span>12:38</span><span className={s.listening} aria-hidden="true">▂▅▃▆▂</span><span className={s.end}>End</span></div>
    {[['Stress',74,'Above usual'],['Hesitation',49,'In range'],['Focus',55,'In range']].map(([label,value,status])=><div className={s.compactRow} key={label}><strong>{label}</strong><span className={s.compactTrack}><i/><b style={{left:`${value}%`}}/></span><span>{status}</span></div>)}
    <div className={s.liveCue}><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg><span>Gently lengthen your next exhale</span></div>
  </div>;
}


export function WorkdayExplorer() {
  const [moment,setMoment]=useState(2);
  const labels=["On a call","Working quietly","Time to pause"];
  return <div className={s.explorer}>
    <div className={s.explorerControl}><span>Explore a workday</span><div role="group" aria-label="Choose a workday moment">{labels.map((label,i)=><button type="button" key={label} aria-pressed={moment===i} onClick={()=>setMoment(i)}>{label}</button>)}</div></div>
    <div className={s.explorerBody}>
      <div className={s.momentToday}><TodayPreview compact phase={moment}/></div>
      <div className={s.momentNudge}>
        <span className={s.momentLabel}>{["Feedback while you speak","Useful between calls, too","A moment to check in"][moment]}</span>
        {moment===0 ? <CompactPreview/> : moment===1 ? <div className={s.quietMoment}><strong>You’re working at your usual pace.</strong><p>Your computer activity still gives you a view of your day, even when you are not speaking.</p><span>Current stretch · 35 minutes</span></div> : <NudgePreview/>}
        <p className={s.momentNote} role="status">{["Keep the compact view nearby, or let Ontor stay in the menu bar.","No reminder in this example. Keep working and check Today when you want.","A change in work rhythm after sustained work can be a reason to pause."][moment]}</p>
      </div>
    </div>
    <p className={s.explorerCaption}>Illustrative product previews. Demo answers are not saved.</p>
  </div>;
}
