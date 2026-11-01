import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discoverRepositories} from '../scripts/lib/repository-discovery.mjs';

const now=new Date('2026-11-01T09:00:00Z');
const query='topic:agent-skills fork:false';
const repo=id=>({id,full_name:'example/skill-'+id,private:false,fork:false});
function request(path){const u=new URL(path,'https://api.github.com/');return {q:u.searchParams.get('q'),page:Number(u.searchParams.get('page')),perPage:Number(u.searchParams.get('per_page'))}}
function dates(q){const m=q.match(/created:([^ ]+)\.\.([^ ]+)/);return m?[Date.parse(m[1]),Date.parse(m[2])]:null}

test('Repository discovery paginates instead of stopping at the first 100 results',async()=>{
 const calls=[];
 const result=await discoverRepositories({queries:[query],now,api:async path=>{const p=request(path);calls.push(p);return {total_count:150,incomplete_results:false,items:Array.from({length:p.page===1?100:50},(_,i)=>repo((p.page-1)*100+i+1))}}});
 assert.deepEqual(calls.map(c=>c.page),[1,2]);assert.ok(calls.every(c=>c.perPage===100));
 assert.equal(result.repositories.length,150);assert.equal(result.coverage.complete,true);
});

test('A query beyond the 1000-result cap splits disjoint creation ranges and preserves probe candidates',async()=>{
 const calls=[];let initial;
 const result=await discoverRepositories({queries:[query],now,api:async path=>{const p=request(path),range=dates(p.q);calls.push(range);if(!initial){initial=range;return {total_count:1500,items:[repo(1)],incomplete_results:false}}return {total_count:1,items:[repo(calls.length)],incomplete_results:false}}});
 assert.equal(calls.length,3);assert.equal(calls[1][0],initial[0]);assert.equal(calls[2][1],initial[1]);
 assert.equal(calls[1][1]+1000,calls[2][0]);assert.equal(result.repositories.length,3);assert.equal(result.coverage.complete,true);
});

test('A one-day overflow can split down to distinct seconds',async()=>{
 const previousState={version:1,queries:[query],cycle_started_at:now.toISOString(),complete:false,pending:[{query,start:'2026-11-01T00:00:00Z',end:'2026-11-01T23:59:59Z',page:1}]};
 const result=await discoverRepositories({queries:[query],previousState,now,maxRequests:1,api:async()=>({total_count:2000,items:[],incomplete_results:false})});
 assert.equal(result.state.pending.length,2);
 assert.equal(Date.parse(result.state.pending[0].end)+1000,Date.parse(result.state.pending[1].start));
 assert.equal(result.coverage.complete,false);
});

test('Budget exhaustion resumes at the next page, then a finished cycle discovers anew',async()=>{
 const calls=[];const api=async path=>{const p=request(path);calls.push(p.page);return {total_count:101,items:[repo(p.page)],incomplete_results:false}};
 const first=await discoverRepositories({queries:[query],api,now,maxRequests:1});
 assert.equal(first.coverage.complete,false);assert.equal(first.state.pending[0].page,2);
 const second=await discoverRepositories({queries:[query],api,now,maxRequests:1,previousState:first.state});
 assert.equal(second.coverage.complete,true);
 await discoverRepositories({queries:[query],api,now,maxRequests:1,previousState:second.state});
 assert.deepEqual(calls,[1,2,1]);
});

test('The first page of every source is visited before any source second page',async()=>{
 const calls=[];const queries=[query,'SKILL.md in:readme fork:false'];
 const result=await discoverRepositories({queries,now,maxRequests:3,api:async path=>{const p=request(path);calls.push(p);return {total_count:200,items:[repo(calls.length)],incomplete_results:false}}});
 assert.deepEqual(calls.map(c=>c.page),[1,1,2]);assert.ok(calls[1].q.startsWith(queries[1]));assert.equal(result.coverage.complete,false);
});

test('Failed and incomplete queries retain progress and retry later without hiding candidates',async()=>{
 const queries=['topic:failed fork:false','topic:partial fork:false','topic:ok fork:false'];
 const calls=[];const first=await discoverRepositories({queries,now,api:async path=>{const p=request(path);calls.push(p);if(p.q.startsWith(queries[0]))throw Error('temporary outage');return {total_count:1,items:[repo(p.q.startsWith(queries[1])?2:3)],incomplete_results:p.q.startsWith(queries[1])}}});
 assert.equal(calls.length,3);assert.equal(first.state.pending.length,2);assert.equal(first.coverage.complete,false);
 assert.deepEqual(first.repositories.map(r=>r.id),[2,3]);assert.equal(first.errors.length,2);
 const second=await discoverRepositories({queries,now,previousState:first.state,api:async()=>({total_count:0,items:[],incomplete_results:false})});
 assert.equal(second.coverage.complete,true);
});

test('Repository identity deduplicates renamed results and excludes private repos and forks',async()=>{
 const result=await discoverRepositories({queries:[query],now,api:async()=>({total_count:4,incomplete_results:false,items:[repo(1),{...repo(1),full_name:'renamed/skill'},{...repo(2),fork:true},{...repo(3),private:true}]})});
 assert.equal(result.repositories.length,1);assert.equal(result.repositories[0].full_name,'renamed/skill');
});

test('Repeatedly incomplete scopes narrow after a retry instead of retrying the same broad search forever',async()=>{
 const api=async()=>({total_count:1,items:[repo(1)],incomplete_results:true});
 const first=await discoverRepositories({queries:[query],now,api,maxRequests:1});
 assert.equal(first.state.pending.length,1);
 const second=await discoverRepositories({queries:[query],now,api,maxRequests:1,previousState:first.state});
 assert.equal(second.state.pending.length,2);assert.equal(second.coverage.complete,false);
 assert.equal(Date.parse(second.state.pending[0].end)+1000,Date.parse(second.state.pending[1].start));
});

test('An unsplittable one-second overflow stays pending rather than claiming complete coverage',async()=>{
 const previousState={version:1,queries:[query],cycle_started_at:now.toISOString(),complete:false,pending:[{query,start:'2026-11-01T00:00:00Z',end:'2026-11-01T00:00:00Z',page:10}]};
 const result=await discoverRepositories({queries:[query],previousState,now,maxRequests:1,api:async()=>({total_count:1500,items:[repo(1)],incomplete_results:false})});
 assert.equal(result.coverage.complete,false);assert.equal(result.state.pending.length,1);assert.equal(result.state.pending[0].page,1);
 assert.match(result.errors.join(' '),/1000/);
});
