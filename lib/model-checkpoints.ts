/** Separate from nudges: immutable model versions and prospective evaluations. */
export const MODEL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type ModelRecord = Record<string, unknown> & { _id: string; id: string; user_id: string; kind: 'checkpoint' | 'evaluation' | 'activation'; received_at: Date };
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
    const apComparison = object(raw.comparison) && raw.comparison.metric === 'average_precision';
    if (apComparison) {
      const c = raw.comparison as Record<string, unknown>;
      if (c.scope !== 'shared_prospective_sessions_only' ||
          typeof c.active_id !== 'string' || !MODEL_UUID.test(c.active_id) ||
          c.candidate_id !== raw.checkpoint_id ||
          ![c.active_ap, c.candidate_ap].every(v => v === null || finite(v) && v >= 0 && v <= 1) ||
          ![c.independent_examples, c.positive_count, c.negative_count].every(v => Number.isSafeInteger(v) && (v as number) >= 0) ||
          c.independent_examples !== (c.positive_count as number) + (c.negative_count as number)) return null;
    }
    if (raw.comparison !== undefined && !apComparison) {
      const c = raw.comparison;
      if (!object(c) || c.scope !== 'shared_prospective_feedback_only' ||
          typeof c.active_id !== 'string' || !MODEL_UUID.test(c.active_id) ||
          c.candidate_id !== raw.checkpoint_id ||
          !Number.isSafeInteger(c.shared_examples) || (c.shared_examples as number) < 0 ||
          !Number.isSafeInteger(c.yes_count) || (c.yes_count as number) < 0 ||
          !Number.isSafeInteger(c.no_count) || (c.no_count as number) < 0 ||
          c.shared_examples !== (c.yes_count as number) + (c.no_count as number) ||
          ![c.active_auc,c.candidate_auc,c.previous_active_auc,c.previous_candidate_auc].every(v => v === null || finite(v) && v >= 0 && v <= 1) ||
          typeof c.ready !== 'boolean' || typeof c.replaceable !== 'boolean') return null;
    }
  if (raw.kind === 'activation') {
    if (typeof raw.checkpoint_id !== 'string' || !MODEL_UUID.test(raw.checkpoint_id) ||
        typeof raw.previous_checkpoint_id !== 'string' || !MODEL_UUID.test(raw.previous_checkpoint_id) ||
        raw.previous_checkpoint_id === raw.checkpoint_id || !object(raw.comparison) ||
        raw.comparison.active_id !== raw.previous_checkpoint_id ||
        raw.comparison.ready !== true ||
        !(apComparison ? ['ap_improved_without_alert_regression', 'ap_tied_alert_errors_improved'].includes(raw.reason as string)
          : raw.reason === 'auc_improved_twice')) return null;
    return {...common,kind:'activation',checkpoint_id:raw.checkpoint_id,
      previous_checkpoint_id:raw.previous_checkpoint_id,comparison:raw.comparison,reason:raw.reason};
  }
  if (raw.kind === 'evaluation') {
    if (raw.auc_summary !== undefined) {
      const a = raw.auc_summary;
      if (!object(a) || !(a.auc === null || finite(a.auc) && a.auc >= 0 && a.auc <= 1) ||
          !Number.isSafeInteger(a.yes_count) || (a.yes_count as number) < 0 ||
          !Number.isSafeInteger(a.no_count) || (a.no_count as number) < 0 ||
          a.example_count !== (a.yes_count as number) + (a.no_count as number) ||
          a.scope !== 'prospective_feedback_only') return null;
    }

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
      evaluated_before_training: true, ...(raw.auc_summary === undefined ? {} : { auc_summary: raw.auc_summary }),
      ...(raw.comparison === undefined ? {} : { comparison: raw.comparison }) };
  }
  return null;
}
export function modelRecordUpsert(doc: ModelRecord) {
  return { updateOne: { filter: { _id: doc._id, user_id: doc.user_id }, update: { $setOnInsert: doc }, upsert: true } };
}
