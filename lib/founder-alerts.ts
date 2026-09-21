// Founder step alerts — one module for every lifecycle email.
//
// Call sites only pass the step + context. This module owns:
//   1) one-time claim in owner_notification_claims
//   2) plain-text founder email (Resend)
//   3) best-effort GA4 + FullStory product events
//
import type { Db } from "mongodb";
import { Resend } from "resend";
import { sendGoogleAnalyticsProductEvent } from "@/lib/google-analytics";
import { sendFullStoryProductEvent } from "@/lib/fullstory";

const FROM = "Ontor <hello@ontor.ai>";
const OWNER_NOTIFY = "sabbers@gmail.com";

let resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) resend = new Resend(process.env.RESEND_API_KEY);
  return resend;
}

/** Ordered product journey steps that page the founder once each. */
export type FounderStep =
  | "installer_download"
  | "install_reached_signup"
  | "email_verified"
  | "onboarding_completed"
  | "trial_started"
  | "first_check_in";

/** @deprecated Use FounderStep */
export type OwnerLifecycleMilestone = FounderStep;

const STEP_LABELS: Record<FounderStep, string> = {
  installer_download: "Installer download",
  install_reached_signup: "Install reached signup",
  email_verified: "Email verified",
  onboarding_completed: "Onboarding completed",
  trial_started: "Trial started",
  first_check_in: "First check-in completed",
};

export type FounderStepContext = {
  /** Stable claim key — usually user_id (web anon or product). */
  identityKey: string;
  email?: string | null;
  userId?: string | null;
  platform?: string | null;
  appVersion?: string | null;
  occurredAt?: Date | null;
  trialEndsAt?: Date | null;
  trialDays?: number | null;
  // Page / download
  pagePath?: string | null;
  pageUrl?: string | null;
  fileName?: string | null;
  referrer?: string | null;
  // Location-ish (browser timezone; IP when known server-side)
  timezone?: string | null;
  timezoneOffsetMin?: number | null;
  ip?: string | null;
  country?: string | null;
  city?: string | null;
  // Browser / device
  userAgent?: string | null;
  language?: string | null;
  languages?: string | null;
  navigatorPlatform?: string | null;
  uaPlatform?: string | null;
  uaMobile?: boolean | null;
  uaBrands?: string | null;
  screenWidth?: number | null;
  screenHeight?: number | null;
  viewportWidth?: number | null;
  viewportHeight?: number | null;
  devicePixelRatio?: number | null;
  // Catch-all for future fields (shown as "Key: value" lines)
  extras?: Record<string, string | number | boolean | null | undefined>;
};

interface OwnerNotificationClaim {
  _id: string;
  milestone: FounderStep;
  identity_key: string;
  created_at: Date;
}

function pushLine(
  lines: string[],
  label: string,
  value: string | number | boolean | null | undefined,
) {
  if (value === null || value === undefined || value === "") return;
  lines.push(`${label}: ${String(value)}`);
}

function formatFounderEmailBody(step: FounderStep, ctx: FounderStepContext): string {
  const label = STEP_LABELS[step];
  const lines = [label, ""];

  pushLine(lines, "Email", ctx.email);
  pushLine(lines, "Platform", ctx.platform);
  pushLine(lines, "File", ctx.fileName);
  pushLine(lines, "Page", ctx.pagePath);
  pushLine(lines, "URL", ctx.pageUrl);
  pushLine(lines, "Referrer", ctx.referrer);
  pushLine(lines, "Timezone", ctx.timezone);
  if (typeof ctx.timezoneOffsetMin === "number") {
    pushLine(lines, "UTC offset (min)", ctx.timezoneOffsetMin);
  }
  pushLine(lines, "IP", ctx.ip);
  pushLine(lines, "Country", ctx.country);
  pushLine(lines, "City", ctx.city);
  pushLine(lines, "Language", ctx.language);
  pushLine(lines, "Languages", ctx.languages);
  pushLine(lines, "Navigator platform", ctx.navigatorPlatform);
  pushLine(lines, "UA platform", ctx.uaPlatform);
  if (typeof ctx.uaMobile === "boolean") {
    pushLine(lines, "UA mobile", ctx.uaMobile);
  }
  pushLine(lines, "UA brands", ctx.uaBrands);
  pushLine(lines, "User agent", ctx.userAgent);
  if (typeof ctx.screenWidth === "number" && typeof ctx.screenHeight === "number") {
    pushLine(lines, "Screen", `${ctx.screenWidth}×${ctx.screenHeight}`);
  }
  if (
    typeof ctx.viewportWidth === "number" &&
    typeof ctx.viewportHeight === "number"
  ) {
    pushLine(lines, "Viewport", `${ctx.viewportWidth}×${ctx.viewportHeight}`);
  }
  if (typeof ctx.devicePixelRatio === "number") {
    pushLine(lines, "DPR", ctx.devicePixelRatio);
  }
  pushLine(lines, "Version", ctx.appVersion);
  pushLine(lines, "User ID", ctx.userId);
  if (ctx.occurredAt) pushLine(lines, "Time", ctx.occurredAt.toISOString());
  if (typeof ctx.trialDays === "number") {
    pushLine(lines, "Trial", `${ctx.trialDays} days`);
  }
  if (ctx.trialEndsAt) {
    pushLine(lines, "Trial ends", ctx.trialEndsAt.toISOString());
  }

  if (ctx.extras) {
    for (const [key, value] of Object.entries(ctx.extras)) {
      if (value === null || value === undefined || value === "") continue;
      const pretty = key.replace(/_/g, " ");
      pushLine(lines, pretty.charAt(0).toUpperCase() + pretty.slice(1), value);
    }
  }

  return lines.join("\n");
}

async function sendFounderStepEmail(
  step: FounderStep,
  ctx: FounderStepContext,
): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn("[founder-alerts] RESEND_API_KEY missing — skipping email");
    return;
  }

  const label = STEP_LABELS[step];
  const subjectDetail = ctx.email ?? ctx.platform ?? ctx.timezone ?? "Ontor";

  try {
    const { error } = await client.emails.send({
      from: FROM,
      to: OWNER_NOTIFY,
      ...(ctx.email ? { replyTo: ctx.email } : {}),
      subject: `${label}: ${subjectDetail}`,
      text: formatFounderEmailBody(step, ctx),
    });
    if (error) console.error("[founder-alerts] email failed:", error);
  } catch (err) {
    console.error("[founder-alerts] email threw:", err);
  }
}

/**
 * Claim this step once for identityKey, then email the founder and
 * fan out to GA4 / FullStory. Returns true only when this call was
 * the first claim (so callers can tell a duplicate was skipped).
 */
export async function notifyFounderStep(
  db: Db,
  step: FounderStep,
  ctx: FounderStepContext,
): Promise<boolean> {
  const claimId = `${step}:${ctx.identityKey}`;
  const claimed = await db
    .collection<OwnerNotificationClaim>("owner_notification_claims")
    .updateOne(
      { _id: claimId },
      {
        $setOnInsert: {
          milestone: step,
          identity_key: ctx.identityKey,
          created_at: new Date(),
        },
      },
      { upsert: true },
    );

  if (claimed.upsertedCount !== 1) return false;

  const eventParams = {
    platform: ctx.platform ?? undefined,
    app_version: ctx.appVersion ?? undefined,
    trial_days: ctx.trialDays ?? undefined,
    page_path: ctx.pagePath ?? undefined,
    timezone: ctx.timezone ?? undefined,
  };

  const deliveries = await Promise.allSettled([
    sendFounderStepEmail(step, ctx),
    sendGoogleAnalyticsProductEvent({
      name: step,
      userId: ctx.userId ?? ctx.identityKey,
      occurredAt: ctx.occurredAt ?? undefined,
      params: eventParams,
    }),
    sendFullStoryProductEvent({
      name: step,
      userId: ctx.userId ?? ctx.identityKey,
      occurredAt: ctx.occurredAt ?? undefined,
      idempotencyKey: claimId,
      params: eventParams,
    }),
  ]);

  for (const delivery of deliveries) {
    if (delivery.status === "rejected") {
      console.error("[founder-alerts] delivery failed:", delivery.reason);
    }
  }
  return true;
}

/** Build founder context from a website analytics props bag. */
export function founderContextFromWebsiteProps(
  props: Record<string, unknown> | null | undefined,
): Partial<FounderStepContext> {
  if (!props) return {};
  const str = (key: string) =>
    typeof props[key] === "string" ? (props[key] as string) : null;
  const num = (key: string) =>
    typeof props[key] === "number" ? (props[key] as number) : null;
  const bool = (key: string) =>
    typeof props[key] === "boolean" ? (props[key] as boolean) : null;

  return {
    pagePath: str("page_path"),
    pageUrl: str("page_url"),
    fileName: str("file_name"),
    referrer: str("referrer"),
    timezone: str("timezone"),
    timezoneOffsetMin: num("timezone_offset_min"),
    userAgent: str("user_agent"),
    language: str("language"),
    languages: str("languages"),
    navigatorPlatform: str("navigator_platform"),
    uaPlatform: str("ua_platform"),
    uaMobile: bool("ua_mobile"),
    uaBrands: str("ua_brands"),
    screenWidth: num("screen_width"),
    screenHeight: num("screen_height"),
    viewportWidth: num("viewport_width"),
    viewportHeight: num("viewport_height"),
    devicePixelRatio: num("device_pixel_ratio"),
    extras: {
      utm_source: str("utm_source"),
      utm_medium: str("utm_medium"),
      utm_campaign: str("utm_campaign"),
      utm_term: str("utm_term"),
      utm_content: str("utm_content"),
      gclid: str("gclid"),
      msclkid: str("msclkid"),
      fbclid: str("fbclid"),
      page_search: str("page_search"),
      online: bool("online"),
      cookie_enabled: bool("cookie_enabled"),
      max_touch_points: num("max_touch_points"),
    },
  };
}

/**
 * Backward-compatible alias used by older call sites.
 * Prefer notifyFounderStep(db, step, ctx).
 */
export async function sendClaimedOwnerMilestone(
  db: Db,
  notice: FounderStepContext & { milestone: FounderStep },
): Promise<boolean> {
  const { milestone, ...ctx } = notice;
  return notifyFounderStep(db, milestone, ctx);
}
