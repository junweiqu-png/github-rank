import {test} from 'node:test';
import assert from 'node:assert/strict';
import {collectionDue} from '../scripts/collection-cadence.mjs';
const base='2026-11-08T12:48:36Z';
const partial={discovery:{general:{complete:false},skills:{complete:false},unlabelled_skill_probes:{complete:false}},skills:{complete:false}};
const complete={discovery:{general:{complete:true},skills:{complete:true},unlabelled_skill_probes:{complete:true}},skills:{complete:true}};
test('Backlogged discovery resumes on the following scheduled day, despite slightly less than 24h elapsed',()=>{
 assert.equal(collectionDue({eventName:'schedule',updatedAt:base,status:partial,now:'2026-11-09T12:17:00Z'}),true);
 assert.equal(collectionDue({eventName:'schedule',updatedAt:base,status:partial,now:'2026-11-08T14:17:00Z'}),false);
});
test('Completed coverage returns to original three-day cadence',()=>{
 assert.equal(collectionDue({eventName:'schedule',updatedAt:base,status:complete,now:'2026-11-10T12:17:00Z'}),false);
 assert.equal(collectionDue({eventName:'schedule',updatedAt:base,status:complete,now:'2026-11-12T12:17:00Z'}),true);
});
test('Push and manual dispatch do not inherit scheduled cadence',()=>{
 for(const eventName of ['push','workflow_dispatch'])assert.equal(collectionDue({eventName,updatedAt:base,status:complete,now:'2026-11-08T13:00:00Z'}),true);
});
