/** Capture provenance is independent of the app performing a later upload. */
export function sanitizeCaptureMetadata(raw: unknown): Record<string, string | number> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const value = raw as Record<string, unknown>;
  const result: Record<string, string | number> = {};
  for (const key of ["version", "build_number", "app_version", "platform", "build_mode", "release_channel", "source_revision"]) {
    if (typeof value[key] === "string" && value[key].length <= 160) result[key] = value[key];
  }
  for (const key of ["cue_policy_version", "cue_required_segments", "cue_display_seconds", "cue_cooldown_seconds", "band_percentile", "band_min_half_width"]) {
    if (typeof value[key] === "number" && Number.isFinite(value[key])) result[key] = value[key];
  }
  if (result.platform !== undefined && !["ios", "android", "macos", "windows", "linux", "web"].includes(String(result.platform))) delete result.platform;
  return typeof result.app_version === "string" && typeof result.build_number === "string" ? result : undefined;
}

/** Atomic full-document replacement, except known capture provenance survives
 * older clients, restores, and later versions resyncing the same record. */
export function sanitizeMicroCues(raw: unknown): {datetime: string; cue: string}[] | undefined {
  if (!Array.isArray(raw) || raw.length > 256) return undefined;
  const result: {datetime: string; cue: string}[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return undefined;
    const {datetime, cue} = entry;
    if (typeof datetime !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(datetime) || Number.isNaN(Date.parse(datetime)) ||
        typeof cue !== "string" || !/^[a-z][a-z0-9_]{0,63}$/.test(cue)) return undefined;
    result.push({datetime: new Date(datetime).toISOString(), cue});
  }
  return result;
}

export function capturePreservingReplacement(doc: object & { capture_metadata?: unknown; platform?: string | null; app_version?: string | null; micro_cues?: unknown }, preserveObservationPlatform = false) {
  if (preserveObservationPlatform) {
    return [{ $replaceWith: { $mergeObjects: [
      { $literal: doc },
      {
        app_version: {$ifNull: ["$capture_metadata.app_version", "$app_version", {$literal: doc.app_version ?? null}]},
        platform: {$ifNull: ["$capture_metadata.platform", "$platform", {$literal: doc.platform ?? null}]},
        micro_cues: {$ifNull: ["$micro_cues", {$literal: doc.micro_cues ?? null}]},
      },
    ] } }];
  }
  return [{ $replaceWith: { $mergeObjects: [
    { $literal: doc },
    {capture_metadata: { $ifNull: ["$capture_metadata", { $literal: doc.capture_metadata ?? null }] }},
  ] } }];
}
