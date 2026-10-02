/** Separate from nudges: immutable model versions and prospective evaluations. */
export const MODEL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type ModelRecord = Record<string, unknown> & { _id: string; id: string; user_id: string; kind: 'checkpoint' | 'evaluation'; received_at: Date };
const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const vector = (x: unknown, n: number) => Array.isArray(x) && x.length === n && x.every(finite);
const object = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const text = (x: unknown, n = 256): x is string => typeof x === 'string' && x.length > 0 && x.length <= n;
function safe(x: unknown, depth = 0): boolean {
  if (depth > 5) return false;
  if (x === null || typeof x === 'boolean' || finite(x)) return true;
  if (typeof x === 'string') return x.length <= 2048;
  if (Array.isArray(x)) return x.length <= 128 && x.every(v => safe(v, depth + 1));
  return object(x) && Object.keys(x).length <= 64 && Object.entries(x).every(([k,v]) =>
    /^[a-zA-Z][a-zA-Z0-9_]*$/.test(k) && !['constructor','prototype','__proto__'].includes(k) && safe(v, depth + 1));
}
export function sanitizeModelRecord(raw: unknown, user: string, receivedAt = new Date()): ModelRecord | null {
  if (!object(raw) || !MODEL_UUID.test(user) || raw.user_id !== user ||
      typeof raw.id !== 'string' || !MODEL_UUID.test(raw.id) ||
      typeof raw.device_id !== 'string' || !MODEL_UUID.test(raw.device_id) ||
      raw.schema_version !== 1 || typeof raw.created_at !== 'string' ||
      !/(Z|[+-]\d{2}:\d{2})$/.test(raw.created_at) || !Number.isFinite(Date.parse(raw.created_at)) ||
      !safe(raw) || JSON.stringify(raw).length > 32768) return null;
  const common = { _id: `${user}:${raw.id}`, id: raw.id, user_id: user,
    device_id: raw.device_id, schema_version: 1, created_at: raw.created_at, received_at: receivedAt };
  if (raw.kind === 'checkpoint') {
    const s = raw.model_spec;
    if (!object(s) || s.model_type !== 'logistic_regression' || s.weight_count !== 42 ||
        !text(s.base_version) || !text(s.feature_version) || !finite(s.bias) ||
        !vector(s.scaler_mean, 42) || !vector(s.scaler_scale, 42) ||
        !(s.scaler_scale as number[]).every(v => v > 0) ||
        !Array.isArray(s.feature_names) || s.feature_names.length !== 42 || !s.feature_names.every(v => text(v)) ||
        !vector(raw.weights, 42) || !text(raw.weights_sha256) || !/^[a-f0-9]{64}$/.test(raw.weights_sha256) ||
        !(raw.parent_weights_sha256 === null || typeof raw.parent_weights_sha256 === 'string' && /^[a-f0-9]{64}$/.test(raw.parent_weights_sha256)) ||
        !(raw.delta_from_parent === null || vector(raw.delta_from_parent, 42)) ||
        !(raw.parent_id === null || typeof raw.parent_id === 'string' && MODEL_UUID.test(raw.parent_id)) ||
        !['initial','candidate'].includes(raw.origin as string) ||
        !Array.isArray(raw.feedback_ids) || raw.feedback_ids.length > 64 ||
        !raw.feedback_ids.every(v => text(v)) || new Set(raw.feedback_ids).size !== raw.feedback_ids.length ||
        raw.label_count !== raw.feedback_ids.length || !object(raw.trainer) || !object(raw.training_metrics)) return null;
    return { ...common, kind: 'checkpoint', parent_id: raw.parent_id, origin: raw.origin,
      model_spec: s, weights: raw.weights, weights_sha256: raw.weights_sha256,
      feedback_ids: raw.feedback_ids, label_count: raw.label_count,
      parent_weights_sha256: raw.parent_weights_sha256, delta_from_parent: raw.delta_from_parent,
      trainer: raw.trainer, training_metrics: raw.training_metrics };
  }
  if (raw.kind === 'evaluation') {
    if (typeof raw.checkpoint_id !== 'string' || !MODEL_UUID.test(raw.checkpoint_id) ||
        !text(raw.feedback_id) || typeof raw.tired !== 'boolean' ||
        !finite(raw.below_fraction) || raw.below_fraction < 0 || raw.below_fraction > 1 ||
        !Number.isSafeInteger(raw.through_ms) || !Number.isSafeInteger(raw.minutes) ||
        (raw.minutes as number) < 0 || raw.evaluated_before_training !== true ||
        raw.pace_qualified !== (raw.below_fraction >= .8) ||
        raw.nudge_qualified !== ((raw.minutes as number) >= 90 || ((raw.minutes as number) >= 45 && raw.below_fraction >= .8))) return null;
    return { ...common, kind: 'evaluation', checkpoint_id: raw.checkpoint_id, feedback_id: raw.feedback_id,
      tired: raw.tired, below_fraction: raw.below_fraction, through_ms: raw.through_ms,
      minutes: raw.minutes, pace_qualified: raw.pace_qualified, nudge_qualified: raw.nudge_qualified,
      evaluated_before_training: true };
  }
  return null;
}
export function modelRecordUpsert(doc: ModelRecord) {
  return { updateOne: { filter: { _id: doc._id, user_id: doc.user_id }, update: { $setOnInsert: doc }, upsert: true } };
}
