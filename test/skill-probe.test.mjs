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
