import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
// Node's type stripping needs an extension; the app uses bundler resolution.
registerHooks({resolve(specifier,context,nextResolve) {
  if (specifier === './capture-metadata' && context.parentURL?.endsWith('/lib/computer-activity.ts')) specifier += '.ts';
  return nextResolve(specifier,context);
}});
const {sanitizeComputerActivity} = await import('../lib/computer-activity.ts');
const user='12345678-1234-4234-8234-123456789abc';
const time=Date.parse('2026-10-04T12:00:00Z');
const raw={uuid:`${user}:${time}`,user_id:user,device_id:user,start_ms:time,duration_ms:10000,utc_offset_minutes:-300,schema_version:1,
 features:{active_ms:8000,key_press_count:4,typing_gap_count:3,typical_key_interval_ms:140,scroll_amount:2,click_count:1,mouse_move_count:2,scroll_event_count:0},
 prediction:{score:72,probability:.18,model_id:'candidate-id',model_version:'lr-v1',reference_band:{median:.5,upperWidth:.1,lowerWidth:.1},reference_label:'Prior activity'},
 capture_metadata:{app_version:'1.0.8+88',build_number:'88',platform:'windows'}};
test('preserves raw measurements, original prediction and capture provenance',()=>{
 const row=sanitizeComputerActivity(raw,user);
 assert.ok(row);
 assert.deepEqual(row.features,raw.features);
 assert.deepEqual(row.prediction,raw.prediction);
 assert.deepEqual(row.capture_metadata,raw.capture_metadata);
 assert.equal(row._id,`${user}:${raw.uuid}`);
});
test('rejects foreign owners, malformed buckets, invalid scores and raw content',()=>{
 for(const patch of [{user_id:'foreign'},{start_ms:time+1},{duration_ms:300000},{prediction:{...raw.prediction,score:101}},{features:{...raw.features,active_ms:1.5}}]) assert.equal(sanitizeComputerActivity({...raw,...patch},user),null);
 const row=sanitizeComputerActivity({...raw,features:{...raw.features,typed_text:'private text',window_title:'private title'}},user);
 assert.equal(row.features.typed_text,undefined);
 assert.equal(row.features.window_title,undefined);
});
test('unavailable prediction remains null rather than an invented score',()=>{
 const row=sanitizeComputerActivity({...raw,prediction:{score:null,probability:null}},user);
 assert.ok(row);
 assert.equal(row.prediction.score,null);
 assert.equal(row.prediction.model_id,null);
});
