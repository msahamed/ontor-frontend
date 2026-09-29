import { NextResponse } from 'next/server';
import { authorizeUser } from '@/lib/auth';
import { getMongoClient } from '@/lib/mongodb';
import { sanitizeNudgeEvent, nudgeEventUpsert, UUID_RE, type NudgeEventDoc } from '@/lib/nudge-events';

export const runtime = 'nodejs';
const MAX_BATCH = 200;

async function collection() {
  const c = (await getMongoClient()).db('healthos').collection<NudgeEventDoc>('nudge_events');
  await c.createIndex({ user_id: 1, received_at: 1, _id: 1 });
  return c;
}

export async function POST(req: Request) {
  let body;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const user = body?.user_id;
  if (typeof user !== 'string' || !UUID_RE.test(user)) return NextResponse.json({ error: 'user_id_required' }, { status: 400 });
  const auth = await authorizeUser(req, user);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!Array.isArray(body.nudge_events)) return NextResponse.json({ error: 'nudge_events_required' }, { status: 400 });
  if (body.nudge_events.length > MAX_BATCH) return NextResponse.json({ error: 'batch_too_large' }, { status: 413 });
  const valid = body.nudge_events.map((r: unknown) => sanitizeNudgeEvent(r, user)).filter((r: NudgeEventDoc | null): r is NudgeEventDoc => r !== null);
  try {
    const c = await collection();
    if (valid.length) await c.bulkWrite(valid.map(nudgeEventUpsert), { ordered: false });
    // Never acknowledge rejected documents. The client retains unacknowledged events.
    return NextResponse.json({ accepted_ids: valid.map((d: NudgeEventDoc) => d.uuid), rejected: body.nudge_events.length - valid.length });
  } catch (error) {
    console.error('[nudge-sync push]', error);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const user = url.searchParams.get('user_id') ?? '';
  if (!UUID_RE.test(user)) return NextResponse.json({ error: 'user_id_required' }, { status: 400 });
  const auth = await authorizeUser(req, user);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const since = new Date(url.searchParams.get('since') ?? 0);
  const after = url.searchParams.get('after_id');
  if (!Number.isFinite(since.valueOf()) || (after !== null && !UUID_RE.test(after))) return NextResponse.json({ error: 'invalid_cursor' }, { status: 400 });
  const requested = Number(url.searchParams.get('limit') ?? MAX_BATCH);
  const limit = Number.isInteger(requested) && requested > 0 ? Math.min(requested, MAX_BATCH) : MAX_BATCH;
  try {
    const rows = await (await collection()).find({ user_id: user, ...(after ? {
      $or: [{ received_at: { $gt: since } }, { received_at: since, _id: { $gt: after } }],
    } : { received_at: { $gte: since } }) }).sort({ received_at: 1, _id: 1 }).limit(limit + 1).toArray();
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return NextResponse.json({ nudge_events: page, has_more: rows.length > limit,
      next_cursor: last ? { received_at: last.received_at.toISOString(), id: last.uuid } : null });
  } catch (error) {
    console.error('[nudge-sync pull]', error);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
