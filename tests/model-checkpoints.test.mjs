import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeModelRecord, modelRecordUpsert } from '../lib/model-checkpoints.ts';
const id='12345678-1234-4234-8234-123456789abc';
const cp={schema_version:1,kind:'checkpoint',id,user_id:id,device_id:id,parent_id:null,parent_weights_sha256:null,delta_from_parent:null,created_at:'2026-10-02T12:00:00Z',origin:'candidate',
 model_spec:{base_version:'lr-v1',feature_version:'42-v1',model_type:'logistic_regression',weight_count:42,bias:.04,scaler_mean:Array(42).fill(0),scaler_scale:Array(42).fill(1),feature_names:Array.from({length:42},(_,i)=>`f${i}`)},
 weights:Array(42).fill(.2),weights_sha256:'a'.repeat(64),feedback_ids:['snapshot1'],label_count:1,trainer:{version:'v1'},training_metrics:{loss_before:1,loss_after:.9}};
test('separate checkpoint preserves weights, lineage and training provenance',()=>{
 const d=sanitizeModelRecord(cp,id);assert.ok(d);assert.deepEqual(d.weights,cp.weights);assert.deepEqual(d.feedback_ids,['snapshot1']);
 assert.deepEqual(Object.keys(modelRecordUpsert(d).updateOne.update),['$setOnInsert']);
});
test('invalid ownership, parameters, compatibility metadata and provenance rejected',()=>{
 for(const patch of [{user_id:'other'},{weights:[1]},{weights:Array(42).fill(Infinity)},{parent_id:'bad'},{feedback_ids:['x','x'],label_count:2},{label_count:2},{model_spec:{...cp.model_spec,feature_names:[]}}]) assert.equal(sanitizeModelRecord({...cp,...patch},id),null);
});
test('evaluation is separate and cannot claim an inconsistent nudge result',()=>{
 const e={schema_version:1,kind:'evaluation',id,user_id:id,device_id:id,created_at:cp.created_at,checkpoint_id:id,feedback_id:'snapshot2',tired:false,below_fraction:.5,through_ms:123000,minutes:50,pace_qualified:false,nudge_qualified:false,evaluated_before_training:true};
 assert.ok(sanitizeModelRecord(e,id));assert.equal(sanitizeModelRecord({...e,nudge_qualified:true},id),null);assert.equal(sanitizeModelRecord({...e,evaluated_before_training:false},id),null);
});
test('checkpoint policy and future AUC summaries survive cloud sanitization',()=>{
 const summary={auc:.75,example_count:8,yes_count:4,no_count:4,policy_usable:true,scope:'prospective_feedback_only',score:'five_minute_below_baseline_fraction',first_feedback_at:cp.created_at,last_feedback_at:cp.created_at};
 const policy={reason:'sustained_auc_decline',policy_version:'auc-gated-v1',new_examples:8,parent_evaluation:summary};
 assert.deepEqual(sanitizeModelRecord({...cp,training_metrics:{...cp.training_metrics,training_policy:policy}},id).training_metrics.training_policy,policy);
 const e={schema_version:1,kind:'evaluation',id,user_id:id,device_id:id,created_at:cp.created_at,checkpoint_id:id,feedback_id:'snapshot2',tired:false,below_fraction:.5,through_ms:123000,minutes:50,pace_qualified:false,nudge_qualified:false,evaluated_before_training:true,auc_summary:summary};
 assert.deepEqual(sanitizeModelRecord(e,id).auc_summary,summary);
 for(const patch of [{auc:1.1},{yes_count:-1},{example_count:9},{scope:'training_fit'}]) assert.equal(sanitizeModelRecord({...e,auc_summary:{...summary,...patch}},id),null);
});
test('paired future AUC comparison is preserved in the same evaluation record',()=>{
 const comparison={policy_version:'paired-auc-v1',active_id:id,candidate_id:id,shared_examples:5,yes_count:2,no_count:3,active_auc:.5,candidate_auc:.7,previous_active_auc:.5,previous_candidate_auc:.65,ready:true,replaceable:false,scope:'shared_prospective_feedback_only'};
 const e={schema_version:1,kind:'evaluation',id,user_id:id,device_id:id,created_at:cp.created_at,checkpoint_id:id,feedback_id:'snapshot2',tired:false,below_fraction:.5,through_ms:123000,minutes:50,pace_qualified:false,nudge_qualified:false,evaluated_before_training:true,comparison};
 assert.deepEqual(sanitizeModelRecord(e,id).comparison,comparison);
 assert.equal(sanitizeModelRecord({...e,comparison:{...comparison,shared_examples:7}},id),null);
});
test('automatic activation preserves AUC decision and previous model in the same collection',()=>{
 const previous='22345678-1234-4234-8234-123456789abc';
 const comparison={policy_version:'paired-auc-v1',active_id:previous,candidate_id:id,shared_examples:5,yes_count:2,no_count:3,active_auc:.5,candidate_auc:.7,previous_active_auc:.5,previous_candidate_auc:.65,ready:true,replaceable:false,scope:'shared_prospective_feedback_only'};
 const e={schema_version:1,kind:'activation',id,user_id:id,device_id:id,created_at:cp.created_at,checkpoint_id:id,previous_checkpoint_id:previous,reason:'auc_improved_twice',comparison};
 assert.deepEqual(sanitizeModelRecord(e,id).comparison,comparison);
 assert.equal(sanitizeModelRecord({...e,comparison:{...comparison,ready:false}},id),null);
 assert.equal(sanitizeModelRecord({...e,previous_checkpoint_id:id},id),null);
});
