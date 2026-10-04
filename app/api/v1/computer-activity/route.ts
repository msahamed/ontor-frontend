import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getDb, requireSession } from '@/lib/auth';
import { obsTag } from '@/lib/coach-analytics';
import { sanitizeComputerActivity, type ComputerActivityDoc } from '@/lib/computer-activity';
export const runtime = 'nodejs';
async function collection() {
  const c = (await getDb()).collection<ComputerActivityDoc>('computer_activity');
  await c.createIndex({user_id:1,received_at:1,_id:1});
  await c.createIndex({user_id:1,start_ms:1,device_id:1});
  return c;
}
export async function POST(req: Request) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({error:'unauthorized'},{status:401});
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({error:'invalid_json'},{status:400}); }
  if (!Array.isArray(body?.observations) || body.observations.length > 200) return NextResponse.json({error:'invalid_batch'},{status:400});
  const valid = body.observations.map((r: unknown) => sanitizeComputerActivity(r,session.userId)).filter((r: ComputerActivityDoc | null): r is ComputerActivityDoc => r !== null);
  const c = await collection();
  if (valid.length) await c.bulkWrite(valid.map((d: ComputerActivityDoc) => ({updateOne:{filter:{_id:d._id,user_id:session.userId},update:{$setOnInsert:d},upsert:true}})),{ordered:false});
  revalidateTag(obsTag(session.userId),{expire:0});
  return NextResponse.json({accepted_ids:valid.map((d: ComputerActivityDoc)=>d.uuid)});
}
export async function GET(req: Request) {
  const session = await requireSession(req);
  if (!session) return NextResponse.json({error:'unauthorized'},{status:401});
  const url = new URL(req.url), since = new Date(url.searchParams.get('since') ?? 0), after = url.searchParams.get('after_id');
  if (!Number.isFinite(since.valueOf()) || (after && after.length > 200)) return NextResponse.json({error:'invalid_cursor'},{status:400});
  const rows = await (await collection()).find({user_id:session.userId,...(after ? {$or:[{received_at:{$gt:since}},{received_at:since,_id:{$gt:after}}]} : {received_at:{$gte:since}})})
    .sort({received_at:1,_id:1}).limit(201).toArray();
  const page=rows.slice(0,200), last=page.at(-1);
  return NextResponse.json({observations:page,has_more:rows.length>200,next_cursor:last?{received_at:last.received_at.toISOString(),id:last._id}:null});
}
