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
export function capturePreservingReplacement(doc: object & { capture_metadata?: unknown; platform?: string | null }, preserveObservationPlatform = false) {
  const capture = sanitizeCaptureMetadata(doc.capture_metadata);
  return [{ $replaceWith: { $mergeObjects: [
    { $literal: doc },
    {
      capture_metadata: { $ifNull: ["$capture_metadata", { $literal: doc.capture_metadata ?? null }] },
      ...(preserveObservationPlatform && {
        platform: { $ifNull: ["$capture_metadata.platform", { $literal: capture?.platform ?? doc.platform ?? null }] },
      }),
    },
  ] } }];
}
