// Marker vocabulary and the maths that runs in BOTH places.
//
// Deliberately free of any server import: the coach view is a client
// component, so anything it touches must not drag the Mongo driver
// into the browser bundle. Queries live in lib/coach-analytics.ts.

export const MARKER_KEYS = [
  "stress", "confidence", "energy", "fatigue",
  "vocal_strain", "articulation", "breathing",
] as const;
export type MarkerKey = (typeof MARKER_KEYS)[number];

export const MARKER_LABEL: Record<MarkerKey, string> = {
  stress: "Stress", confidence: "Confidence", energy: "Energy", fatigue: "Fatigue",
  vocal_strain: "Vocal strain", articulation: "Articulation", breathing: "Breathing",
};

/** Is a HIGH reading the unhelpful direction for this dial? */
export const HIGH_IS_BAD: Record<MarkerKey, boolean> = {
  stress: true, fatigue: true, vocal_strain: true,
  confidence: false, energy: false, articulation: false, breathing: false,
};

/** Pairs built from overlapping inputs, so part of any agreement is by
 *  construction (voice-markers-reference-v2: energy, confidence and
 *  breathing all read pause structure). */
const SHARED = new Set([
  "confidence|energy", "breathing|confidence", "breathing|energy", "energy|fatigue",
]);
export const sharesInputs = (a: string, b: string) => SHARED.has([a, b].sort().join("|"));

export const isMarker = (v: unknown): v is MarkerKey =>
  typeof v === "string" && (MARKER_KEYS as readonly string[]).includes(v);

// ── Derived from day rows (no extra query) ────────────────────────

export interface DayRow {
  day: string;
  n: number;
  m: Partial<Record<MarkerKey, number>>;
}

export interface Recovery {
  n: number;
  /** Seconds per spike, ascending. The design buckets these itself. */
  times: number[];
  /** This person's own measurement floor: the median window spacing. */
  resolutionSec: number;
  /** Spikes that never settled before the check-in ended. */
  censored: number;
}

/** Exported so the server-side panels share one definition. */
export const statMean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
export const statSd = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = statMean(a);
  return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / (a.length - 1));
};

export type UsualBand = { median: number; low: number; high: number };

/** Personal p10–p90 range, with the same 10-point half-width floor as the app. */
export function usualBand(values: number[], minSamples = 15): UsualBand | null {
  const sorted = values.filter(Number.isFinite).map((v) => Math.max(0, Math.min(100, v))).sort((a, b) => a - b);
  if (sorted.length < minSamples) return null;
  const percentile = (p: number) => {
    const rank = (sorted.length - 1) * p / 100;
    const lower = Math.floor(rank);
    const upper = Math.min(lower + 1, sorted.length - 1);
    return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * (rank - lower);
  };
  const median = percentile(50);
  return {
    median,
    low: median - Math.max(median - percentile(10), 10),
    high: median + Math.max(percentile(90) - median, 10),
  };
}

export interface Triage {
  key: MarkerKey; name: string; recent: number; usual: number;
  delta: number; low: number; high: number; level: 0 | 2; bad: boolean; spark: number[];
}

/** Recent daily readings against the earlier days' personal p10–p90 range. */
export function triage(days: DayRow[], windowDays = 7): Triage[] {
  if (days.length < 3) return [];
  const lastOrd = Date.parse(days[days.length - 1]!.day);
  const cut = lastOrd - (windowDays - 1) * 864e5;
  const recentD = days.filter((d) => Date.parse(d.day) >= cut);
  const baseD = days.filter((d) => Date.parse(d.day) < cut);
  if (!recentD.length || baseD.length < 2) return [];

  return MARKER_KEYS.flatMap((key) => {
    const rv = recentD.map((d) => d.m[key]).filter((v): v is number => v != null);
    const bv = baseD.map((d) => d.m[key]).filter((v): v is number => v != null);
    if (!rv.length || bv.length < 2) return [];
    const band = usualBand(bv);
    if (!band) return [];
    const recent = statMean(rv), usual = band.median;
    const delta = recent - usual;
    return [{
      key,
      name: MARKER_LABEL[key],
      recent, usual, delta, low: band.low, high: band.high,
      level: recent < band.low || recent > band.high ? 2 : 0,
      bad: HIGH_IS_BAD[key] ? recent > band.high : recent < band.low,
      spark: days.slice(-14).map((d) => d.m[key]).filter((v): v is number => v != null),
    }];
  });
}

export interface Zone {
  key: MarkerKey; name: string; baseline: number | null; low: number | null; high: number | null;
  points: { day: string; v: number; out: boolean; bad: boolean }[];
}

/** Daily dots plus the client's usual band, for one dial. */
export function zoneFor(days: DayRow[], key: MarkerKey, windowDays: number): Zone {
  const all = days.map((d) => d.m[key]).filter((v): v is number => v != null);
  const band = usualBand(all);
  const cut = days.length ? Date.parse(days[days.length - 1]!.day) - (windowDays - 1) * 864e5 : 0;

  return {
    key,
    name: MARKER_LABEL[key],
    baseline: band?.median ?? null,
    low: band?.low ?? null,
    high: band?.high ?? null,
    points: days
      .filter((d) => Date.parse(d.day) >= cut && d.m[key] != null)
      .map((d) => {
        const v = d.m[key]!;
        return {
          day: d.day,
          v,
          out: band != null && (v < band.low || v > band.high),
          bad: band != null && (HIGH_IS_BAD[key] ? v > band.high : v < band.low),
        };
      }),
  };
}

/** Fixed hue order, shared by every chart. A marker's colour is its identity, not its rank. */
// Validated as a 7-slot categorical set on both surfaces: lightness
// band, chroma floor, colour-blind separation, normal-vision floor and
// contrast all pass. Do not hand-tweak a value without re-running
// scripts/validate_palette.js — the earlier greyish fatigue and green
// articulation both failed the chroma floor and read as the same mark.
export const SERIES: Record<string, string> = {
  stress: "#C0522A",
  confidence: "#0E9280",
  energy: "#8A5FC7",
  fatigue: "#8F6D14",
  breathing: "#2F79C4",
  vocal_strain: "#B5478E",
  articulation: "#4E8F3F",
};
