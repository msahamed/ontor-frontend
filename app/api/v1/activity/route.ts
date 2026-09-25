// Content-free daily chart summaries from opt-in desktop activity tracking.
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getDb, requireSession } from "@/lib/auth";
import { obsTag } from "@/lib/coach-analytics";

export const runtime = "nodejs";

const number = (v: unknown, min: number, max: number) =>
  typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;

export async function POST(req: Request) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const day = body.day;
  const windows = body.windows;
  const pace = body.pace;
  const band = body.paceBand;
  if (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
      !Number.isFinite(Date.parse(`${day}T00:00:00Z`)) ||
      new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) !== day ||
      Date.parse(`${day}T00:00:00Z`) < Date.now() - 91 * 864e5 ||
      Date.parse(`${day}T00:00:00Z`) > Date.now() + 864e5 ||
      !number(body.activeMs, 0, 864e5) || !number(body.longestStretchMs, 0, 864e5) ||
      !Array.isArray(windows) || windows.length > 8640 ||
      !windows.every((w) => w && number(w.at, 0, 4102444800000) && number(w.activeMs, 0, 10000)) ||
      !Array.isArray(pace) || pace.length > 1000 ||
      !pace.every((p) => p && number(p.at, 0, 4102444800000) && number(p.mean, 0, 100) && (p.sd == null || number(p.sd, 0, 100))) ||
      !(band == null || (typeof band === "object" &&
        number((band as Record<string, unknown>).low, -100, 200) &&
        number((band as Record<string, unknown>).median, 0, 100) &&
        number((band as Record<string, unknown>).high, -100, 200))) ||
      !(body.latestPace == null || number(body.latestPace, 0, 100))) {
    return NextResponse.json({ error: "invalid_activity" }, { status: 400 });
  }
  const db = await getDb();
  await db.collection<{ _id: string }>("activity_days").updateOne(
    { _id: `${session.userId}:${day}` },
    { $set: {
      user_id: session.userId, day,
      activeMs: body.activeMs, longestStretchMs: body.longestStretchMs,
      windows: windows.map((w) => ({ at: w.at, activeMs: w.activeMs })),
      pace: pace.map((p) => ({ at: p.at, mean: p.mean, sd: p.sd ?? null })),
      paceBand: band, latestPace: body.latestPace ?? null, updated_at: new Date(),
    } },
    { upsert: true },
  );
  revalidateTag(obsTag(session.userId), { expire: 0 });
  return NextResponse.json({ ok: true });
}
