"use client";
import { useEffect, useId, useState } from "react";
import styles from "./ProductLoop.module.css";

// Illustrative readings, accelerated for the hero demonstration.
const readings = [
  [49,51,48,50,54,51,49], [55,77,51,47,56,53,45],
  [44,84,55,52,50,76,47], [53,72,48,55,57,71,51],
  [47,78,53,48,53,55,49], [55,86,49,54,57,47,46],
  [45,73,57,51,49,78,52], [52,55,51,47,55,50,27],
  [56,49,54,55,51,54,33], [48,54,47,51,57,48,23],
  [54,76,53,46,52,56,47], [48,52,49,54,56,51,53],
];
const labels=["Energy","Stress","Fatigue","Confidence","Speech clarity","Vocal strain","Breathing"];

export default function ProductLoop() {
  const clipId=useId();
  const speakerClipId=useId();
  const [reading,setReading]=useState(0);
  const [paused,setPaused]=useState(false);
  const [reduced,setReduced]=useState(true);
  const [manualExpanded,setManualExpanded]=useState<boolean|null>(null);
  useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync=()=>setReduced(media.matches);
    sync();media.addEventListener("change",sync);
    return()=>media.removeEventListener("change",sync);
  },[]);
  useEffect(()=>{
    if(paused||reduced)return;
    const interval=window.setInterval(()=>{
      if(!document.hidden)setReading(value=>(value+1)%readings.length);
    },1800);
    return()=>window.clearInterval(interval);
  },[paused,reduced]);
  const expanded=manualExpanded??(reading>=4&&reading<=9);
  const current=readings[reading];
  const rows=(expanded?[0,1,2,3,4,5,6]:[0,1,current[5]>60?5:current[6]<40?6:3]).map(index=>({label:labels[index],value:current[index]}));
  const seconds=32+reading*10;
  const cue=current[5]>60?"Sip some water if you can":current[1]>60||current[6]<40?"Take a slow breath in":null;
  // Expand upward only: preserve the narrow footprint and bottom-right anchor.
  const x=1199;
  const cueSpace=cue?0:24;
  const y=(expanded?452:558)+cueSpace;
  const width=189;
  const toggleExpanded=()=>setManualExpanded(!expanded);

  return <figure className={styles.scene} data-paused={paused||reduced} data-expanded={expanded}>
    <svg viewBox="520 190 1016 660" className={styles.image} role="group" aria-label="Illustrative desktop call with compact and expanded live voice markers and suggested reset cues.">
      <defs>
        <clipPath id={clipId}><path d="M610 190H1448V752L1536 782V850H520V782L610 752Z"/></clipPath>
        <clipPath id={speakerClipId}><rect x="870" y="385" width="237" height="213" rx="10"/></clipPath>
      </defs>
      <image href="/landing/approved-call-hero.png" width="1536" height="1024" clipPath={`url(#${clipId})`}/>
      {/* Enlarge the existing speaker tile, preserving the approved call imagery. */}
      <g transform="translate(-247 -122.75) scale(1.25)">
        <image href="/landing/approved-call-hero.png" width="1536" height="1024" clipPath={`url(#${speakerClipId})`}/>
      </g>
      {/* Clear the baked-in preview so a shorter live panel leaves no duplicate header. */}
      <rect x="1196" y="555" width="196" height="109" rx="9" fill="#f7f7f7"/>
      <rect x="971" y="560" width="35" height="29" fill="#f1f1f1"/>
      {[4,8,13,9,5].map((height,index)=><rect key={index} className={styles.voiceBar} x={979+index*4} y={575-height/2} width="2" height={height} rx="1" fill="#4a9c9d" style={{animationDelay:`${index*-.16}s`}}/>)}
      <g className={styles.panel}>
        <rect className={styles.panelBackground} x={x} y={y} width={width} height={678-y} rx="7" fill="#084f49"/>
        <g key={String(expanded)} className={styles.panelContents}>
          <circle cx={x+14} cy={y+16} r="2.2" fill="#69d9a6"/>
          <text x={x+23} y={y+20} fontSize="9" fill="#fff">Listening</text>
          <text x={x+66} y={y+20} fontSize="8" fill="#d7e9e3">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,"0")}</text>
          <g role="button" tabIndex={0} aria-label={expanded?"Collapse live view":"Expand live view"} onClick={toggleExpanded} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();toggleExpanded();}}} className={styles.expandButton}>
            <rect x="1362" y={y+6} width="20" height="20" rx="3" fill="#ffffff09" stroke="#779d93" strokeWidth=".6"/>
            <path d={expanded?`M1377 ${y+11}l-8 8m0-5v5h5`:`M1368 ${y+20}l8-8m-5 0h5v5`} stroke="#edf5f1" strokeWidth="1" fill="none"/>
          </g>
          {rows.map((row,index)=>{
            const rowY=expanded?y+44+index*22:y+40+index*21;
            const warm=row.value>60||row.value<40;
            const trackX=1272;
            const trackWidth=103;
            return <g key={row.label}>
              <text x={x+10} y={rowY+3} fontSize="9.8" fontWeight="500" fill="#f1f7f4">{row.label}</text>
              <path d={`M${trackX} ${rowY}h${trackWidth}`} stroke="#608e83" strokeWidth="1.5"/>
              <rect x={trackX+trackWidth*.4} y={rowY-4} width={trackWidth*.2} height="8" rx="2" fill="#ffffff13"/>
              <path d={`M${trackX+trackWidth*.5} ${rowY-5}v10`} stroke="#acc8be" strokeWidth=".7"/>
              <circle cx={trackX+row.value*trackWidth/100} cy={rowY} r="3" fill={warm?"#fbbf24":"#f7faf9"}/>
            </g>;
          })}
          {cue&&<g className={styles.cue} aria-label={cue}>
            <text x={x+width/2} y="665" textAnchor="middle" fontSize="11" fontWeight="600" fill="#fbbf24">{cue}</text>
          </g>}
        </g>
      </g>
    </svg>
    <figcaption className={styles.footer}><span>Illustrative demo · Sped-up readings</span><div>
      {manualExpanded!==null&&<button onClick={()=>setManualExpanded(null)}>Auto view</button>}
      {!reduced&&<button onClick={()=>setPaused(value=>!value)}>{paused?"Resume motion":"Pause motion"}</button>}
    </div></figcaption>
  </figure>;
}
