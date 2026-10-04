import { NextResponse } from 'next/server';
import { authorizeUser, DB_NAME } from '@/lib/auth';
import { getMongoClient } from '@/lib/mongodb';
import { MODEL_UUID, sanitizeModelRecord, modelRecordUpsert, type ModelRecord } from '@/lib/model-checkpoints';
export const runtime = 'nodejs';
async function collection() {
  const c = (await getMongoClient()).db(DB_NAME).collection<ModelRecord>('model_checkpoints');
  await c.createIndex({ user_id: 1, created_at: 1, id: 1 });
  return c;
}
export async function POST(req: Request) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const user = body?.user_id;
  if (typeof user !== 'string' || !MODEL_UUID.test(user)) return NextResponse.json({ error: 'user_id_required' }, { status: 400 });
  const auth = await authorizeUser(req, user);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (!Array.isArray(body.records) || body.records.length > 50) return NextResponse.json({ error: 'invalid_batch' }, { status: 400 });
  const valid = body.records.map((r: unknown) => sanitizeModelRecord(r, user)).filter((r: ModelRecord | null): r is ModelRecord => r !== null);
  try {
    if (valid.length) await (await collection()).bulkWrite(valid.map(modelRecordUpsert), { ordered: false });
    return NextResponse.json({ accepted_ids: valid.map((d: ModelRecord) => d.id), rejected: body.records.length - valid.length });
  } catch (error) {
    console.error('[model-checkpoints push]', error);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
export async function GET(req: Request) {
  const u = new URL(req.url), user = u.searchParams.get('user_id') ?? '';
  if (!MODEL_UUID.test(user)) return NextResponse.json({ error: 'user_id_required' }, { status: 400 });
  const auth = await authorizeUser(req, user);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const after = u.searchParams.get('after_id'), since = u.searchParams.get('since');
  if ((after && !MODEL_UUID.test(after)) || (since && !Number.isFinite(Date.parse(since)))) return NextResponse.json({ error: 'invalid_cursor' }, { status: 400 });
  try {
    const rows = await (await collection()).find({ user_id: user, kind: 'checkpoint', ...(since ? {
      $or: [{ created_at: { $gt: since } }, { created_at: since, id: { $gt: after ?? '' } }],
    } : {}) }).sort({ created_at: 1, id: 1 }).limit(51).toArray();
    const page = rows.slice(0, 50), last = page.at(-1);
    return NextResponse.json({ checkpoints: page, has_more: rows.length > 50,
      next_cursor: last ? { since: last.created_at, after_id: last.id } : null });
  } catch { return NextResponse.json({ error: 'server' }, { status: 500 }); }
}
