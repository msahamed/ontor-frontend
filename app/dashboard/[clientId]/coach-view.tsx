// The coach's read on one person.
//
// A direct port of "Ontor Coach.dc.html" from the Claude Design
// project: same panels, same geometry, same palette, same copy, same
// tooltips. Numbers differ from the design file only because this
// reads live Mongo instead of its bundled sample data.
//
// Do not restyle these charts. They were approved as drawn, and the
// constants below are the design's own.
//
// Fetch strategy, which is what the chips and the 7/30 toggle are for:
//   - Day rows arrive with the page. Triage, the zone chips and the
//     range toggle all re-derive in the browser, so switching a dial
//     costs nothing and hits no network.
//   - Recovery and the marker map load once when reached, cached per
//     range.
//
// The trailing slash in the fetch URLs is required, not cosmetic: the
// site runs trailingSlash:true, so the bare form 308-redirects.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TodayView from "./today-view";
import type { ActivityDay } from "@/lib/today-analytics";
import {
  usualBand,
  statMean,
  triage as computeTriage,
  type DayRow,
  type MarkerKey,
  type Recovery,
} from "@/lib/markers";

// ── The design's palette, verbatim ────────────────────────────────
const INK = "#1B1A17";
const MUTED = "#8A8577";
const LINE = "#F1ECE2";
const TEAL = "#0F766E";
const TEAL_DEEP = "#0B5048";
const TEAL_TINT = "#E8F1EF";
const CLAY = "#B7492F";
const CARD_LINE = "#E4DDD0";
const CONNECT = "#C9C2B2";
const DOT_PLAIN = "#A9A290";
const SELF_FILL = "#F7F4EE";

/** The four dials summarized at the top. */
const DIALS: { key: MarkerKey; name: string }[] = [
  { key: "stress", name: "Stress" },
  { key: "confidence", name: "Confidence" },
  { key: "energy", name: "Energy" },
  { key: "fatigue", name: "Fatigue" },
];

/** The five dials the zone chart offers. */
const ZONES: { key: MarkerKey; name: string }[] = [
  { key: "stress", name: "Stress" },
  { key: "confidence", name: "Confidence" },
  { key: "energy", name: "Energy" },
  { key: "fatigue", name: "Fatigue" },
  { key: "hesitation", name: "Hesitation" },
];

const MAT_KEYS: MarkerKey[] = [
  "stress", "confidence", "energy", "fatigue", "vocal_strain", "articulation", "hesitation",
];
const MAT_NAMES: Record<MarkerKey, string> = {
  stress: "Stress", confidence: "Conf", energy: "Energy", fatigue: "Fatigue",
  vocal_strain: "Strain", articulation: "Artic", hesitation: "Hesitation",
};
/** The design's own circular-pair set. */
const CIRC = new Set([
  "confidence|energy", "confidence|fatigue", "energy|fatigue",
  "confidence|breathing", "energy|breathing", "fatigue|breathing",
]);
const pairKey = (a: string, b: string) => [a, b].sort().join("|");

const HI_BAD: Record<MarkerKey, boolean> = {
  stress: true, fatigue: true, vocal_strain: true,
  confidence: false, energy: false, hesitation: true, articulation: false,
};

const ord = (d: string) => Date.parse(d + "T00:00:00Z") / 86400000;
const short = (d: string) => d.slice(5).replace("-", "/");

type Range = 7 | 30;
type HourRow = { hour: number; n: number; m: Partial<Record<MarkerKey, number>> };
type HourData = { offset: number; fit: number; hours: HourRow[] };

/** The factors offered next to confidence, as the design lists them. */
const TOD_OVERLAYS: { key: MarkerKey; name: string }[] = [
  { key: "hesitation", name: "Hesitation" },
  { key: "energy", name: "Energy" },
  { key: "stress", name: "Stress" },
  { key: "fatigue", name: "Fatigue" },
  { key: "vocal_strain", name: "Vocal strain" },
];

type Perspective = "self" | "member";

export default function CoachView({
  days,
  clientId,
  perspective = "member",
  title = "You",
  summary,
  latestActivity,
}: {
  days: DayRow[];
  clientId: string;
  perspective?: Perspective;
  title?: string;
  summary: string;
  latestActivity?: ActivityDay | null;
}) {
  const [tab, setTab] = useState<"you" | "today" | "history">("today");
  const [range, setRange] = useState<Range>(30);
  const [zoneKey, setZoneKey] = useState<MarkerKey>("stress");

  const tri = computeTriage(days, 7);
  const cards = DIALS.flatMap((d) => {
    const t = tri.find((x) => x.key === d.key);
    const lastDay = days.at(-1)?.day;
    const recent = days.filter((row) => lastDay && ord(row.day) >= ord(lastDay) - 6)
      .map((row) => row.m[d.key]).filter((value): value is number => value != null);
    return recent.length ? [{ ...d, t, value: statMean(recent) }] : [];
  });

  return (
    <>
      <div className="topbar"><div><h1>{tab === "today" ? "Today" : tab === "history" ? "History" : title}</h1>
        <p className="sub">{tab === "today" ? "Your day at a glance." : tab === "history" ? "Patterns across your check-ins." : summary}</p>
      </div></div>
      <nav className="dashboard-tabs" aria-label="Dashboard views">
        {(["you", "today", "history"] as const).map((item) =>
          <button key={item} type="button" aria-current={tab === item ? "page" : undefined}
            onClick={() => setTab(item)}>{item[0]!.toUpperCase() + item.slice(1)}</button>)}
      </nav>
      {tab === "you" && <>
      <section className="sect">
        <h2 className="sectTitle">Your markers</h2>
        <p className="sub">Recent readings compared with your usual.</p>
        <div className="dials">
          {cards.map((card) => {
            const t = card.t;
            const d = t ? Math.round(Math.abs(t.delta)) : 0;
            const good = t ? (HI_BAD[card.key] ? t.delta < 0 : t.delta > 0) : false;
            const badge = !t ? "Learning range" : t.level === 2 ? (good ? "Better than usual" : "Worth a look") : "Within usual range";
            const badgeBg = t?.level === 2 ? (good ? TEAL_TINT : "#F8EBE7") : LINE;
            const badgeColor = t?.level === 2 ? (good ? TEAL_DEEP : CLAY) : MUTED;
            const border = t?.level === 2 ? (good ? TEAL : CLAY) : CARD_LINE;
            return (
              <div className="dial" key={card.key} style={{ borderColor: border }}>
                <div className="dialtop">
                  <span className="dialname">{card.name}</span>
                  <span className="dialbadge" style={{ background: badgeBg, color: badgeColor }}>{badge}</span>
                </div>
                <div className="dialrow">
                  <div>
                    <div className="dialval num">{Math.round(t?.recent ?? card.value)}</div>
                    <div className="dialdelta num">
                      {t ? <>{t.delta >= 0 ? "+" : "−"}{d} vs usual {Math.round(t.usual)}</> : "Building your usual range"}
                    </div>
                  </div>
                  <Spark points={sparkPoints(days, card.key, 10)} w={92} h={30} color={t?.level === 2 ? (good ? TEAL : CLAY) : DOT_PLAIN} />
                </div>
              </div>
            );
          })}
          <div className="dial"><div className="dialname">Computer activity</div><div className="dialval num">{latestActivity ? durationLabel(latestActivity.longestStretchMs) : "No data"}</div><div className="dialdelta">{latestActivity ? `Longest stretch on ${latestActivity.day}` : "Tracking has no synced data yet"}</div></div>
          <div className="dial"><div className="dialname">Interaction pace</div><div className="dialval num">{latestActivity?.latestPace == null ? "Learning" : Math.round(latestActivity.latestPace)}</div><div className="dialdelta">{latestActivity?.paceBand ? "Higher = more energetic interaction pattern · Experimental" : "Building an interaction reference"}</div></div>
        </div>
      </section>
      </>}

      {tab === "today" && <TodayView clientId={clientId} />}

      {tab === "history" && <>

      <section className="sect">
        <div className="eyebrow">Day by day, against {perspective === "self" ? "your" : "their"} usual</div>
        <div className="sectHead">
          <h2 className="sectTitle">Each dial, in one look</h2>
          <div className="seg">
            <button onClick={() => setRange(7)} aria-pressed={range === 7}>Last 7 days</button>
            <button onClick={() => setRange(30)} aria-pressed={range === 30}>Last 30 days</button>
          </div>
        </div>
        <p className="sub">
          Each dot is one day&apos;s average. The shaded band is {perspective === "self" ? "your" : "their"} usual range
          (p10–p90) across daily readings. Gray is within that range; teal is better than usual and reddish is concerning.
          Dashed stretches are days with no check-ins. Hover any dot for detail.
        </p>
        <div className="chips">
          {ZONES.map((z) => (
            <button key={z.key} className="chip-btn" aria-pressed={z.key === zoneKey}
              onClick={() => setZoneKey(z.key)}>{z.name}</button>
          ))}
        </div>
        <div className="card">
          <ZoneChart days={days} zoneKey={zoneKey} range={range} />
        </div>
      </section>

      <TimeOfDayPanel clientId={clientId} />
      <RecoveryPanel clientId={clientId} perspective={perspective} />
      <MatrixPanel clientId={clientId} />
      </>}
    </>
  );
}

function durationLabel(ms: number) {
  const minutes = Math.round(ms / 60000);
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

// ── Lazy panels ───────────────────────────────────────────────────

/**
 * Fetch a panel's data the first time it is actually looked at.
 *
 * Two things this avoids. Fetching on mount pulls the matrix and
 * recovery for every visit even when nobody scrolls that far, which is
 * network and Mongo work for nothing. And the cache is module-level,
 * not per-component, so navigating to the roster and back reuses what
 * was already fetched instead of asking again.
 *
 * The observer margin starts the request slightly before the panel
 * reaches the viewport, so the data is usually there by the time it is.
 */
const panelCache = new Map<string, unknown>();

function useLazyPanel<T>(url: string) {
  const [data, setData] = useState<T | null>(() => (panelCache.get(url) as T) ?? null);
  const [state, setState] = useState<"idle" | "loading" | "error">(
    panelCache.has(url) ? "idle" : "idle",
  );
  const ref = useRef<HTMLDivElement | null>(null);
  const seen = useRef(false);

  const load = useCallback(async () => {
    const hit = panelCache.get(url);
    if (hit) { setData(hit as T); setState("idle"); return; }
    setState("loading");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(String(res.status));
      const json = (await res.json()) as T;
      panelCache.set(url, json);
      setData(json);
      setState("idle");
    } catch {
      setState("error");
    }
  }, [url]);

  // Re-run whenever the url changes (a chip or range switch), but only
  // once the panel has been seen at least once.
  useEffect(() => {
    if (seen.current) void load();
  }, [load]);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen.current) return;
    if (typeof IntersectionObserver === "undefined") {
      seen.current = true;
      void load();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          seen.current = true;
          io.disconnect();
          void load();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [load]);

  return { data, state, ref };
}

function TimeOfDayPanel({ clientId }: { clientId: string }) {
  const [overlay, setOverlay] = useState<MarkerKey>("hesitation");
  const [range, setRange] = useState<Range>(30);
  const keys: MarkerKey[] = ["confidence", overlay];
  const { data, state, ref } = useLazyPanel<HourData>(
    `/api/v1/dashboard/${clientId}/?panel=hour&days=${range}&keys=${keys.join(",")}`,
  );

  return (
    <section className="sect" ref={ref}>
      <div className="eyebrow">Time of day</div>
      <div className="sectHead">
        <h2 className="sectTitle">When confidence is strongest</h2>
        <div className="seg">
          <button onClick={() => setRange(7)} aria-pressed={range === 7}>Last 7 days</button>
          <button onClick={() => setRange(30)} aria-pressed={range === 30}>Last 30 days</button>
        </div>
      </div>
      <p className="sub">
        By hour of the day, all check-ins pooled. Pick a factor to see it next to confidence. Useful
        for timing sessions and hard conversations, not for judging progress.
      </p>
      <div className="chips">
        {TOD_OVERLAYS.map((o) => (
          <button key={o.key} className="chip-btn" aria-pressed={o.key === overlay}
            onClick={() => setOverlay(o.key)}>{o.name}</button>
        ))}
      </div>
      <div className="card">
        {state === "loading" && <p className="sub">Loading…</p>}
        {state === "error" && <p className="sub">Could not load this panel.</p>}
        {data && data.hours.length === 0 && (
          <p className="sub">
            Not enough check-ins in this range to place them on an hourly axis.
          </p>
        )}
        {data && data.hours.length > 0 && <HourChart hours={data.hours} overlay={overlay} />}
      </div>
    </section>
  );
}

function RecoveryPanel({ clientId, perspective }: { clientId: string; perspective: Perspective }) {
  const [range, setRange] = useState<Range>(30);
  const { data, state, ref } = useLazyPanel<Recovery>(
    `/api/v1/dashboard/${clientId}/?panel=recovery&days=${range}&marker=stress`,
  );
  const built = data && data.n > 0 ? buildRecovery(data) : null;

  return (
    <section className="sect" ref={ref}>
      <div className="eyebrow">Recovery</div>
      <div className="sectHead">
        <h2 className="sectTitle">How fast a spike comes down</h2>
        <div className="seg">
          <button onClick={() => setRange(7)} aria-pressed={range === 7}>Last 7 days</button>
          <button onClick={() => setRange(30)} aria-pressed={range === 30}>Last 30 days</button>
        </div>
      </div>
      {state === "loading" && <p className="sub">Loading…</p>}
      {state === "error" && <p className="sub">Could not load this panel.</p>}
      {data && data.n === 0 && (
        <p className="sub">
          No stress spikes with enough surrounding detail in this range. Recovery needs a check-in
          long enough to be scored more than once.
        </p>
      )}
      {built && (
        <>
          <p className="sub">
            Everyone spikes. The trainable part is how fast the voice settles back to its own
            baseline. All {built.total} {built.total === 1 ? "spike" : "spikes"} from this run in one
            bar, sorted by how long they took to come down. About {built.floor} seconds is the
            fastest these check-ins can measure, so the first segment means &ldquo;at least that
            fast&rdquo;. That floor comes from {perspective === "self" ? "your" : "this person's"} check-in timing, not a fixed number.
          </p>
          <div className="card">
            <RecBar built={built} />
            <div className="legend" style={{ paddingTop: 12 }}>
              {built.buckets.map((b) => (
                <span key={b.label}>
                  <i style={{ background: b.n ? b.c : LINE }} />
                  {b.label} · <b>{b.pct}%</b> ({b.n})
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

function MatrixPanel({ clientId }: { clientId: string }) {
  const { data, state, ref } = useLazyPanel<{ keys: MarkerKey[]; matrix: number[][] }>(
    `/api/v1/dashboard/${clientId}/?panel=matrix&days=90`,
  );
  return (
    <section className="sect" ref={ref}>
      <div className="eyebrow">Seven dials, one map</div>
      <h2 className="sectTitle">How the markers move together</h2>
      <p className="sub">
        Every marker against every other, across the whole run. A dashed ring means the pair shares
        inputs, so part of that agreement is by construction.
      </p>
      <div className="card">
        {state === "loading" && <p className="sub">Loading…</p>}
        {state === "error" && <p className="sub">Could not load this panel.</p>}
        {data && <MatChart m={data.matrix} />}
      </div>
    </section>
  );
}

// ── Marks, ported from the design ─────────────────────────────────

function sparkPoints(days: DayRow[], key: MarkerKey, take: number) {
  return days.filter((d) => d.m[key] != null).slice(-take).map((d) => ({ d: d.day, v: d.m[key]! }));
}

function Spark({ points, w, h, color }: { points: { d: string; v: number }[]; w: number; h: number; color: string }) {
  if (points.length < 2) return <span style={{ display: "block", width: w, height: h }} />;
  const vs = points.map((p) => p.v);
  const lo = Math.min(...vs) - 3, hi = Math.max(...vs) + 3;
  const o0 = ord(points[0]!.d), o1 = ord(points[points.length - 1]!.d);
  const x = (d: string) => 2 + ((ord(d) - o0) / Math.max(1, o1 - o0)) * (w - 4);
  const y = (v: number) => 2 + (1 - (v - lo) / (hi - lo || 1)) * (h - 4);
  const last = points[points.length - 1]!;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }} aria-hidden="true">
      <path d={points.map((p, i) => `${i ? "L" : "M"}${x(p.d).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ")}
        fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx={x(last.d)} cy={y(last.v)} r="2.4" fill={color} />
    </svg>
  );
}

function ZoneChart({ days, zoneKey, range }: { days: DayRow[]; zoneKey: MarkerKey; range: Range }) {
  const W = 1040, H = 300, R = 96, L = 36, T = 14, B = 32;
  const withVal = days.filter((d) => d.m[zoneKey] != null);
  if (!withVal.length) return <p className="note">No readings for this dial yet.</p>;

  const lastOrd = ord(withVal[withVal.length - 1]!.day);
  const shownDays = withVal.filter((d) => ord(d.day) > lastOrd - range);
  if (shownDays.length < 2) return <p className="note">Not enough days in this range.</p>;

  const allVals = withVal.map((d) => d.m[zoneKey]!);
  const band = usualBand(allVals);
  const base = band?.median ?? 50;
  const shown = shownDays.map((d) => ({ d: d.day, v: d.m[zoneKey]!, n: d.n }));

  const O0 = ord(shown[0]!.d), O1 = ord(shown[shown.length - 1]!.d);
  const span = Math.max(1, O1 - O0);
  const x = (d: string) => L + ((ord(d) - O0) / span) * (W - L - R);
  const lo0 = Math.min(...(band ? [band.low] : []), ...shown.map((p) => p.v));
  const hi0 = Math.max(...(band ? [band.high] : []), ...shown.map((p) => p.v));
  const ymin = Math.max(0, Math.floor((lo0 - 8) / 10) * 10);
  const ymax = Math.min(100, Math.ceil((hi0 + 8) / 10) * 10);
  const step = ymax - ymin > 45 ? 20 : 10;
  const y = (v: number) => T + (1 - (v - ymin) / (ymax - ymin || 1)) * (H - T - B);

  const grid: number[] = [];
  for (let g = Math.ceil(ymin / step) * step; g <= ymax; g += step) grid.push(g);

  const hiBad = HI_BAD[zoneKey];
  const every = Math.ceil(shown.length / 7);
  const claimed: [number, number][] = [];
  const free = (lx: number, ly: number) =>
    !claimed.some((c) => Math.abs(c[0] - lx) < 70 && Math.abs(c[1] - ly) < 13);

  const labels: React.ReactNode[] = [];
  const dots = shown.map((p, i) => {
    const outHi = band != null && p.v > band.high, outLo = band != null && p.v < band.low, out = outHi || outLo;
    const bad = outHi ? hiBad : outLo ? !hiBad : false;
    const dotCol = out ? (bad ? CLAY : TEAL) : DOT_PLAIN;
    if (out) {
      const above = p.v > base;
      const lx = Math.min(Math.max(x(p.d), L + 34), W - R - 34);
      let ly = y(p.v) + (above ? -12 : 22);
      const dir = above ? -13 : 13;
      let guard = 0;
      while (!free(lx, ly) && guard++ < 8) ly += dir;
      claimed.push([lx, ly]);
      labels.push(
        <text key={`ol${i}`} x={lx} y={ly} textAnchor="middle" fontSize="11.5" fontWeight="700"
          fill={bad ? CLAY : TEAL_DEEP}>{`${short(p.d)} · ${Math.round(p.v)}`}</text>,
      );
    }
    return (
      <circle key={`m${i}`} cx={x(p.d)} cy={y(p.v)} r={out ? 6 : 4} fill={dotCol} stroke="#FFFFFF" strokeWidth="2">
        <title>
          {`${p.d}: average ${Math.round(p.v)} from ${p.n} reading${p.n === 1 ? "" : "s"}` +
            (out ? (bad ? ". Outside the usual zone, the wrong way." : ". Outside the usual zone, the good way.") : "")}
        </title>
      </circle>
    );
  });

  const zlY = band ? y(band.high) + 16 : 0;
  const zlLeftFree = free(L + 50, zlY);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "auto" }} role="img"
      aria-label={band ? `Daily averages against a usual range of ${Math.round(band.low)} to ${Math.round(band.high)}.` : "Daily averages; usual range is still building."}>
      {grid.map((g) => (
        <g key={`g${g}`}>
          <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke={LINE} />
          <text x={L - 7} y={y(g) + 4} textAnchor="end" fontSize="12" fill={MUTED}>{g}</text>
        </g>
      ))}
      {band && <>
        <rect x={L} y={y(band.high)} width={W - L - R} height={y(band.low) - y(band.high)} fill={LINE}>
          <title>{`Usual range: ${Math.round(band.low)} to ${Math.round(band.high)}, personal p10–p90 of daily readings.`}</title>
        </rect>
        <line x1={L} x2={W - R} y1={y(base)} y2={y(base)} stroke={MUTED} strokeWidth="1.5" strokeDasharray="6 5" />
        <text x={W - R + 8} y={y(base) + 4} fontSize="12.5" fontWeight="700" fill={MUTED}>
          {`usual ${Math.round(base)}`}
        </text>
      </>}
      {shown.slice(1).map((p, k) => {
        const i = k + 1;
        const consec = ord(p.d) - ord(shown[i - 1]!.d) === 1;
        return (
          <line key={`ln${i}`} x1={x(shown[i - 1]!.d)} y1={y(shown[i - 1]!.v)} x2={x(p.d)} y2={y(p.v)}
            stroke={CONNECT} strokeWidth={consec ? 1.8 : 1.1}
            strokeDasharray={consec ? undefined : "2 5"} opacity={consec ? 0.9 : 0.55} />
        );
      })}
      {dots}
      {labels}
      {shown.map((p, i) =>
        i % every === 0 ? (
          <text key={`d${i}`} x={x(p.d)} y={H - 12} textAnchor="middle" fontSize="11.5" fill={MUTED}>
            {short(p.d)}
          </text>
        ) : null,
      )}
      {band && <text x={zlLeftFree ? L + 8 : W - R - 8} y={zlY} textAnchor={zlLeftFree ? "start" : "end"}
        fontSize="11.5" fill={MUTED}>
        {`zone ${Math.round(band.low)} to ${Math.round(band.high)}`}
      </text>}
    </svg>
  );
}

/**
 * The design's hourChart, on a real hour axis.
 *
 * The server stores created_at in UTC and the device throws its offset
 * away before syncing, so the hour is recovered by solving for the one
 * whole-hour offset that reproduces the local date and time-of-day
 * bucket the device recorded (see solveUtcOffset). The API only returns
 * hours when that solve explains at least 90% of check-ins.
 */
function HourChart({ hours, overlay }: { hours: HourRow[]; overlay: MarkerKey }) {
  if (hours.length < 2) return <p className="sub">Not enough hours with readings yet.</p>;

  const W = 1040, H = 320, L = 40, R = 40, T = 26, B = 36;
  const series = [
    { key: "confidence" as MarkerKey, name: "Confidence", c: TEAL },
    { key: overlay, name: TOD_OVERLAYS.find((o) => o.key === overlay)?.name ?? overlay, c: "#F59E0B" },
  ];
  const H0 = hours[0]!.hour, H1 = hours[hours.length - 1]!.hour;
  const x = (h: number) => L + ((h - H0) / Math.max(1, H1 - H0)) * (W - L - R);

  const allV = hours.flatMap((r) => series.map((s) => r.m[s.key]).filter((v): v is number => v != null));
  if (!allV.length) return <p className="sub">Not enough readings for this factor yet.</p>;
  const ymin = Math.max(0, Math.floor((Math.min(...allV) - 8) / 10) * 10);
  const ymax = Math.min(100, Math.ceil((Math.max(...allV) + 8) / 10) * 10);
  const y = (v: number) => T + (1 - (v - ymin) / (ymax - ymin || 1)) * (H - T - B);
  const step = ymax - ymin > 45 ? 20 : 10;

  const grid: number[] = [];
  for (let g = Math.ceil(ymin / step) * step; g <= ymax; g += step) grid.push(g);
  const ticks: number[] = [];
  for (let h = H0; h <= H1; h += 2) ticks.push(h);
  const hourLabel = (h: number) => (h === 12 ? "noon" : h > 12 ? `${h - 12}pm` : `${h || 12}am`);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "auto" }} role="img"
      aria-label={`Confidence and ${series[1]!.name.toLowerCase()} by hour of the day.`}>
      {grid.map((g) => (
        <g key={`g${g}`}>
          <line x1={L} x2={W - R} y1={y(g)} y2={y(g)} stroke={LINE} />
          <text x={L - 8} y={y(g) + 5} textAnchor="end" fontSize="14" fill={MUTED}>{g}</text>
        </g>
      ))}
      {ticks.map((h) => (
        <text key={`h${h}`} x={x(h)} y={H - 12} textAnchor="middle" fontSize="14" fill={MUTED}>
          {hourLabel(h)}
        </text>
      ))}
      {series.map((s) => {
        const pts = hours
          .map((r) => ({ h: r.hour, v: r.m[s.key], n: r.n }))
          .filter((p): p is { h: number; v: number; n: number } => p.v != null);
        return (
          <g key={s.key}>
            {pts.slice(1).map((p, k) => {
              const prev = pts[k]!;
              const gap = p.h - prev.h > 1;
              return (
                <line key={`l${k}`} x1={x(prev.h)} y1={y(prev.v)} x2={x(p.h)} y2={y(p.v)} stroke={s.c}
                  strokeWidth={gap ? 1.3 : 2.2} strokeDasharray={gap ? "3 6" : undefined}
                  opacity={gap ? 0.5 : 1} />
              );
            })}
            {pts.map((p, k) => (
              <circle key={`c${k}`} cx={x(p.h)} cy={y(p.v)} r="3.6" fill={s.c} stroke="#FFFFFF" strokeWidth="2">
                <title>{`${hourLabel(p.h)} · ${s.name.toLowerCase()} ${Math.round(p.v)} · from ${p.n} reading${p.n === 1 ? "" : "s"}`}</title>
              </circle>
            ))}
          </g>
        );
      })}
      {series.map((s, i) => (
        <g key={`lg${i}`} transform={`translate(${L + i * 170} ${14})`}>
          <rect width="10" height="10" rx="3" y="-9" fill={s.c} />
          <text x="16" y="0" fontSize="13.5" fill={MUTED}>{s.name}</text>
        </g>
      ))}
    </svg>
  );
}

function buildRecovery(R: Recovery) {
  const res = R.resolutionSec || 10;
  const t1 = Math.round(res), t2 = Math.round(res * 3), t3 = Math.round(res * 6);
  const s = R.times;
  const buckets = [
    { label: `Back within ~${t1} seconds`, n: s.filter((v) => v <= res + 0.5).length, c: TEAL },
    { label: `Within ~${t2} seconds`, n: s.filter((v) => v > res + 0.5 && v <= t2).length, c: "#4fa583" },
    { label: `Within ~${t3} seconds`, n: s.filter((v) => v > t2 && v <= t3).length, c: "#B0A98F" },
    { label: "Took longer", n: s.filter((v) => v > t3).length, c: "#7E786B" },
    { label: "Never settled that session", n: R.censored, c: CLAY },
  ];
  const total = buckets.reduce((a, b) => a + b.n, 0) || 1;
  return {
    floor: t1,
    total,
    buckets: buckets.map((b) => ({ ...b, pct: Math.round((b.n / total) * 100) })),
  };
}

function RecBar({ built }: { built: ReturnType<typeof buildRecovery> }) {
  const W = 1040, H = 88, L = 4, RG = 4, T = 8, BH = 44;
  const shown = built.buckets.filter((b) => b.n > 0);

  // Widths and offsets resolved up front, as prefix sums. The design
  // accumulated an `x` cursor while drawing; that is a mutation during
  // render, which React's compiler rightly rejects. At five segments
  // the quadratic prefix sum is free and the drawing stays pure.
  const widths = shown.map((b) => (b.n / built.total) * (W - L - RG));
  const laid = shown.map((b, i) => ({
    ...b,
    w: widths[i]!,
    at: L + widths.slice(0, i).reduce((sum, x) => sum + x, 0),
  }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "auto" }} role="img"
      aria-label="Spikes by how long they took to settle, fastest on the left.">
      {laid.map((b, i) => (
        <g key={`b${i}`}>
          <rect x={b.at + 1} y={T} width={Math.max(3, b.w - 2)} height={BH} rx="6" fill={b.c}>
            <title>{`${b.label}: ${b.pct}% (${b.n} of ${built.total})`}</title>
          </rect>
          {b.w > 52 && (
            <text x={b.at + b.w / 2} y={T + BH / 2 + 6} textAnchor="middle" fontSize="16" fontWeight="700" fill="#FFFFFF">
              {b.pct}%
            </text>
          )}
        </g>
      ))}
      <text x={L} y={T + BH + 26} fontSize="16" fill={MUTED}>← settled fastest</text>
      <text x={W - RG} y={T + BH + 26} textAnchor="end" fontSize="16" fill={MUTED}>slowest, or never →</text>
    </svg>
  );
}

function MatChart({ m }: { m: number[][] }) {
  const W = 1040, L = 110, T = 34, ch = 52;
  const cw = (W - L - 8) / MAT_KEYS.length;
  const H = T + MAT_KEYS.length * ch + 8;

  const mix = (hex: string, pct: number) => {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    const p = pct / 100;
    return `rgb(${Math.round(r * p + 255 * (1 - p))},${Math.round(g * p + 255 * (1 - p))},${Math.round(b * p + 255 * (1 - p))})`;
  };

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ display: "block", width: "100%", height: "auto" }} role="img"
      aria-label="Correlation between every pair of markers.">
      {MAT_KEYS.map((k, j) => (
        <text key={`h${j}`} x={L + j * cw + cw / 2} y={T - 12} textAnchor="middle" fontSize="14" fontWeight="700" fill={MUTED}>
          {MAT_NAMES[k]}
        </text>
      ))}
      {MAT_KEYS.map((a, i) => (
        <g key={`row${i}`}>
          <text x={L - 12} y={T + i * ch + ch / 2 + 5} textAnchor="end" fontSize="14" fontWeight="700" fill={MUTED}>
            {MAT_NAMES[a]}
          </text>
          {MAT_KEYS.map((b, j) => {
            const v = m[i]?.[j] ?? 0;
            const cx = L + j * cw, cy = T + i * ch;
            if (i === j) {
              return (
                <g key={`c${i}-${j}`}>
                  <rect x={cx + 2} y={cy + 2} width={cw - 4} height={ch - 4} rx="6" fill={SELF_FILL} />
                  <text x={cx + cw / 2} y={cy + ch / 2 + 5} textAnchor="middle" fontSize="14" fill={CONNECT}>—</text>
                </g>
              );
            }
            const pct = Math.min(88, Math.abs(v) * 110);
            const shared = CIRC.has(pairKey(a, b));
            return (
              <g key={`c${i}-${j}`}>
                <rect x={cx + 2} y={cy + 2} width={cw - 4} height={ch - 4} rx="6"
                  fill={mix(v >= 0 ? TEAL : CLAY, pct)}
                  stroke={shared ? MUTED : "none"} strokeWidth={shared ? 1.4 : 0}
                  strokeDasharray={shared ? "4 4" : undefined}>
                  <title>
                    {`${MAT_NAMES[a]} × ${MAT_NAMES[b]}: ${(v > 0 ? "+" : "") + v.toFixed(2)}` +
                      (shared ? ". Shares inputs, partly by construction." : "")}
                  </title>
                </rect>
                <text x={cx + cw / 2} y={cy + ch / 2 + 5} textAnchor="middle" fontSize="14.5" fontWeight="700"
                  fill={Math.abs(v) > 0.45 ? "#FFFFFF" : INK}>
                  {(v > 0 ? "+" : "") + v.toFixed(2).replace("0.", ".")}
                </text>
              </g>
            );
          })}
        </g>
      ))}
    </svg>
  );
}
