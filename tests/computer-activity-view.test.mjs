import test from 'node:test';
import assert from 'node:assert/strict';
import {activityDayFromObservations} from '../lib/computer-activity-view.ts';
const at=Date.parse('2026-10-04T12:00:00Z');
const doc=(time,device,score,active=10000)=>({start_ms:time,device_id:device,utc_offset_minutes:0,features:{active_ms:active},prediction:{score,reference_band:{median:.5,lowerWidth:.1,upperWidth:.2}}});
test('overlapping devices keep immutable scores and count time once',()=>{
 const docs=[doc(at,'mac',20),doc(at,'windows',80),doc(at+10000,'mac',70)];
 const result=activityDayFromObservations(docs,'2026-10-04');
 assert.equal(result.activeMs,20000);
 assert.equal(result.windows.length,2);
 assert.equal(result.pace.length,1);
 assert.equal(result.pace[0].mean,60);
 assert.deepEqual(result.paceBand,{median:50,low:40,high:70});
 assert.equal(docs[0].prediction.score,20);
});
test('capture-local date and missing predictions stay distinct from zero',()=>{
 const row=doc(Date.parse('2026-10-05T02:00:00Z'),'mac',null,0);
 row.utc_offset_minutes=-300;
 assert.equal(activityDayFromObservations([row],'2026-10-05'),null);
 const result=activityDayFromObservations([row],'2026-10-04');
 assert.equal(result.activeMs,0);
 assert.deepEqual(result.pace,[]);
 assert.equal(result.latestPace,null);
});
test('five minute breaks split stretches',()=>{
 const result=activityDayFromObservations([doc(at,'mac',20),doc(at+310000,'mac',80)],'2026-10-04');
 assert.equal(result.activeMs,20000);
 assert.equal(result.longestStretchMs,10000);
});
