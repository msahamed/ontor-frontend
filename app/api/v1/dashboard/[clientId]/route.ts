// GET /api/v1/dashboard/[clientId]?panel=…&days=…&marker=…
//
// The panels the client view loads on demand. The first paint ships
// day means only; time-of-day, the correlation matrix and recovery are
// each a separate, narrow request made when that panel is actually
// looked at.
//
// The marker chips and the 7/30 toggle inside "Each dial" do NOT come
// here. Those are re-derived in the browser from the day rows already
// on the page, so switching a dial costs nothing.
//
// Authorization matches the page: you may read yourself and, once
// sharing exists, your clients. Anything else is a 404 rather than a
// 403, so this cannot be used to find out which user_ids exist.

import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth";
import { canView } from "@/lib/shares";
import { getTodayData } from "@/lib/today-analytics";
import {
  getByHour,
  getMatrix,
  getRecovery,
  isMarker,
  MARKER_KEYS,
  solveUtcOffset,
} from "@/lib/coach-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RANGES = new Set([7, 30, 90]);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> },
) {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { clientId } = await params;
  // Same answer as the page, from the same function, so the two can
  // never drift apart on who may see what.
  if (!(await canView(session, clientId))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const url = new URL(req.url);
  const panel = url.searchParams.get("panel");
  const days = Number(url.searchParams.get("days") ?? 30);
  if (!RANGES.has(days)) {
    return NextResponse.json({ error: "bad_range" }, { status: 400 });
  }

  // Per-user data behind a session, so private, never shared. Short
  // enough that a sync is reflected quickly, long enough that toggling
  // a chip back and forth costs nothing.
  const headers = { "Cache-Control": "private, max-age=60" };

  try {
    switch (panel) {
      case "today": {
        const day = url.searchParams.get("day") ?? "";
        const parsed = Date.parse(`${day}T00:00:00Z`);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(parsed) ||
            new Date(parsed).toISOString().slice(0, 10) !== day ||
            parsed > Date.now() + 864e5 || parsed < Date.now() - 90 * 864e5) {
          return NextResponse.json({ error: "bad_day" }, { status: 400 });
        }
        return NextResponse.json(await getTodayData(clientId, day), { headers });
      }
      case "hour": {
        const raw = url.searchParams.get("keys")?.split(",") ?? ["confidence"];
        const keys = raw.filter(isMarker).slice(0, 3);
        if (!keys.length) keys.push("confidence");
        // Recover the device's UTC offset first; the hour axis is only
        // meaningful if it explains the buckets the device recorded.
        const solved = await solveUtcOffset(clientId, days);
        const hours = solved.fit >= 0.9
          ? await getByHour(clientId, days, keys, solved.offset)
          : [];
        return NextResponse.json({ ...solved, hours }, { headers });
      }
      case "matrix":
        return NextResponse.json(
          { keys: MARKER_KEYS, matrix: await getMatrix(clientId, days) },
          { headers },
        );
      case "recovery": {
        const m = url.searchParams.get("marker");
        return NextResponse.json(
          await getRecovery(clientId, days, isMarker(m) ? m : "stress"),
          { headers },
        );
      }
      default:
        return NextResponse.json({ error: "unknown_panel" }, { status: 400 });
    }
  } catch (err) {
    console.error("[dashboard panel]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
