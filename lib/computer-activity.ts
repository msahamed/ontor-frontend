import { sanitizeCaptureMetadata } from './capture-metadata';
const DEVICE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const number = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
export function sanitizeComputerActivity(raw: unknown, user: string, now = new Date()) {
  if (!object(raw) || raw.user_id !== user || raw.schema_version !== 1 || raw.duration_ms !== 10000 ||
    typeof raw.device_id !== 'string' || !DEVICE.test(raw.device_id) ||
    !number(raw.start_ms, 0, now.getTime() + 86400000) || !Number.isInteger(raw.start_ms) || raw.start_ms % 10000 !== 0 ||
    raw.uuid !== `${raw.device_id}:${raw.start_ms}` || !number(raw.utc_offset_minutes, -840, 840) ||
    !object(raw.features) || !object(raw.prediction)) return null;
  const f = raw.features;
  if (!number(f.active_ms, 0, 10000) || !Number.isInteger(f.active_ms) || !number(f.scroll_amount, 0, 1e9) ||
    !['key_press_count','typing_gap_count'].every(k => number(f[k], 0, 1e7) && Number.isInteger(f[k])) ||
    !['click_count','mouse_move_count','scroll_event_count'].every(k => f[k] == null || (number(f[k], 0, 1e7) && Number.isInteger(f[k]))) ||
    !(f.typical_key_interval_ms == null || number(f.typical_key_interval_ms, 0, 86400000))) return null;
  const p = raw.prediction;
  if (!(p.score == null || number(p.score, 0, 100)) || !(p.probability == null || number(p.probability, 0, 1)) ||
    !(p.model_id == null || (typeof p.model_id === 'string' && p.model_id.length <= 200)) ||
    !(p.model_version == null || (typeof p.model_version === 'string' && p.model_version.length <= 200)) ||
    !(p.reference_label == null || (typeof p.reference_label === 'string' && p.reference_label.length <= 200))) return null;
  const b = p.reference_band;
  if (!(b == null || (object(b) && number(b.median, 0, 1) && number(b.upperWidth, 0, 2) && number(b.lowerWidth, 0, 2)))) return null;
  return {
    _id: `${user}:${raw.uuid}`, uuid: raw.uuid as string, user_id: user, device_id: raw.device_id,
    start_ms: raw.start_ms, duration_ms: 10000, utc_offset_minutes: raw.utc_offset_minutes,
    features: {active_ms:f.active_ms, key_press_count:f.key_press_count, typing_gap_count:f.typing_gap_count,
      typical_key_interval_ms:f.typical_key_interval_ms ?? null, scroll_amount:f.scroll_amount,
      click_count:f.click_count ?? null, mouse_move_count:f.mouse_move_count ?? null, scroll_event_count:f.scroll_event_count ?? null},
    prediction: {score:p.score ?? null, probability:p.probability ?? null, model_id:p.model_id ?? null,
      model_version:p.model_version ?? null, reference_label:p.reference_label ?? null,
      reference_band:b == null ? null : {median:b.median as number, upperWidth:b.upperWidth as number, lowerWidth:b.lowerWidth as number}},
    capture_metadata:sanitizeCaptureMetadata(raw.capture_metadata), schema_version:1, received_at:now,
  };
}
export type ComputerActivityDoc = NonNullable<ReturnType<typeof sanitizeComputerActivity>>;
