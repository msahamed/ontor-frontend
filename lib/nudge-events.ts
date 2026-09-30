/** Immutable interaction history, separate from completed reset exercises. */
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENTS = new Set(['requested', 'shown', 'delivery_requested', 'delivery_failed', 'opened', 'dismissed', 'timeout', 'snoozed', 'cancelled', 'replaced', 'session_saved', 'session_ended', 'hidden', 'reset_started', 'reset_completed', 'reset_ended_early', 'feedback_submitted']);
const SOURCES = new Set(['activity', 'in_call', 'after_call']);

export interface NudgeEventDoc {
  _id: string;
  uuid: string;
  user_id: string;
  nudge_id: string;
  device_id: string;
  event: string;
  source: string;
  occurred_at: string;
  received_at: Date;
  source_observation_uuid: string | null;
  live_session_id: string | null;
  reset_session_uuid: string | null;
  metadata: Record<string, unknown>;
  capture_metadata: Record<string, unknown>;
  schema_version: number;
}

function safeObject(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const walk = (v: unknown, depth: number): boolean => {
    if (depth > 4) return false;
    if (v === null || typeof v === 'boolean') return true;
    if (typeof v === 'number') return Number.isFinite(v);
    if (typeof v === 'string') return v.length <= 2048;
    if (Array.isArray(v)) return v.length <= 64 && v.every(x => walk(x, depth + 1));
    if (typeof v === 'object') return Object.entries(v).length <= 64 && Object.entries(v).every(
      ([k, x]) => /^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(k) && !['__proto__', 'constructor', 'prototype'].includes(k) && walk(x, depth + 1));
    return false;
  };
  return walk(value, 0) && JSON.stringify(value).length <= 8192;
}

export function sanitizeNudgeEvent(raw: unknown, userId: string, receivedAt = new Date()): NudgeEventDoc | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (r.user_id !== userId || !UUID_RE.test(userId) ||
      typeof r.uuid !== 'string' || !UUID_RE.test(r.uuid) ||
      typeof r.nudge_id !== 'string' || !UUID_RE.test(r.nudge_id) ||
      typeof r.device_id !== 'string' || !UUID_RE.test(r.device_id) ||
      typeof r.event !== 'string' || !EVENTS.has(r.event) ||
      typeof r.source !== 'string' || !SOURCES.has(r.source) ||
      typeof r.occurred_at !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(r.occurred_at) || !Number.isFinite(Date.parse(r.occurred_at)) ||
      r.schema_version !== 1 || !safeObject(r.metadata) || !safeObject(r.capture_metadata)) return null;
  if (r.event === 'feedback_submitted' &&
      (r.metadata.question_id !== 'feeling_tired_v1' ||
       r.metadata.label_source !== 'self_report' ||
       !['yes', 'no'].includes(r.metadata.answer as string) ||
       typeof r.metadata.feeling_tired !== 'boolean' ||
       r.metadata.feeling_tired !== (r.metadata.answer === 'yes'))) return null;
  for (const key of ['source_observation_uuid', 'reset_session_uuid']) {
    if (r[key] != null && (typeof r[key] !== 'string' || !UUID_RE.test(r[key]))) return null;
  }
  if (r.live_session_id != null && (typeof r.live_session_id !== 'string' || !/^live_[0-9]{1,24}$/.test(r.live_session_id))) return null;
  return {
    _id: r.uuid, uuid: r.uuid, user_id: userId, nudge_id: r.nudge_id,
    device_id: r.device_id, event: r.event, source: r.source,
    occurred_at: new Date(r.occurred_at).toISOString(), received_at: receivedAt,
    source_observation_uuid: (r.source_observation_uuid as string | null) ?? null,
    reset_session_uuid: (r.reset_session_uuid as string | null) ?? null,
    live_session_id: (r.live_session_id as string | null) ?? null,
    metadata: r.metadata, capture_metadata: r.capture_metadata, schema_version: 1,
  };
}

export function nudgeEventUpsert(doc: NudgeEventDoc) {
  return { updateOne: {
    filter: { _id: doc._id, user_id: doc.user_id },
    update: { $setOnInsert: doc }, upsert: true,
  } };
}
