// POST /api/v1/account/delete — erase everything held for one account.
//
// Body:    { user_id }
// Returns: { deleted: { observations, clips, events, shares, ... } }
//
// Required by App Store guideline 5.1.1(v) and Play's data-deletion policy:
// an app that creates accounts has to offer deletion from inside the app,
// not just a support address. The public web form at /delete-account posts
// here too, which is the URL those policies also ask for.
//
// Auth is the same gate as /sync (authorizeUser), deliberately. Requiring a
// session token would lock out exactly the users who most need this: sign-in
// only exists inside onboarding, AUTH_REQUIRED is unset indefinitely, and an
// updated install never sees the code screen — so most existing installs hold
// no token and never will. Anyone able to call this already has the user_id,
// which is enough to read and overwrite the same data through /sync; deletion
// is not a wider exposure than what that endpoint already grants.
//
// Order matters. S3 objects are dropped BEFORE the Mongo docs, because the
// docs are the only record of which S3 keys belong to this user — delete
// them first and the audio is unreachable and orphaned forever.

import { NextResponse } from "next/server";
import { getMongoClient } from "@/lib/mongodb";
import { authorizeUser, DB_NAME } from "@/lib/auth";
import { revalidateTag } from "next/cache";
import { obsTag } from "@/lib/coach-analytics";
import { DeleteObjectsCommand, S3Client } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// S3 caps DeleteObjects at 1000 keys per call.
const S3_DELETE_CHUNK = 1000;

let _s3: S3Client | null = null;
function getS3(): S3Client {
  if (_s3) return _s3;
  const region = process.env.AWS_REGION;
  if (!region) throw new Error("AWS_REGION not configured");
  _s3 = new S3Client({ region });
  return _s3;
}

export async function POST(req: Request) {
  let body: { user_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const userId = typeof body.user_id === "string" ? body.user_id : "";
  if (!UUID_RE.test(userId)) {
    return NextResponse.json({ error: "user_id_required" }, { status: 400 });
  }

  const authz = await authorizeUser(req, userId);
  if (!authz.ok) {
    return NextResponse.json({ error: authz.error }, { status: authz.status });
  }

  try {
    const client = await getMongoClient();
    const db = client.db(DB_NAME);
    const observations = db.collection("observations");

    // 1. Collect every S3 key this user owns, then drop the objects. Read
    //    the keys before anything is deleted from Mongo (see header note).
    const withClips = await observations
      .find(
        { user_id: userId, voice_clip: { $ne: null } },
        { projection: { voice_clip: 1 } },
      )
      .toArray();

    const keys = withClips
      .map((d) => (d.voice_clip as { s3_key?: unknown } | null)?.s3_key)
      .filter((k): k is string => typeof k === "string" && k.length > 0);

    let clipsDeleted = 0;
    if (keys.length > 0) {
      const bucket = process.env.S3_VOICE_BUCKET;
      if (!bucket) {
        // Refuse rather than half-delete. Wiping the docs with the bucket
        // unreachable would strand the audio permanently AND destroy the
        // only pointers to it, so the user's recordings would outlive the
        // account with nothing left able to find them.
        console.error("[account/delete] S3_VOICE_BUCKET not configured");
        return NextResponse.json({ error: "server" }, { status: 500 });
      }
      for (let i = 0; i < keys.length; i += S3_DELETE_CHUNK) {
        const chunk = keys.slice(i, i + S3_DELETE_CHUNK);
        const res = await getS3().send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
          }),
        );
        if (res.Errors?.length) {
          console.error("[account/delete] S3 errors:", res.Errors);
          return NextResponse.json({ error: "s3_delete_failed" }, { status: 500 });
        }
        clipsDeleted += chunk.length;
      }
    }

    // 2. Mongo. Every collection keyed by this user, plus the session and
    //    code rows keyed by their email, so no credential outlives the data.
    const account = await db
      .collection<{ email?: string }>("accounts")
      .findOne({ user_id: userId }, { projection: { email: 1 } });
    const email = account?.email ?? null;

    const [obs, activity, resets, events, profiles, shares, accounts] = await Promise.all([
      observations.deleteMany({ user_id: userId }),
      db.collection("activity_days").deleteMany({ user_id: userId }),
      db.collection("reset_sessions").deleteMany({ user_id: userId }),
      db.collection("events").deleteMany({ user_id: userId }),
      db.collection("profiles").deleteMany({ user_id: userId }),
      // Both directions: what they shared out, and what was shared with them.
      db
        .collection("shares")
        .deleteMany({ $or: [{ owner_user_id: userId }, { viewer_user_id: userId }] }),
      db.collection("accounts").deleteMany({ user_id: userId }),
    ]);

    let sessions = 0;
    if (email) {
      const [s, c, w] = await Promise.all([
        db.collection("sessions").deleteMany({ email }),
        db.collection("auth_codes").deleteMany({ email }),
        db.collection("waitlist").deleteMany({ email }),
      ]);
      sessions = s.deletedCount ?? 0;
      void c;
      void w;
    } else {
      // No account row (never signed in) — the waitlist row is the only
      // place the address could still be, and it is keyed by user_id there.
      await db.collection("waitlist").deleteMany({ user_id: userId });
    }

    revalidateTag(obsTag(userId), { expire: 0 });

    return NextResponse.json({
      deleted: {
        observations: obs.deletedCount ?? 0,
        activity_days: activity.deletedCount ?? 0,
        reset_sessions: resets.deletedCount ?? 0,
        clips: clipsDeleted,
        events: events.deletedCount ?? 0,
        profiles: profiles.deletedCount ?? 0,
        shares: shares.deletedCount ?? 0,
        accounts: accounts.deletedCount ?? 0,
        sessions,
      },
    });
  } catch (err) {
    console.error("[account/delete] failed:", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
