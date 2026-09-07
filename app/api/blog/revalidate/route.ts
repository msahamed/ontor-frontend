import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { BLOG_TAG, SLUG } from "../../../../lib/blog-model";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.BLOG_REVALIDATE_SECRET;
  if (!secret || secret.length < 32) return Response.json({ error: "Not configured" }, { status: 503 });
  const supplied = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const suppliedBytes = Buffer.from(supplied);
  const expectedBytes = Buffer.from(expected);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.text();
  if (body.length > 2048) return Response.json({ error: "Body too large" }, { status: 413 });
  let slug: unknown;
  try { slug = JSON.parse(body).slug; } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof slug !== "string" || slug.length > 150 || !SLUG.test(slug)) return Response.json({ error: "Invalid slug" }, { status: 400 });
  revalidateTag(BLOG_TAG, { expire: 0 });
  for (const path of [`/blog/${slug}`, "/blog", "/sitemap.xml", "/llms.txt"]) revalidatePath(path);
  return Response.json({ invalidated: true, slug, note: "Pages regenerate on the next request; verify the live version before distribution." });
}
