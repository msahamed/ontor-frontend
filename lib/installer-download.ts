type DownloadDependencies = {
  verify: () => Promise<{ isBot: boolean; isVerifiedBot?: boolean }>;
  limit: (request: Request) => Promise<{ ok: boolean; retryAfterSec: number }>;
};
const installers = {
  macos: "https://ontor-releases.s3.us-east-2.amazonaws.com/mac/Ontor.dmg",
  windows: "https://ontor-releases.s3.us-east-2.amazonaws.com/mac/windows/Ontor.exe",
};

// Protects website acquisition. Public update files remain available to native updaters.
export async function installerDownload(request: Request, deps: DownloadDependencies) {
  const reply = (body: object, status = 200, extra = {}) => Response.json(body, {
    status, headers: { "Cache-Control": "no-store", ...extra },
  });
  try {
    const verdict = await deps.verify();
    if (verdict.isBot || verdict.isVerifiedBot) {
      return reply({ error: "We couldn’t verify this download. Refresh the page and try again." }, 403);
    }
    let body;
    try { body = await request.json(); } catch { return reply({ error: "Invalid download request." }, 400); }
    if (!body || (body.platform !== "macos" && body.platform !== "windows")) {
      return reply({ error: "Choose Mac or Windows." }, 400);
    }
    const rate = await deps.limit(request);
    if (!rate.ok) return reply({ error: "Too many downloads. Please try again later." }, 429, { "Retry-After": String(rate.retryAfterSec) });
    const url = new URL(installers[body.platform as keyof typeof installers]);
    if (typeof body.acquisitionId === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.acquisitionId)) {
      url.searchParams.set("acquisition_id", body.acquisitionId);
    }
    return reply({ url: url.toString() });
  } catch {
    return reply({ error: "Download verification is temporarily unavailable. Please try again." }, 503);
  }
}
