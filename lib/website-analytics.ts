"use client";

type EventProperties = Record<string, string | number | boolean>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    FS?: {
      event?: (name: string, properties?: EventProperties) => void;
    };
  }
}

const USER_ID_KEY = "ontor_web_user_id";
const SESSION_ID_KEY = "ontor_web_session_id";
const PAGE_VIEW_KEY_PREFIX = "ontor_web_page_view:";

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Stable anonymous browser id — later journey handoff can reuse this. */
export function getWebsiteUserId(): string {
  try {
    const existing = window.localStorage.getItem(USER_ID_KEY);
    if (existing) return existing;
    const id = newId();
    window.localStorage.setItem(USER_ID_KEY, id);
    return id;
  } catch {
    return newId();
  }
}

/** Rotates per tab session (cold open / new tab). */
export function getWebsiteSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const id = newId();
    window.sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return newId();
  }
}

function readUtm(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "gclid",
      "msclkid",
      "fbclid",
    ]) {
      const v = params.get(key);
      if (v) out[key] = v;
    }
  } catch {
    // ignore
  }
  return out;
}

type UAData = {
  brands?: { brand: string; version: string }[];
  mobile?: boolean;
  platform?: string;
};

function readUserAgentData(): Record<string, string | number | boolean> {
  const nav = navigator as Navigator & {
    userAgentData?: UAData;
  };
  const data = nav.userAgentData;
  if (!data) return {};
  const out: Record<string, string | number | boolean> = {};
  if (typeof data.mobile === "boolean") out.ua_mobile = data.mobile;
  if (typeof data.platform === "string") out.ua_platform = data.platform;
  if (Array.isArray(data.brands) && data.brands.length > 0) {
    out.ua_brands = data.brands
      .map((b) => `${b.brand}:${b.version}`)
      .join(",");
  }
  return out;
}

/** Browser / device metadata safe to store on website marketing events. */
export function collectWebsiteClientMeta(): Record<
  string,
  string | number | boolean
> {
  const meta: Record<string, string | number | boolean> = {
    source: "website",
    page_path: window.location.pathname,
    page_url: window.location.href,
    page_search: window.location.search || "",
    referrer: document.referrer || "",
    user_agent: navigator.userAgent || "",
    language: navigator.language || "",
    languages: Array.isArray(navigator.languages)
      ? navigator.languages.join(",")
      : "",
    navigator_platform: navigator.platform || "",
    cookie_enabled: navigator.cookieEnabled === true,
    max_touch_points: navigator.maxTouchPoints ?? 0,
    screen_width: window.screen?.width ?? 0,
    screen_height: window.screen?.height ?? 0,
    viewport_width: window.innerWidth ?? 0,
    viewport_height: window.innerHeight ?? 0,
    device_pixel_ratio: window.devicePixelRatio ?? 1,
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    timezone_offset_min: new Date().getTimezoneOffset(),
    online: navigator.onLine === true,
  };

  Object.assign(meta, readUserAgentData());
  Object.assign(meta, readUtm());
  return meta;
}

function postWebsiteEventsToMongo(
  events: {
    id: string;
    user_id: string;
    session_id: string;
    event: string;
    tier: "engagement" | "reliability";
    event_datetime: string;
    created_at: string;
    app_version: string;
    platform: string;
    props: Record<string, string | number | boolean>;
  }[],
) {
  const body = JSON.stringify({ events });
  try {
    if (typeof navigator.sendBeacon === "function") {
      const ok = navigator.sendBeacon(
        "/api/v1/events",
        new Blob([body], { type: "application/json" }),
      );
      if (ok) return;
    }
  } catch {
    // fall through to fetch
  }
  void fetch("/api/v1/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Never block download / navigation on analytics failure.
  });
}

/**
 * Persist a website marketing/product signal to healthos.events
 * (same schema as the desktop/mobile app intake).
 */
export function trackWebsiteMongoEvent(
  event: string,
  options: {
    platform: string;
    props?: Record<string, string | number | boolean>;
    tier?: "engagement" | "reliability";
  },
) {
  if (typeof window === "undefined") return;

  const now = new Date().toISOString();
  const props = {
    ...collectWebsiteClientMeta(),
    ...(options.props ?? {}),
    source: "website",
  };

  postWebsiteEventsToMongo([
    {
      id: newId(),
      user_id: getWebsiteUserId(),
      session_id: getWebsiteSessionId(),
      event,
      tier: options.tier ?? "engagement",
      event_datetime: now,
      created_at: now,
      app_version: "website",
      platform: options.platform,
      props,
    },
  ]);
}

/** GA4 + FullStory only (existing path). */
export function trackWebsiteEvent(
  name: string,
  properties: EventProperties = {},
) {
  window.gtag?.("event", name, properties);
  window.FS?.event?.(name, properties);
}

/**
 * GA4 + FullStory + Mongo healthos.events.
 * Use for funnel steps we want to query in Mongo later.
 */
export function trackWebsiteFunnelEvent(
  name: string,
  options: {
    platform: string;
    props?: Record<string, string | number | boolean>;
  },
) {
  const gaProps: EventProperties = {
    platform: options.platform,
    ...(options.props ?? {}),
  };
  trackWebsiteEvent(name, gaProps);
  trackWebsiteMongoEvent(name, {
    platform: options.platform,
    props: options.props,
  });
}

/** One page_view per path per tab session (visit half of visit→download). */
export function trackWebsitePageViewOnce(pageName = "landing") {
  if (typeof window === "undefined") return;
  const path = window.location.pathname || "/";
  const key = `${PAGE_VIEW_KEY_PREFIX}${path}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, "1");
  } catch {
    // still fire once this call
  }

  trackWebsiteFunnelEvent("website_page_view", {
    platform: "web",
    props: {
      page_name: pageName,
    },
  });
}
