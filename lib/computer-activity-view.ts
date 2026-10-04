import type { ComputerActivityDoc } from './computer-activity';
import type { ActivityDay } from './today-analytics';

/** Presentation only: immutable observations retain their original prediction. */
export function activityDayFromObservations(documents: ComputerActivityDoc[], day: string): ActivityDay | null {
  const groups = new Map<number, ComputerActivityDoc[]>();
  for (const doc of documents) {
    const localAt = doc.start_ms + doc.utc_offset_minutes * 60000;
    if (new Date(localAt).toISOString().slice(0, 10) !== day) continue;
    const group = groups.get(doc.start_ms) ?? [];
    group.push(doc);
    groups.set(doc.start_ms, group);
  }
  if (!groups.size) return null;
  const windows: ActivityDay['windows'] = [];
  const buckets = new Map<number, number[]>();
  const bands: {median:number; low:number; high:number}[] = [];
  let first: number | null = null, last: number | null = null, activeMs = 0, longestStretchMs = 0;
  function finish() {
    if (first !== null && last !== null) {
      const duration = last + 10000 - first;
      activeMs += duration;
      longestStretchMs = Math.max(longestStretchMs, duration);
    }
    first = last = null;
  }
  for (const [time, docs] of [...groups].sort((a,b)=>a[0]-b[0])) {
    const at = time + docs[0].utc_offset_minutes * 60000;
    const active = Math.max(...docs.map(d=>d.features.active_ms));
    windows.push({at, activeMs:active});
    if (last !== null && time - last - 10000 >= 300000) finish();
    if (active > 0) { first ??= time; last = time; }
    const scores = docs.map(d=>d.prediction.score).filter((v): v is number=>v !== null);
    if (scores.length) {
      const bucket = Math.floor(at / 300000) * 300000;
      const values = buckets.get(bucket) ?? [];
      values.push(scores.reduce((s,v)=>s+v,0)/scores.length);
      buckets.set(bucket,values);
    }
    for (const doc of docs) {
      const band = doc.prediction.reference_band;
      if (band) bands.push({median:band.median*100,low:(band.median-band.lowerWidth)*100,high:(band.median+band.upperWidth)*100});
    }
  }
  finish();
  const pace = [...buckets].sort((a,b)=>a[0]-b[0]).map(([at, values])=>{
    const mean = values.reduce((s,v)=>s+v,0)/values.length;
    return {at, mean, sd:values.length < 2 ? null : Math.sqrt(values.reduce((s,v)=>s+(v-mean)**2,0)/(values.length-1))};
  });
  const avg = (key:'median'|'low'|'high')=>bands.reduce((s,b)=>s+b[key],0)/bands.length;
  return {day, windows, activeMs, longestStretchMs, pace,
    paceBand:bands.length ? {median:avg('median'),low:avg('low'),high:avg('high')} : null,
    latestPace:pace.at(-1)?.mean ?? null};
}
