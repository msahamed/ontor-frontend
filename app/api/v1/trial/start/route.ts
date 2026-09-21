// POST /api/v1/trial/start — begin the free trial for the signed-in account.
//
// Returns the resulting entitlement, exactly as GET /entitlement would.
// 401 without a session.
//
// Idempotent, and deliberately one-way: the trial clock starts once per
// account and a second call returns the state already in force rather
// than restarting it. That is the whole reason entitlement lives on the
// server keyed by EMAIL — a device-bound trial would reset on reinstall,
// and anyone with a second machine would trial forever.
//
// It is also why the clock starts HERE and not at signup. Someone who
// downloads on a Friday and opens the app three weeks later should get
// fourteen days of the product, not fourteen days of having been busy.

import { NextResponse } from "next/server";
import { after } from "next/server";
import { accounts, getDb, requireSession } from "@/lib/auth";
import { sendTrialStarted } from "@/lib/billing-email";
import { notifyFounderStep } from "@/lib/founder-alerts";
import { entitlementForEmail, trialDays } from "@/lib/entitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await requireSession(req);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // The trial is for people who have never had access, not for anyone
  // whose `trial_started_at` happens to be missing. Someone who
  // subscribed without ever trialing and then lapsed has no such field,
  // so the absence test alone handed them fourteen free days — once per
  // account, but once is enough, and it rewards cancelling.
  //
  // A paying customer would also have been sent a "your trial has
  // started" email in the middle of their subscription.
  const current = await entitlementForEmail(session.email);
  if (current.state !== "none") {
    return NextResponse.json(current, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  const col = await accounts();
  // Only stamps when the field is absent, so a double-tap on a slow
  // connection cannot hand out a second trial. Comped accounts are
  // excluded too — stamping one would do no harm today (comped wins in
  // the derivation) but it would misreport when their access began.
  const started = await col.updateOne(
    {
      email: session.email,
      trial_started_at: { $exists: false },
      comped: { $ne: true },
    },
    { $set: { trial_started_at: new Date(), trial_days: trialDays() } },
  );

  const ent = await entitlementForEmail(session.email);

  // Only on the transition. The filter above matches nothing on a
  // repeat call, so a double-tap cannot send a second welcome.
  if (started.modifiedCount > 0 && ent.expires_at) {
    const endsAt = new Date(ent.expires_at);
    const db = await getDb();
    after(async () => {
      await Promise.all([
        sendTrialStarted(session.email, endsAt, trialDays()),
        notifyFounderStep(db, "trial_started", {
          identityKey: session.userId,
          email: session.email,
          userId: session.userId,
          occurredAt: new Date(),
          trialEndsAt: endsAt,
          trialDays: trialDays(),
        }),
      ]);
    });
  }

  return NextResponse.json(ent, {
    headers: { "Cache-Control": "no-store" },
  });
}
