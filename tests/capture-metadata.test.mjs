import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeMicroCues, sanitizeCaptureMetadata, capturePreservingReplacement } from '../lib/capture-metadata.ts';

test('metadata requires a capture version and strips unknown fields', () => {
  assert.equal(sanitizeCaptureMetadata(null), undefined);
  assert.equal(sanitizeCaptureMetadata({ app_version: '1.0.0' }), undefined);
  assert.deepEqual(sanitizeCaptureMetadata({app_version:'1.0.0+70',build_number:'70',platform:'macos',transcript:'not metadata'}),
    {app_version:'1.0.0+70',build_number:'70',platform:'macos'});
});
test('replacement atomically prefers original provenance and literalizes data', () => {
  const doc={_id:'abc',capture_metadata:{app_version:'1.0.0+70',build_number:'70'},transcript:'$sensitiveField'};
  const pipeline=capturePreservingReplacement(doc);
  assert.deepEqual(pipeline[0].$replaceWith.$mergeObjects[0],{$literal:doc});
  assert.deepEqual(pipeline[0].$replaceWith.$mergeObjects[1],{capture_metadata:{$ifNull:['$capture_metadata',{$literal:doc.capture_metadata}]}});
  assert.equal(capturePreservingReplacement({_id:'old'})[0].$replaceWith.$mergeObjects[1].capture_metadata.$ifNull[1].$literal,null);
});
test('observation preserves origin and cues without repeating policy metadata', () => {
  const doc={_id:'a',app_version:'1.0.2+72',platform:'ios',micro_cues:[{datetime:'2026-09-12T18:00:00.000Z',cue:'exhale'}]};
  const p=capturePreservingReplacement(doc,true)[0].$replaceWith.$mergeObjects;
  assert.deepEqual(p[0],{$literal:doc});
  assert.deepEqual(p[1].platform,{$ifNull:['$capture_metadata.platform','$platform',{$literal:'ios'}]});
  assert.deepEqual(p[1].app_version,{$ifNull:['$capture_metadata.app_version','$app_version',{$literal:'1.0.2+72'}]});
  assert.deepEqual(p[1].micro_cues,{$ifNull:['$micro_cues',{$literal:doc.micro_cues}]});
  assert.equal('capture_metadata' in p[1],false);
});
test('cue events validate timestamps, preserve empty lists and omit unknown history', () => {
  assert.equal(sanitizeMicroCues(undefined),undefined);
  assert.deepEqual(sanitizeMicroCues([]),[]);
  assert.deepEqual(sanitizeMicroCues([{datetime:'2026-09-12T13:00:00-05:00',cue:'exhale',extra:'ignored'}]),
    [{datetime:'2026-09-12T18:00:00.000Z',cue:'exhale'}]);
  for (const invalid of [[{datetime:'bad',cue:'exhale'}],[{datetime:'2026-09-12T13:00:00',cue:'exhale'}],[{datetime:'2026-09-12T18:00:00Z',cue:'$field'}]]) {
    assert.equal(sanitizeMicroCues(invalid),undefined);
  }
});
