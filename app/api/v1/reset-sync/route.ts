import { NextResponse } from "next/server";
import { sanitizeCaptureMetadata, capturePreservingReplacement } from "@/lib/capture-metadata";
import type { AnyBulkWriteOperation } from "mongodb";

import { authorizeUser } from "@/lib/auth";
import { getMongoClient } from "@/lib/mongodb";

export const runtime = "nodejs";

const MAX_BATCH = 200;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ResetSessionDoc {
  _id: string;
  user_id: string;
  exercise_id: string;
  started_at: Date;
  ended_at: Date;
  status: "completed" | "ended_early";
  progress: number;
  source_observation_uuid: string | null;
  capture_metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  received_at: Date;
}

function asDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date;
}

function sanitize(raw: unknown, userId: string): ResetSessionDoc | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  const id = typeof value.uuid === "string" ? value.uuid : "";
  const rowUserId = typeof value.user_id === "string" ? value.user_id : "";
  const exerciseId =
    typeof value.exercise_id === "string" ? value.exercise_id.trim() : "";
  const startedAt = asDate(value.started_at);
  const endedAt = asDate(value.ended_at);
  const createdAt = asDate(value.created_at);
  const updatedAt = asDate(value.updated_at);
  const status = value.status;
  const progress = value.progress;
  if (
    !UUID_RE.test(id) ||
    rowUserId !== userId ||
    !exerciseId ||
    !startedAt ||
    !endedAt ||
    !createdAt ||
    !updatedAt ||
    (status !== "completed" && status !== "ended_early") ||
    typeof progress !== "number" ||
    !Number.isFinite(progress) ||
    progress < 0 ||
    progress > 1
  ) {
    return null;
  }
  const source =
    typeof value.source_observation_uuid === "string" &&
    UUID_RE.test(value.source_observation_uuid)
      ? value.source_observation_uuid
      : null;
  return {
    _id: id,
    user_id: userId,
    exercise_id: exerciseId,
    started_at: startedAt,
    ended_at: endedAt,
    status,
    progress,
    source_observation_uuid: source,
    capture_metadata: sanitizeCaptureMetadata(value.capture_metadata),
    created_at: createdAt,
    updated_at: updatedAt,
    received_at: new Date(),
  };
}

export async function POST(req: Request) {
  let body: { user_id?: unknown; reset_sessions?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const userId = typeof body.user_id === "string" ? body.user_id : "";
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "user_id_required" }, { status: 400 });
  }
  const authz = await authorizeUser(req, userId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }
  if (!Array.isArray(body.reset_sessions)) {
    return NextResponse.json(
      { error: "reset_sessions_array_required" },
      { status: 400 },
    );
  }
  if (body.reset_sessions.length > MAX_BATCH) {
    return NextResponse.json({ error: "batch_too_large" }, { status: 413 });
  }

  const valid = body.reset_sessions
    .map((row) => sanitize(row, userId))
    .filter((row): row is ResetSessionDoc => row !== null);
  const operations: AnyBulkWriteOperation<ResetSessionDoc>[] = valid.map(
    (row) => ({
      updateOne: {
        // Same UUID makes retries idempotent; preserve original capture metadata.
        filter: { _id: row._id },
        update: capturePreservingReplacement(row),
        upsert: true,
      },
    }),
  );
  try {
    const collection = (await getMongoClient())
      .db("healthos")
      .collection<ResetSessionDoc>("reset_sessions");
    const result = operations.length
      ? await collection.bulkWrite(operations, { ordered: false })
      : { upsertedCount: 0, modifiedCount: 0 };
    return NextResponse.json({
      accepted: valid.length,
      dropped: body.reset_sessions.length - valid.length,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("[reset-sync push]", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("user_id") ?? "";
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "user_id_required" }, { status: 400 });
  }
  const authz = await authorizeUser(req, userId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }
  const since = new Date(url.searchParams.get("since") ?? 0);
  if (Number.isNaN(since.valueOf())) {
    return NextResponse.json({ error: "invalid_since" }, { status: 400 });
  }
  const rawAfterId = url.searchParams.get("after_id");
  const afterId = rawAfterId && UUID_RE.test(rawAfterId) ? rawAfterId : null;
  const parsedLimit = Number.parseInt(url.searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, MAX_BATCH)
    : MAX_BATCH;
  const filter = afterId
    ? {
        user_id: userId,
        $or: [
          { updated_at: { $gt: since } },
          { updated_at: since, _id: { $gt: afterId } },
        ],
      }
    : { user_id: userId, updated_at: { $gt: since } };
  try {
    const collection = (await getMongoClient())
      .db("healthos")
      .collection<ResetSessionDoc>("reset_sessions");
    const rows = await collection
      .find(filter, { projection: { received_at: 0 } })
      .sort({ updated_at: 1, _id: 1 })
      .limit(limit + 1)
      .toArray();
    const hasMore = rows.length > limit;
    return NextResponse.json({
      reset_sessions: hasMore ? rows.slice(0, limit) : rows,
      server_now: new Date().toISOString(),
      has_more: hasMore,
    });
  } catch (error) {
    console.error("[reset-sync pull]", error);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
