"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { statMean, statSd, type UsualBand } from "@/lib/markers";
import type { ActivityDay, TodayMarker, VoicePoint } from "@/lib/today-analytics";

const MARKERS: { key: TodayMarker; label: string; highBad: boolean }[] = [
  { key: "stress", label: "Stress", highBad: true },
  { key: "confidence", label: "Confidence", highBad: false },
  { key: "energy", label: "Energy", highBad: false },
  { key: "fatigue", label: "Fatigue", highBad: true },
  { key: "vocal_strain", label: "Vocal strain", highBad: true },
  { key: "articulation", label: "Articulation", highBad: false },
  { key: "hesitation", label: "Hesitation", highBad: true },
];
type TodayData = { voice: VoicePoint[]; bands: Record<TodayMarker, UsualBand | null>; activity: ActivityDay | null };
type Bin = { at: number; mean: number; sd: number | null; observationId?: string };

const localDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const watchDay = (changed: () => void) => { const timer = setInterval(changed, 60000); return () => clearInterval(timer); };
const clientDay = () => localDay(new Date());
const serverDay = () => new Date().toISOString().slice(0, 10);
const COLORS = { teal: "#0F766E", clay: "#B7492F", gray: "#A9A290", line: "#E4DDD0", shade: "#F1ECE2", ink: "#8A8577" };
const W = 960, H = 190, LEFT = 42, RIGHT = 12, TOP = 10, BOTTOM = 30;

function tone(value: number, band: UsualBand | null, highBad: boolean) {
  if (!band) return COLORS.gray;
  if (value > band.high) return highBad ? COLORS.clay : COLORS.teal;
  if (value < band.low) return highBad ? COLORS.teal : COLORS.clay;
  return COLORS.gray;
}

function axisFor(day: string, times: number[]) {
  const start = Date.parse(`${day}T00:00:00Z`);
  const min = times.length ? Math.min(...times) : start + 7 * 3600000;
  const max = times.length ? Math.max(...times) : start + 20 * 3600000;
  let from = Math.max(0, Math.min(23, Math.floor((min - start) / 3600000) - 1));
  let to = Math.max(1, Math.min(24, Math.ceil((max - start) / 3600000) + 1));
  if (to - from < 3) { from = Math.max(0, from - 1); to = Math.min(24, from + 3); }
  const step = to - from <= 7 ? 1 : to - from <= 14 ? 2 : 4;
  const ticks = Array.from({ length: to - from - 1 }, (_, i) => from + i + 1).filter((h) => h % step === 0);
  return { start, from, to, ticks, x: (at: number) => LEFT + ((at - start - from * 3600000) / ((to - from) * 3600000)) * (W - LEFT - RIGHT) };
}

function hourLabel(hour: number) { return hour === 0 ? "12 AM" : hour === 12 ? "12 PM" : hour < 12 ? `${hour} AM` : `${hour - 12} PM`; }

function Axis({ axis, ticks = [20, 40, 60, 80] }: { axis: ReturnType<typeof axisFor>; ticks?: number[] }) {
  return <g aria-hidden="true">
    {ticks.map((tick) => <g key={tick}><line x1={LEFT} y1={TOP + (1 - tick / 100) * (H - TOP - BOTTOM)} x2={W - RIGHT} y2={TOP + (1 - tick / 100) * (H - TOP - BOTTOM)} stroke={COLORS.line} /><text x={25} y={TOP + (1 - tick / 100) * (H - TOP - BOTTOM) + 4} textAnchor="middle" fill={COLORS.ink} fontSize="11">{tick}</text></g>)}
    {axis.ticks.map((hour) => <g key={hour}><line x1={axis.x(axis.start + hour * 3600000)} y1={TOP} x2={axis.x(axis.start + hour * 3600000)} y2={H - BOTTOM} stroke={COLORS.line} /><text x={axis.x(axis.start + hour * 3600000)} y={H - 7} textAnchor="middle" fill={COLORS.ink} fontSize="11">{hourLabel(hour)}</text></g>)}
  </g>;
}

function ScoreChart({ bins, band, axis, highBad, pace = false }: { bins: Bin[]; band: UsualBand | null; axis: ReturnType<typeof axisFor>; highBad: boolean; pace?: boolean }) {
  const y = (v: number) => TOP + (1 - Math.max(0, Math.min(100, v)) / 100) * (H - TOP - BOTTOM);
  const groups: Bin[][] = [];
  for (const point of bins) {
    const last = groups.at(-1)?.at(-1);
    if (!last || point.at - last.at > (pace ? 12 : 3) * 60000 || (!pace && point.observationId !== last.observationId)) groups.push([point]);
    else groups.at(-1)!.push(point);
  }
  return <svg className="today-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={pace ? "Interaction pace over time" : "Voice marker over time"}>
    {band && <><rect x={LEFT} y={y(band.high)} width={W - LEFT - RIGHT} height={Math.max(0, y(band.low) - y(band.high))} fill={COLORS.shade} /><line x1={LEFT} y1={y(band.median)} x2={W - RIGHT} y2={y(band.median)} stroke={COLORS.ink} strokeDasharray="6 5" opacity=".65" /></>}
    <Axis axis={axis} ticks={pace ? [25, 50, 75] : undefined} />
    {groups.map((group, i) => <g key={i}>
      {group.length > 1 && group.some((p) => p.sd != null) && <polygon points={[...group.map((p) => `${axis.x(p.at)},${y(p.mean + (p.sd ?? 0))}`), ...group.toReversed().map((p) => `${axis.x(p.at)},${y(p.mean - (p.sd ?? 0))}`)].join(" ")} fill={COLORS.gray} opacity=".18" />}
      {group.slice(1).map((point, j) => <line key={j} x1={axis.x(group[j]!.at)} y1={y(group[j]!.mean)} x2={axis.x(point.at)} y2={y(point.mean)} stroke={tone(point.mean, band, highBad)} strokeWidth="2.5" strokeLinecap="round" />)}
      <circle cx={axis.x(group.at(-1)!.at)} cy={y(group.at(-1)!.mean)} r="3.5" fill={tone(group.at(-1)!.mean, band, highBad)} />
    </g>)}
  </svg>;
}

export default function TodayView({ clientId }: { clientId: string }) {
  const currentDay = useSyncExternalStore(watchDay, clientDay, serverDay);
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const day = pickedDay ?? currentDay;
  const [marker, setMarker] = useState<TodayMarker>("stress");
  const [data, setData] = useState<TodayData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/v1/dashboard/${clientId}/?panel=today&day=${day}`, { signal: controller.signal, cache: "no-store" })
      .then((res) => { if (!res.ok) throw new Error(String(res.status)); return res.json() as Promise<TodayData>; })
      .then(setData).catch((e) => { if (e.name !== "AbortError") setError(true); });
    return () => controller.abort();
  }, [clientId, day]);
  const activity = data?.activity;
  const axis = useMemo(() => axisFor(day, [...(data?.voice.map((p) => p.at) ?? []), ...(activity?.windows.map((w) => w.at) ?? [])]), [data, activity, day]);
  const readings = data?.voice.filter((p) => p.m[marker] != null) ?? [];
  const values = readings.map((p) => p.m[marker]!);
  const bins = new Map<string, VoicePoint[]>();
  for (const point of readings) { const key = `${point.observationId}:${Math.floor(point.at / 120000)}`; const group = bins.get(key) ?? []; group.push(point); bins.set(key, group); }
  const voiceBins: Bin[] = [...bins.values()].map((group) => ({ at: group[Math.floor(group.length / 2)]!.at, observationId: group[0]!.observationId, mean: statMean(group.map((p) => p.m[marker]!)), sd: group.length > 1 ? statSd(group.map((p) => p.m[marker]!)) : null })).sort((a, b) => a.at - b.at);
  const band = data?.bands[marker] ?? null;
  const checkins = new Set(readings.map((p) => p.observationId)).size;
  const label = MARKERS.find((m) => m.key === marker)!;
  const earliest = new Date(`${currentDay}T00:00:00Z`); earliest.setUTCDate(earliest.getUTCDate() - 89);
  return <div className="today-view">
    <section className="sect">
      <div className="sectHead"><h2 className="sectTitle">{day === currentDay ? "Today over time" : "Day over time"}</h2><input className="today-date" type="date" aria-label="Choose dashboard date" value={day} min={earliest.toISOString().slice(0, 10)} max={currentDay} onChange={(e) => { setData(null); setError(false); setPickedDay(e.target.value); }} /></div>
      <p className="sub">Voice trend: two-minute averages with ±1 SD showing variation. Activity appears while tracking is on.</p>
      <div className="chips today-chips">{MARKERS.map((item) => <button key={item.key} className="chip-btn" aria-pressed={marker === item.key} onClick={() => setMarker(item.key)}>{item.label}</button>)}</div>
      <div className="card today-data-card"><div className="today-card-head"><strong>{label.label}</strong><span>{checkins} {checkins === 1 ? "check-in" : "check-ins"}</span></div>
        {values.length > 0 && <p className="today-meta">Mean {Math.round(statMean(values))} · {values.length < 2 ? "SD unavailable" : `SD ${Math.round(statSd(values))}`} · {values.length} {values.length === 1 ? "reading" : "readings"}</p>}
        {!data && !error ? <p className="today-empty">Loading…</p> : error ? <p className="today-empty">Could not load this day.</p> : !values.length ? <p className="today-empty">No voice readings for this marker on this day.</p> : <ScoreChart bins={voiceBins} band={band} axis={axis} highBad={label.highBad} />}
        {band && <p className="today-legend">Usual range {Math.round(band.low)}–{Math.round(band.high)} (p10–p90) · Teal better · Gray within · Red concerning</p>}
      </div>
    </section>
    <section className="sect"><h2 className="sectTitle">Computer activity</h2><p className="sub">{activity ? `Longest stretch ${durationLabel(activity.longestStretchMs)} · A 5-minute break starts a new stretch` : "No activity data synced for this day."}</p>
      <div className="card today-data-card"><svg className="today-chart activity-chart" viewBox={`0 0 ${W} 90`} role="img" aria-label="Computer activity over time">
        <line x1={LEFT} x2={W - RIGHT} y1="40" y2="40" stroke={COLORS.line} />
        {axis.ticks.map((hour) => <g key={hour}><line x1={axis.x(axis.start + hour * 3600000)} x2={axis.x(axis.start + hour * 3600000)} y1="8" y2="50" stroke={COLORS.line} /><text x={axis.x(axis.start + hour * 3600000)} y="72" textAnchor="middle" fill={COLORS.ink} fontSize="11">{hourLabel(hour)}</text></g>)}
        {activity?.windows.filter((w) => w.activeMs > 0).map((w, i) => <line key={i} x1={axis.x(w.at)} x2={Math.max(axis.x(w.at) + 1, axis.x(w.at + 10000))} y1="40" y2="40" stroke={COLORS.gray} strokeWidth="9" strokeLinecap="round" />)}
      </svg></div>
    </section>
    <section className="sect"><div className="today-card-head"><h2 className="sectTitle">Interaction pace</h2><span>Experimental</span></div><p className="sub">{activity?.paceBand ? "Five-minute averages · Higher = more energetic interaction pattern" : "Building a personal reference from keyboard and mouse activity."}</p>
      <div className="card today-data-card">{activity?.paceBand && activity.pace.length ? <ScoreChart bins={activity.pace} band={activity.paceBand} axis={axis} highBad={false} pace /> : <p className="today-empty">Not enough comparable activity yet.</p>}
        {activity?.paceBand && <p className="today-legend">Usual range {Math.round(activity.paceBand.low)}–{Math.round(activity.paceBand.high)} (p10–p90) · Teal above · Gray within · Red below</p>}
      </div>
    </section>
  </div>;
}

function durationLabel(ms: number) { const minutes = Math.round(ms / 60000); return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`; }
