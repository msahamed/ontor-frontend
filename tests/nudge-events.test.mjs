import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeNudgeEvent, nudgeEventUpsert } from '../lib/nudge-events.ts';
const user = '12345678-1234-4234-8234-123456789abc';
const raw = { uuid: user, user_id: user, nudge_id: user, device_id: user,
  event: 'snoozed', source: 'activity', occurred_at: '2026-09-29T12:00:00Z',
  metadata: { snooze_minutes: 30, active_minutes: 63 }, capture_metadata: { app_version: '1.0+1' }, schema_version: 1 };
test('valid events preserve timestamps and metadata with server receipt time', () => {
  const now = new Date();
  const doc = sanitizeNudgeEvent(raw, user, now);
  assert.equal(doc.received_at, now);
  assert.deepEqual(doc.metadata, raw.metadata);
  assert.equal(doc.occurred_at, '2026-09-29T12:00:00.000Z');
});
test('invalid owners, actions, references and unsafe metadata are rejected', () => {
  for (const change of [{user_id: 'other'}, {event: 'unknown'}, {occurred_at: 'yesterday'},
    {source_observation_uuid: 'bad'}, {metadata: {'$set': 'bad'}}, {metadata: {body: 'a'.repeat(2049)}}]) {
    assert.equal(sanitizeNudgeEvent({...raw, ...change}, user), null);
  }
});
test('retry upserts are immutable and scoped to owner', () => {
  const doc = sanitizeNudgeEvent(raw, user);
  const write = nudgeEventUpsert(doc).updateOne;
  assert.deepEqual(write.filter, {_id: user, user_id: user});
  assert.deepEqual(Object.keys(write.update), ['$setOnInsert']);
  assert.equal(write.upsert, true);
});
