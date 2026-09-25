import { getDb } from "@/lib/auth";
import { usualBand, type UsualBand } from "@/lib/markers";

export const TODAY_MARKERS = ["stress", "confidence", "energy", "fatigue", "vocal_strain", "articulation", "hesitation"] as const;
export type TodayMarker = (typeof TODAY_MARKERS)[number];
export type VoicePoint = { at: number; observationId: string; m: Partial<Record<TodayMarker, number>> };
export type ActivityDay = {
  day: string; activeMs: number; longestStretchMs: number;
  windows: { at: number; activeMs: number }[];
  pace: { at: number; mean: number; sd: number | null }[];
  paceBand: UsualBand | null; latestPace: number | null;
};

function isNumber(v: unknown): v is number { return typeof v === "number" && Number.isFinite(v); }

/** The same frame timeline the desktop Today view reads locally. */
export async function getTodayData(userId: string, day: string) {
  const db = await getDb();
  const start = new Date(`${day}T00:00:00Z`);
  const since = new Date(start.getTime() - 90 * 864e5);
  const cursor = db.collection("observations").find(
    { user_id: userId, deleted_at: null, created_at: { $gte: since }, $or: [{ "extraction.event_date": { $lte: day } }, { "extraction.event_date": { $exists: false } }] },
    { projection: { _id: 1, created_at: 1, utc_offset_minutes: 1, "extraction.event_date": 1, frames: 1, markers: 1 } },
  );
  const voice: VoicePoint[] = [];
  const prior = Object.fromEntries(TODAY_MARKERS.map((k) => [k, [] as number[]])) as unknown as Record<TodayMarker, number[]>;
  for await (const row of cursor) {
    const createdAt = new Date(row.created_at).getTime();
    const offsetMinutes = isNumber(row.utc_offset_minutes) ? row.utc_offset_minutes : 0;
    const rowDay = row.extraction?.event_date ?? new Date(createdAt + offsetMinutes * 60000).toISOString().slice(0, 10);
    const frames = Array.isArray(row.frames) ? row.frames : [];
    const offsets = frames.map((f: { t?: unknown }) => f.t).filter(isNumber);
    const lastT = offsets.length ? Math.max(...offsets) : 0;
    const readingFrames = frames.length ? frames : [{ m: Object.fromEntries(TODAY_MARKERS.map((k) => [k, isNumber(row.markers?.[k]?.value) ? row.markers[k].value * 100 : null])), t: lastT }];
    for (const frame of readingFrames) {
      const m: VoicePoint["m"] = {};
      for (const key of TODAY_MARKERS) {
        const value = frame.m?.[key];
        if (isNumber(value)) m[key] = value;
      }
      if (!Object.keys(m).length) continue;
      if (rowDay < day) {
        if (frames.length) for (const key of TODAY_MARKERS) if (m[key] != null) prior[key].push(m[key]!);
        continue;
      }
      if (rowDay !== day) continue;
      const at = isNumber(frame.at_ms) ? frame.at_ms : createdAt + ((isNumber(frame.t) ? frame.t : lastT) - lastT);
      const localAt = at + offsetMinutes * 60000;
      voice.push({ at: localAt, observationId: String(row._id), m });
    }
  }
  voice.sort((a, b) => a.at - b.at);
  const bands = Object.fromEntries(TODAY_MARKERS.map((k) => [k, usualBand(prior[k], 200)])) as Record<TodayMarker, UsualBand | null>;
  const activity = await db.collection("activity_days").findOne(
    { user_id: userId, day }, { projection: { _id: 0, day: 1, activeMs: 1, longestStretchMs: 1, windows: 1, pace: 1, paceBand: 1, latestPace: 1 } },
  );
  return { voice, bands, activity: activity as ActivityDay | null };
}

export async function getLatestActivity(userId: string): Promise<ActivityDay | null> {
  const db = await getDb();
  const row = await db.collection("activity_days").findOne(
    { user_id: userId }, { sort: { day: -1 }, projection: { _id: 0, day: 1, activeMs: 1, longestStretchMs: 1, windows: 1, pace: 1, paceBand: 1, latestPace: 1 } },
  );
  return row as ActivityDay | null;
}
