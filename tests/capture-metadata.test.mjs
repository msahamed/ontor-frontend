import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeCaptureMetadata, capturePreservingReplacement } from '../lib/capture-metadata.ts';

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
test('observation platform remains the recording origin on cross-device sync', () => {
  const capture={app_version:'1.0.0+70',build_number:'70',platform:'ios'};
  const p=capturePreservingReplacement({_id:'a',capture_metadata:capture,platform:'macos'},true);
  assert.deepEqual(p[0].$replaceWith.$mergeObjects[1].platform,
    {$ifNull:['$capture_metadata.platform',{$literal:'ios'}]});
  const legacy=capturePreservingReplacement({_id:'a',platform:'macos'},true);
  assert.equal(legacy[0].$replaceWith.$mergeObjects[1].platform.$ifNull[0],'$capture_metadata.platform');
  assert.equal(sanitizeCaptureMetadata({...capture,platform:'other'}).platform,undefined);
});
