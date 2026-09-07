import { getRemoteAsset } from "../../../../../lib/blog-remote";
import { ASSET_NAME, SLUG, VERSION } from "../../../../../lib/blog-model";

export const runtime = "nodejs";
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; version: string; name: string }> }) {
  const { slug, version, name } = await params;
  if (!SLUG.test(slug) || slug.length > 150 || !VERSION.test(version) || !ASSET_NAME.test(name)) {
    return new Response(null, { status: 404 });
  }
  try {
    const result = await getRemoteAsset(slug, version, name);
    if (!result) return new Response(null, { status: 404 });
    return new Response(Buffer.from(result.bytes), { headers: {
      "Content-Type": result.asset.contentType,
      "Content-Length": String(result.bytes.byteLength),
      // Short browser TTL allows revocation; version URLs avoid stale edits.
      "Cache-Control": "public, max-age=300, s-maxage=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      ETag: `"${result.asset.sha256}"`,
    } });
  } catch {
    console.error("[blog-media] asset unavailable");
    return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
