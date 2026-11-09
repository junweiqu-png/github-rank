import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isSkillCandidate} from '../scripts/collect-skills.mjs';
import {probeUnlabelledSkillRepositories} from '../scripts/lib/skill-probe.mjs';

const unknown=(id=111,commit_sha='rev1')=>({id,full_name:'unlisted/ordinary-utility-'+id,category:'projects',description:'A standalone editor',topics:[],stars:500,commit_sha});
const hit=path=>({tree:[{path,type:'blob',sha:'filehash',mode:'100644'}],truncated:false});
const empty=()=>({tree:[],truncated:false});

test('An unrelated project with no Skill hints is detected by its actual SKILL.md tree, without manual names',async()=>{
 const repo=unknown();assert.equal(isSkillCandidate(repo,[]),false);
 const calls=[];
 const result=await probeUnlabelledSkillRepositories({repositories:[repo],isCandidate:r=>isSkillCandidate(r,[]),api:async path=>{calls.push(path);return hit('deep/folder/SKILL.md')}});
 assert.equal(result.coverage.probed_this_run,1);
 assert.equal(result.coverage.detected_this_run,1);
 assert.equal(isSkillCandidate(repo,[]),true);
 assert.equal(result.state.entries[0].has_skill_file,true);
 assert.match(calls[0],/git\/trees\/rev1\?recursive=1/);
 const second=unknown();
 const repeat=await probeUnlabelledSkillRepositories({repositories:[second],isCandidate:r=>isSkillCandidate(r,[]),previousState:result.state,api:async()=>{throw Error('Cached revision should not rescan')}});
 assert.equal(repeat.coverage.cached,1);
 assert.equal(second.skill_candidate,true);
});

test('Unknown repositories without a SKILL.md are negatively cached by commit, and refreshed on new commits',async()=>{
 const first=unknown(222,'old'),calls=[];
 const api=async path=>{calls.push(path);return empty()};
 const a=await probeUnlabelledSkillRepositories({repositories:[first],api,isCandidate:()=>false});
 assert.equal(a.coverage.probed_this_run,1);
 assert.equal(first.skill_candidate,undefined);
 const b=await probeUnlabelledSkillRepositories({repositories:[unknown(222,'old')],api,previousState:a.state,isCandidate:()=>false});
 assert.equal(b.coverage.probed_this_run,0);assert.equal(calls.length,1);
 const fresh=unknown(222,'new');
 const c=await probeUnlabelledSkillRepositories({repositories:[fresh],api,previousState:b.state,isCandidate:()=>false});
 assert.equal(c.coverage.probed_this_run,1);assert.equal(c.state.entries[0].sha,'new');
});

test('A truncated unlabelled tree is resumable: it cannot falsely cache a negative or starve another repo',async()=>{
 const a=unknown(333),b=unknown(334);
 const rootTree={tree:[{type:'tree',path:'src',sha:'subtree'}],truncated:true};
 const first=await probeUnlabelledSkillRepositories({repositories:[a,b],isCandidate:()=>false,maxRepositories:2,maxTreeRequests:1,now:'2026-11-08T12:00:00Z',
  api:async path=>path.includes('ordinary-utility-333')?rootTree:empty()});
 assert.equal(first.coverage.probed_this_run,2);
 const states=new Map(first.state.entries.map(x=>[x.id,x]));
 assert.equal(states.get('333').status,'incomplete');
 assert.equal(states.get('334').status,'complete');
 assert.ok(states.get('333').pending_trees.length>0);
 const calls=[],retried=unknown(333),cached=unknown(334);
 const second=await probeUnlabelledSkillRepositories({repositories:[retried,cached],isCandidate:()=>false,previousState:first.state,maxRepositories:1,maxTreeRequests:2,now:'2026-11-09T12:30:00Z',
  api:async path=>{
   calls.push(path);
   if(path.includes('/git/trees/rev1'))return {tree:[{type:'tree',path:'src',sha:'subtree'}],truncated:false};
   if(path.includes('/git/trees/subtree'))return hit('SKILL.md');
   throw Error('Unexpected tree path '+path);
  }});
 assert.equal(second.coverage.probed_this_run,1);
 assert.equal(second.coverage.detected_this_run,1);
 assert.equal(retried.skill_candidate,true);
 assert.equal(calls.length,2);
 assert.ok(calls.every(path=>!path.includes('recursive=1')),'Resumed pending trees rather than restarting a truncated recursive scan');
});

test('Older incomplete probe is retried instead of starving behind newly found repositories',async()=>{
 const older=unknown(808,'rev1'),newer={...unknown(809,'rev1'),stars:990000};
 const previousState={version:1,entries:[{id:'808',sha:'rev1',status:'incomplete',has_skill_file:false,checked_at:'2026-11-01T00:00:00Z'}]};
 const calls=[];
 const r=await probeUnlabelledSkillRepositories({repositories:[newer,older],previousState,isCandidate:()=>false,maxRepositories:1,now:'2026-11-09T00:00:00Z',
  api:async path=>{calls.push(path);return empty()}});
 assert.equal(r.coverage.probed_this_run,1);
 assert.equal(calls.length,1);
 assert.match(calls[0],/ordinary-utility-808/);
});
test('Domain-fair probe scheduling does not starve media and desktop tools behind AI mega-projects',async()=>{
 const manyAI=Array.from({length:22},(_,i)=>({...unknown(2000+i),domain:'ai',stars:99999-i}));
 const media={...unknown(3099),domain:'media',stars:3};
 const calls=[];
 const r=await probeUnlabelledSkillRepositories({repositories:[...manyAI,media],isCandidate:()=>false,maxRepositories:4,
  api:async path=>{calls.push(path);return empty()}});
 assert.equal(r.coverage.probed_this_run,4);
 assert.ok(calls.some(path=>path.includes('ordinary-utility-3099')),'Media is scheduled without any curated seed list');
});
test('Independent Git-tree probes run concurrently under a fixed concurrency cap',async()=>{
 const repos=Array.from({length:8},(_,i)=>({...unknown(3200+i),domain:'misc'}));
 let active=0,peak=0;
 const r=await probeUnlabelledSkillRepositories({repositories:repos,isCandidate:()=>false,maxRepositories:8,maxConcurrent:3,
  api:async()=>{active++;peak=Math.max(peak,active);await new Promise(resolve=>setTimeout(resolve,12));active--;return empty()}});
 assert.equal(r.coverage.probed_this_run,8);
 assert.ok(peak>=2,'Independent tree scans should overlap');
 assert.ok(peak<=3,'Concurrency cap must be respected');
});

test('Generic probe recognizes a lowercase skill.md path',async()=>{
 const repo=unknown(9001);
 const result=await probeUnlabelledSkillRepositories({repositories:[repo],isCandidate:()=>false,api:async()=>hit('crates/setup/src/skill.md')});
 assert.equal(result.coverage.detected_this_run,1);
 assert.equal(repo.skill_candidate,true);
});
test('Generic probe ignores repositories that only contain testdata Skill fixtures',async()=>{
 const repo=unknown(9002);
 const result=await probeUnlabelledSkillRepositories({repositories:[repo],isCandidate:()=>false,api:async()=>hit('internal/sessions/testdata/droid-skills/skills/greet-user/SKILL.md')});
 assert.equal(result.coverage.detected_this_run,0);
 assert.equal(repo.skill_candidate,undefined);
 assert.equal(result.state.entries[0].status,'complete');
});
