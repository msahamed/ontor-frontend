// POST /api/v1/sync — push a batch of observations from the mobile app.
// GET  /api/v1/sync — pull observations newer than `since` for one install.
//
// One collection — `observations` — keyed by client-supplied UUID (`_id`).
// All other per-log signals (acoustic, language, dimensional markers) are
// embedded sub-documents on the same doc; the mobile DB normalizes them
// into separate SQLite tables locally but flattens for transport so a
// single Mongo upsert is sufficient.
//
// Auth: gated by authorizeUser() (see lib/auth.ts). A request carrying
// a session token must prove that session owns the `user_id` it is
// asking about — a valid token for the wrong partition is a 403, which
// is the whole point of the gate.
//
// Two-mode gate: with AUTH_REQUIRED unset, a request with NO token is
// allowed through and logged, so installs that predate sign-in keep
// syncing.
//
// That flag is off INDEFINITELY, not "until the update lands". Shipping
// a new build does not help: onboarding runs once, gated by
// .onboarding_done, and an app update preserves it — so an updated
// install goes straight to the home screen, never sees the code screen,
// and still has no token. Setting the flag would break those users just
// as surely as it does today.
//
// It can only be closed once sign-in is reachable from inside the app
// (a full-screen signed-out state, not the Settings row that was tried
// and removed), or once every remaining user has reinstalled.
//
// A token that is PRESENT but invalid is rejected rather than
// downgraded to the legacy path. Falling back would mean a revoked
// session still syncs, which would make logout a lie.
//
// Sync semantics: last-write-wins by client `updated_at`. Each push is a
// full-document replace (not a diff) — the device is always the source
// of truth for its own state.
//
// Idempotency: `_id` is the UUID; replacing the same _id is a no-op if
// the doc hasn't changed locally.

import { NextResponse } from "next/server";
import { sanitizeCaptureMetadata, capturePreservingReplacement } from "@/lib/capture-metadata";
import { getMongoClient } from "@/lib/mongodb";
import { authorizeUser } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { obsTag } from "@/lib/coach-analytics";
import type { AnyBulkWriteOperation } from "mongodb";
import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";

// Mirrors voice/presign's client: same region, same credential chain. Held in
// a module-level singleton so a warm lambda reuses the connection.
let _s3: S3Client | null = null;
function getS3(): S3Client {
  if (_s3) return _s3;
  const region = process.env.AWS_REGION;
  if (!region) throw new Error("AWS_REGION not configured");
  _s3 = new S3Client({ region });
  return _s3;
}

// Stored observation shape. `_id` is a client-supplied UUIDv4, not an
// ObjectId — the collection is parameterized with this so the Mongo
// driver's generics don't force ObjectId on the filter.
interface ObservationDoc {
  _id: string;
  user_id: string;
  created_at: Date;
  /** Signed minutes east of UTC at capture. Absent on pre-V45 rows,
   *  where the offset is genuinely unknown rather than zero. */
  utc_offset_minutes?: number;
  updated_at: Date;
  deleted_at: Date | null;
  transcript: string | null;
  // User-authored note attached to the log for later context (distinct from
  // the transcript). Optional; absent on docs written before notes synced.
  user_note?: string | null;
  reset_exercise_id?: string | null;
  reset_completed_at?: Date | null;
  app_version: string | null;
  capture_metadata?: Record<string, unknown> | null;
  platform: string | null;
  upload_platform?: string | null;
  extraction: Record<string, unknown>;
  signals: Record<string, unknown>;
  markers: Record<string, unknown>;
  voice_clip: Record<string, unknown> | null;
  // Per-segment marker timeline ({t, m, cov, vad, q} entries) — powers the
  // within-session trend chart on restore. Optional; absent on old docs.
  frames?: unknown[];
  // Raw per-marker thumbs map ({markerId: 1|-1} + the session self-report
  // key) — restored verbatim so ratings survive a device change.
  marker_ratings?: Record<string, unknown>;
  received_at: Date;
}

// Mongo Node driver needs the Node runtime (no edge support).
export const runtime = "nodejs";

const PUSH_MAX_BATCH = 200;
const PULL_MAX_BATCH = 200;

// UUIDv4 with hyphens. Used to validate both `_id` and `user_id`.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

interface IncomingObservation {
  _id: string;
  user_id: string;
  created_at: string;
  /** Signed minutes east of UTC in force when created_at was captured. */
  utc_offset_minutes?: number;
  updated_at: string;
  deleted_at?: string | null;
  transcript?: string;
  user_note?: string;
  reset_exercise_id?: string;
  reset_completed_at?: string;
  app_version?: string;
  capture_metadata?: Record<string, unknown>;
  platform?: string;
  upload_platform?: string;
  extraction?: Record<string, unknown>;
  signals?: Record<string, unknown>;
  markers?: Record<string, unknown>;
  voice_clip?: Record<string, unknown> | null;
  frames?: unknown[];
  marker_ratings?: Record<string, unknown>;
}

/** Cheap shape check. Drops malformed observations from the batch
 *  rather than rejecting the whole POST — one bad row shouldn't knock
 *  out the rest of a user's queued sync. */
function sanitize(raw: unknown, expectedUserId: string): IncomingObservation | null {
  if (!isPlainObject(raw)) return null;
  const r = raw as Record<string, unknown>;

  const id = typeof r._id === "string" ? r._id : null;
  const userId = typeof r.user_id === "string" ? r.user_id : null;
  const createdAt = typeof r.created_at === "string" ? r.created_at : null;
  const updatedAt = typeof r.updated_at === "string" ? r.updated_at : null;
  if (!id || !userId || !createdAt || !updatedAt) return null;
  if (!UUID_RE.test(id)) return null;
  // Paranoia: a doc whose user_id doesn't match the batch's user_id
  // gets dropped silently — wrong-bucket writes have no benign cause.
  if (userId !== expectedUserId) return null;

  return {
    _id: id,
    user_id: userId,
    created_at: createdAt,
    // created_at is a UTC instant, so on its own it cannot place a
    // check-in in the user's day. Clients from V45 send the offset that
    // was in force at capture; older ones omit it and it stays absent
    // rather than defaulting to zero, which would claim UTC.
    utc_offset_minutes:
      typeof r.utc_offset_minutes === "number" &&
      Number.isInteger(r.utc_offset_minutes) &&
      Math.abs(r.utc_offset_minutes) <= 900
        ? r.utc_offset_minutes
        : undefined,
    updated_at: updatedAt,
    deleted_at: typeof r.deleted_at === "string" ? r.deleted_at : null,
    transcript: typeof r.transcript === "string" ? r.transcript : undefined,
    user_note: typeof r.user_note === "string" ? r.user_note : undefined,
    reset_exercise_id:
      typeof r.reset_exercise_id === "string" ? r.reset_exercise_id : undefined,
    reset_completed_at:
      typeof r.reset_completed_at === "string" &&
      !Number.isNaN(Date.parse(r.reset_completed_at))
        ? r.reset_completed_at
        : undefined,
    app_version: typeof r.app_version === "string" ? r.app_version : undefined,
    capture_metadata: sanitizeCaptureMetadata(r.capture_metadata),
    platform: typeof r.platform === "string" ? r.platform : undefined,
    upload_platform: typeof r.upload_platform === "string" ? r.upload_platform : undefined,
    extraction: isPlainObject(r.extraction) ? r.extraction : undefined,
    signals: isPlainObject(r.signals) ? r.signals : undefined,
    markers: isPlainObject(r.markers) ? r.markers : undefined,
    voice_clip: isPlainObject(r.voice_clip)
      ? r.voice_clip
      : r.voice_clip === null
      ? null
      : undefined,
    frames: Array.isArray(r.frames) ? r.frames : undefined,
    marker_ratings: isPlainObject(r.marker_ratings)
      ? r.marker_ratings
      : undefined,
  };
}

/** Coerce ISO strings → Date so Mongo queries can range-scan them. */
function toDoc(o: IncomingObservation): ObservationDoc {
  return {
    _id: o._id,
    user_id: o.user_id,
    created_at: new Date(o.created_at),
    updated_at: new Date(o.updated_at),
    deleted_at: o.deleted_at ? new Date(o.deleted_at) : null,
    transcript: o.transcript ?? null,
    app_version: o.app_version ?? null,
    ...(o.capture_metadata && { capture_metadata: o.capture_metadata }),
    platform: typeof o.capture_metadata?.platform === "string" ? o.capture_metadata.platform : o.platform ?? null,
    ...(o.upload_platform !== undefined && { upload_platform: o.upload_platform }),
    extraction: o.extraction ?? {},
    signals: o.signals ?? {},
    markers: o.markers ?? {},
    voice_clip: o.voice_clip ?? null,
    ...(o.utc_offset_minutes !== undefined && {
      utc_offset_minutes: o.utc_offset_minutes,
    }),
    ...(o.user_note !== undefined && { user_note: o.user_note }),
    ...(o.reset_exercise_id !== undefined && {
      reset_exercise_id: o.reset_exercise_id,
    }),
    ...(o.reset_completed_at !== undefined && {
      reset_completed_at: new Date(o.reset_completed_at),
    }),
    ...(o.frames !== undefined && { frames: o.frames }),
    ...(o.marker_ratings !== undefined && { marker_ratings: o.marker_ratings }),
    received_at: new Date(),
  };
}

// ── POST ────────────────────────────────────────────────────────────────────
//
// Body: { user_id, observations: IncomingObservation[] }
// Response: { accepted, dropped, upserted, modified }

export async function POST(req: Request) {
  let body: { user_id?: unknown; observations?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const userId =
    typeof body.user_id === "string" ? body.user_id : "";
  if (!UUID_RE.test(userId)) {
    return NextResponse.json(
      { error: "user_id_required" },
      { status: 400 },
    );
  }
  const authz = await authorizeUser(req, userId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }


  const list = Array.isArray(body.observations) ? body.observations : null;
  if (!list) {
    return NextResponse.json(
      { error: "observations_array_required" },
      { status: 400 },
    );
  }
  if (list.length === 0) {
    return NextResponse.json({ accepted: 0, dropped: 0, upserted: 0, modified: 0 });
  }
  if (list.length > PUSH_MAX_BATCH) {
    return NextResponse.json(
      { error: "batch_too_large", limit: PUSH_MAX_BATCH },
      { status: 413 },
    );
  }

  const valid: IncomingObservation[] = [];
  let dropped = 0;
  for (const raw of list) {
    const o = sanitize(raw, userId);
    if (o) valid.push(o);
    else dropped++;
  }
  if (valid.length === 0) {
    return NextResponse.json({ accepted: 0, dropped, upserted: 0, modified: 0 });
  }

  // A delete is permanent and total: the user asked for the log to be gone,
  // so the doc is removed outright rather than kept as a stripped tombstone,
  // and the S3 audio goes with it (below). Deleting on one device therefore
  // does NOT teach a second device to drop its local copy — that convergence
  // was the only thing tombstones bought, and it is not worth keeping a
  // record of a log the user deleted.
  const deletes = valid.filter((o) => o.deleted_at != null);
  const upserts = valid.filter((o) => o.deleted_at == null);

  // Full-document replacement, retaining the original capture provenance
  // atomically when older clients or newer uploaders resync the same record.
  const ops: AnyBulkWriteOperation<ObservationDoc>[] = upserts.map((o) => ({
    updateOne: {
      filter: { _id: o._id },
      update: capturePreservingReplacement(toDoc(o), true),
      upsert: true,
    },
  }));

  try {
    const client = await getMongoClient();
    const col = client
      .db("healthos")
      .collection<ObservationDoc>("observations");
    const res = ops.length
      ? await col.bulkWrite(ops, { ordered: false })
      : { upsertedCount: 0, modifiedCount: 0 };

    // Permanent deletes. The tombstone the client sends carries
    // `voice_clip: null`, so the S3 key has to come from the stored doc —
    // read it BEFORE the docs are removed or the audio is orphaned in the
    // bucket forever with nothing left pointing at it.
    let deletedCount = 0;
    if (deletes.length > 0) {
      const ids = deletes.map((o) => o._id);
      const doomed = await col
        .find({ _id: { $in: ids }, user_id: userId }, { projection: { voice_clip: 1 } })
        .toArray();

      const keys = doomed
        .map((d) => (d.voice_clip as { s3_key?: unknown } | null)?.s3_key)
        .filter((k): k is string => typeof k === "string" && k.length > 0);

      if (keys.length > 0) {
        // Best-effort: a failed S3 delete must not block the Mongo delete,
        // otherwise the user's log survives because a bucket call flaked.
        // Logged loudly instead — an orphaned object is a cleanup job, a
        // surviving log is a broken promise.
        try {
          const bucket = process.env.S3_VOICE_BUCKET;
          if (!bucket) throw new Error("S3_VOICE_BUCKET not configured");
          await getS3().send(
            new DeleteObjectsCommand({
              Bucket: bucket,
              Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
            }),
          );
        } catch (err) {
          console.error("[sync] S3 delete failed, objects orphaned:", keys, err);
        }
      }

      // Scoped by user_id as well as _id so a client can only ever delete
      // its own rows, even though _id is a client-supplied UUID.
      const del = await col.deleteMany({ _id: { $in: ids }, user_id: userId });
      deletedCount = del.deletedCount ?? 0;
    }

    // Touch the install's last_seen_at so the waitlist row tracks
    // active devices. Fire-and-forget — failure here doesn't affect
    // the sync result.
    void client
      .db("healthos")
      .collection("waitlist")
      .updateOne(
        { user_id: userId },
        { $set: { user_id: userId, last_seen_at: new Date() } },
        { upsert: false },
      )
      .catch(() => {});

    // New observations landed, so everything the dashboard cached for
    // this user is stale. Dropping the tag is what makes that cache
    // correct rather than merely recent; the TTL is only a backstop
    // for writes that never come through here.
    // Expire outright rather than stale-while-revalidate. SWR would
    // serve the pre-sync numbers once and refresh behind the visit,
    // which means a check-in you just made is missing until you reload
    // — a confusing thing to explain and to debug.
    //
    // The cost is a rebuild on the FIRST dashboard load after a sync,
    // and these reads are aggregations returning a row or two: roster
    // 47ms, day means 71ms. Paying that once per sync buys "the
    // dashboard is always current", which is worth far more than
    // 100ms. Visits between syncs still come straight from cache.
    if (res.upsertedCount > 0 || res.modifiedCount > 0 || deletedCount > 0) {
      revalidateTag(obsTag(userId), { expire: 0 });
    }

    return NextResponse.json({
      accepted: valid.length,
      dropped,
      upserted: res.upsertedCount,
      modified: res.modifiedCount,
      deleted: deletedCount,
    });
  } catch (err) {
    console.error("[sync push]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

// ── GET ─────────────────────────────────────────────────────────────────────
//
// Query: ?user_id=<uuid>&since=<iso>[&after_id=<uuid>][&limit=<N>]
// Response: { observations, server_now, has_more }
//
// Client persists `server_now` from each response and uses it as the
// next `since`. Echoing server time (vs. client computing it) prevents
// clock-drift gaps where a doc written at "server time T+1ms" gets
// missed because the client polled at "client time T."
//
// `after_id` is the tie-breaker cursor: bulk pushes (backfill/re-push)
// stamp hundreds of docs with the SAME updated_at, and a strictly-
// greater-than timestamp cursor can never advance past such a group —
// pagination stalls and the tail is unreachable. With after_id set, the
// page resumes at (updated_at == since AND _id > after_id) OR
// (updated_at > since), sorted by (updated_at, _id). Clients that only
// send `since` keep the old (tie-unsafe) behavior.

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id") ?? "";
  if (!UUID_RE.test(userId)) {
    return NextResponse.json(
      { error: "user_id_required" },
      { status: 400 },
    );
  }
  const authz = await authorizeUser(req, userId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }


  const sinceRaw = url.searchParams.get("since");
  const since = sinceRaw ? new Date(sinceRaw) : new Date(0);
  if (Number.isNaN(since.valueOf())) {
    return NextResponse.json({ error: "invalid_since" }, { status: 400 });
  }

  const afterIdRaw = url.searchParams.get("after_id");
  const afterId = afterIdRaw && UUID_RE.test(afterIdRaw) ? afterIdRaw : null;

  const limitRaw = url.searchParams.get("limit");
  const limit = (() => {
    if (!limitRaw) return PULL_MAX_BATCH;
    const n = Number.parseInt(limitRaw, 10);
    if (!Number.isFinite(n) || n <= 0) return PULL_MAX_BATCH;
    return Math.min(n, PULL_MAX_BATCH);
  })();

  try {
    const client = await getMongoClient();
    const col = client
      .db("healthos")
      .collection<ObservationDoc>("observations");

    // Strictly-greater-than `since` excludes the boundary row the
    // client already has; with `after_id`, rows AT `since` resume after
    // that _id so a group of tied timestamps paginates cleanly. Sort by
    // (updated_at, _id) so the order is total and deterministic.
    const filter = afterId
      ? {
          user_id: userId,
          $or: [
            { updated_at: { $gt: since } },
            { updated_at: since, _id: { $gt: afterId } },
          ],
        }
      : { user_id: userId, updated_at: { $gt: since } };
    const rows = await col
      .find(filter, { projection: { received_at: 0 } })
      .sort({ updated_at: 1, _id: 1 })
      .limit(limit + 1)
      .toArray();

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({
      observations: page,
      server_now: new Date().toISOString(),
      has_more: hasMore,
    });
  } catch (err) {
    console.error("[sync pull]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
