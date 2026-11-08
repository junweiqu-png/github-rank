import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recentProjectScopes} from '../scripts/recent-projects.mjs';
import {discoverRepositories} from '../scripts/lib/repository-discovery.mjs';

test('Recent project windows are stable within a month and cross year boundaries correctly',()=>{
 const q=recentProjectScopes('2026-11-08T11:00:00Z');
 assert.deepEqual(q,[
  'stars:>=500 fork:false created:2026-11-01..2026-11-30',
  'stars:>=500 fork:false created:2026-10-01..2026-10-31',
  'stars:100..499 fork:false created:2026-11-01..2026-11-30',
  'stars:100..499 fork:false created:2026-10-01..2026-10-31',
 ]);
 assert.deepEqual(recentProjectScopes('2026-11-30T21:00:00Z'),q);
 assert.ok(recentProjectScopes('2027-01-03T00:00:00Z').some(s=>s.includes('2026-12-01..2026-12-31')));
});

test('Unlisted repositories from October page two are found with a single, correctly bounded creation filter across runs',async()=>{
 const query=recentProjectScopes('2026-11-08T00:00:00Z')[1],calls=[];
 const api=async path=>{
  const u=new URL(path,'https://api.github.com/'),q=u.searchParams.get('q'),page=Number(u.searchParams.get('page'));
  calls.push({q,page});
  assert.equal((q.match(/created:/g)||[]).length,1,'Must not send duplicate creation qualifiers');
  assert.match(q,/created:2026-10-01T00:00:00Z\.\.2026-10-31T23:59:59Z/);
  return {total_count:175,incomplete_results:false,items:Array.from({length:page===1?100:75},(_,j)=>({
   id:(page-1)*100+j+1,full_name:'unlisted/random-project-'+((page-1)*100+j+1),stars:300,private:false,fork:false,
  }))};
 };
 const first=await discoverRepositories({api,queries:[query],maxRequests:1,now:'2026-11-08T00:00:00Z'});
 assert.equal(first.coverage.complete,false);
 assert.equal(first.repositories.length,100);
 assert.equal(first.state.pending[0].page,2);
 const second=await discoverRepositories({api,queries:[query],previousState:first.state,maxRequests:1,now:'2026-11-09T00:00:00Z'});
 assert.equal(second.coverage.complete,true);
 assert.equal(second.repositories.length,75);
 assert.ok(second.repositories.some(r=>r.full_name==='unlisted/random-project-175'));
 assert.deepEqual(calls.map(c=>c.page),[1,2]);
});
