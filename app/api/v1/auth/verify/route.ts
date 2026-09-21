// POST /api/v1/auth/verify — exchange an emailed code for a session.
//
// Body:    { email, code, local_user_id?, device?, client? }
// Returns: { token, user_id, is_new, has_cloud_data, expires_at, entitlement }
//
// This is where identity is decided, and it replaces the old
// unauthenticated GET /api/v1/installations?email= lookup that the
// app used to run BEFORE any verification — which let anyone type a
// stranger's address and restore that person's history onto their
// own device. Here, the same answer is only handed out to someone
// who just proved they read the inbox.
//
// Resolution order for user_id — the migration path, and the reason
// no backfill is needed:
//   1. An existing `accounts` row (returning user, already migrated).
//   2. The `waitlist` row's user_id. Every current install POSTs
//      email + user_id there at signup, so this is how existing
//      users keep their history the first time they sign in.
//   3. The device's own local_user_id (fresh install, new person) —
//      adopting it means their local data keeps syncing to the same
//      partition instead of being orphaned under a new id.
//   4. A freshly minted UUID (web signup with no device involved).
//
// `has_cloud_data` is answered by actually looking for observations
// rather than inferring from "did we just create the account". The
// client uses it to decide restore-vs-onboard, and a wrong guess
// there either strands someone's history or shows a returning user
// a first-run flow.

import { randomUUID } from "node:crypto";
import { after, NextResponse } from "next/server";
import {
  accounts,
  authCodes,
  codeMatches,
  getDb,
  isUuid,
  issueSession,
  normalizeEmail,
  MAX_VERIFY_ATTEMPTS,
  VERIFY_WINDOW_SEC,
  SESSION_COOKIE,
  WEB_SESSION_IDLE_DAYS,
} from "@/lib/auth";
import { consume } from "@/lib/rate-limit";
import { linkCoachShares } from "@/lib/shares";
import { entitlementForEmail } from "@/lib/entitlement";
import { notifyFounderStep } from "@/lib/founder-alerts";

export const runtime = "nodejs";

const CODE_RE = /^\d{6}$/;

interface VerifyBody {
  email?: unknown;
  code?: unknown;
  local_user_id?: unknown;
  device?: unknown;
  client?: unknown;
}

export async function POST(req: Request) {
  let body: VerifyBody;
  try {
    body = (await req.json()) as VerifyBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const email = normalizeEmail(body.email);
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!email || !CODE_RE.test(code)) {
    return NextResponse.json({ error: "invalid_code" }, { status: 400 });
  }

  // Counted per ADDRESS across codes — see lib/auth.ts. Consumed
  // before the comparison so a wrong guess always costs an attempt,
  // including one that races another request.
  const attempt = await consume(
    `auth:verify:${email}`,
    MAX_VERIFY_ATTEMPTS,
    VERIFY_WINDOW_SEC,
  );
  if (!attempt.ok) {
    return NextResponse.json(
      { error: "too_many_attempts" },
      { status: 429, headers: { "Retry-After": String(attempt.retryAfterSec) } },
    );
  }

  try {
    const now = new Date();

    // App Store / Play review bypass. A reviewer cannot read the code we
    // mail, so onboarding is otherwise unreviewable — it stalls at step 2
    // of 5 and the app gets rejected without ever being opened.
    //
    // One reserved address accepts one fixed code. Both come from env, so
    // neither is in the repo, and BOTH must be well-formed for the bypass
    // to arm: a blank or missing var can never widen this into "any code
    // works for this address", or worse, "the empty code works for
    // everyone". Everything downstream is the normal path — the reviewer
    // gets an ordinary session, not a privileged one.
    const demoEmail = normalizeEmail(process.env.REVIEW_DEMO_EMAIL);
    const demoCode = (process.env.REVIEW_DEMO_CODE ?? "").trim();
    const isDemo =
      !!demoEmail &&
      CODE_RE.test(demoCode) &&
      email === demoEmail &&
      code === demoCode;

    if (!isDemo) {
      const codes = await authCodes();
      const doc = await codes.findOne({ email, expires_at: { $gt: now } });

      // One generic failure for wrong / expired / never-issued. The
      // caller can't act on the difference, and the difference is
      // worth something to someone guessing.
      if (!doc || !codeMatches(email, code, doc.code_hash)) {
        return NextResponse.json({ error: "invalid_code" }, { status: 400 });
      }

      // Single use. Delete before issuing the session so a replay of
      // the same code can never mint a second one.
      await codes.deleteMany({ email });
    }

    const db = await getDb();
    const accountsCol = await accounts();
    const existing = await accountsCol.findOne({ email });

    let userId: string;
    if (existing?.user_id) {
      userId = existing.user_id;
    } else {
      const waitlistRow = await db
        .collection<{ user_id?: string | null }>("waitlist")
        .findOne({ email }, { projection: { _id: 0, user_id: 1 } });

      if (waitlistRow?.user_id) userId = waitlistRow.user_id;
      else if (isUuid(body.local_user_id)) userId = body.local_user_id;
      else userId = randomUUID();
    }

    const isNew = !existing;
    const becameVerified = isNew || existing?.verified_at == null;
    let accountId: string;
    if (isNew) {
      const inserted = await accountsCol.insertOne({
        email,
        user_id: userId,
        role: "client",
        // Proven — they just read the code out of that inbox. Backfilled
        // rows (scripts/backfill-accounts.ts) carry null here instead,
        // so this field, not row existence, is the verification test.
        verified_at: now,
        created_at: now,
        last_login_at: now,
      });
      accountId = String(inserted.insertedId);
    } else {
      await accountsCol.updateOne({ email }, { $set: { last_login_at: now } });
      // First real verification for a row that was backfilled from the
      // waitlist. Only fills when absent, so it stays a FIRST-verified
      // timestamp rather than a duplicate of last_login_at.
      await accountsCol.updateOne(
        { email, $or: [{ verified_at: { $exists: false } }, { verified_at: null }] },
        { $set: { verified_at: now } },
      );
      accountId = String(existing._id);
    }

    // Keep the waitlist row's user_id in step. It is still the source
    // the legacy /installations lookup reads, so letting the two
    // diverge would hand old builds a different id than this one.
    await db.collection("waitlist").updateOne(
      { email, $or: [{ user_id: { $exists: false } }, { user_id: null }] },
      { $set: { user_id: userId } },
    );

    // Someone may have shared with this address before it had an
    // account. Attach those now, so a coach who is shared with first
    // and signs up second still finds their client waiting.
    await linkCoachShares({ userId, email });

    const [priorObservation, priorReset] = await Promise.all([
      db.collection("observations").findOne(
        { user_id: userId },
        { projection: { _id: 1 } },
      ),
      db.collection("reset_sessions").findOne(
        { user_id: userId },
        { projection: { _id: 1 } },
      ),
    ]);

    const device =
      typeof body.device === "string" && body.device.length <= 120
        ? body.device
        : null;

    const { token, expiresAt } = await issueSession({
      accountId,
      userId,
      email,
      role: existing?.role ?? "client",
      device,
      client: body.client === "web" ? "web" : "app",
    });

    // Bundle the app's gate decision into the login response. Existing
    // callers ignore this additive field; new clients avoid immediately
    // following a successful OTP exchange with a second request.
    const entitlement = await entitlementForEmail(email);

    if (becameVerified) {
      after(() =>
        notifyFounderStep(db, "email_verified", {
          identityKey: userId,
          email,
          userId,
          platform: device,
          occurredAt: now,
        }),
      );
    }

    const res = NextResponse.json({
      token,
      user_id: userId,
      is_new: isNew,
      has_cloud_data: priorObservation !== null || priorReset !== null,
      expires_at: expiresAt.toISOString(),
      entitlement,
    });

    // Web gets an httpOnly cookie as well as the token in the body —
    // the browser can't be trusted to hold a bearer token in JS, and
    // the app ignores Set-Cookie.
    if (body.client === "web") {
      res.cookies.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: WEB_SESSION_IDLE_DAYS * 24 * 60 * 60,
      });
    }

    return res;
  } catch (err) {
    console.error("[auth/verify]", err);
    return NextResponse.json({ error: "server" }, { status: 500 });
  }
}
