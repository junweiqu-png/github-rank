import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,unlink,rmdir} from 'node:fs/promises';
import {sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {collectSkills} from '../scripts/collect-skills.mjs';

const oldDate='2026-10-01T00:00:00Z';
const repoA={id:1,full_name:'fixture-a/skills',category:'skills',stars:5};
const repoB={id:2,full_name:'fixture-b/skills',category:'skills',stars:4};
const oldSkill=repo=>({id:repo.id+':old/SKILL.md',repository_id:repo.id,repository:repo.full_name,path:'old/SKILL.md',blob_sha:'old-blob',name:'old-skill',description:'Previous valid observation',observed_at:oldDate,stale:false});
const scan=(repo,checked_at=oldDate)=>({id:repo.id,repository:repo.full_name,checked_at,complete:true,skill_count:1,commit_sha:'old-commit'});

async function fixtureRoot(t,previous){
 // Keep fixtures inside the writable checkout. Some Windows sandboxes deny
 // replacing an existing file through rename in the redirected OS temp folder.
 const directory=await mkdtemp(new URL('../.skill-collection-test-',import.meta.url));
 const dataRoot=pathToFileURL(directory+sep);
 t.after(async()=>{
  for(const file of ['skills.json','skills.tmp']){
   try{await unlink(new URL(file,dataRoot))}catch(error){if(error.code!=='ENOENT')throw error}
  }
  await rmdir(directory);
 });
 await writeFile(new URL('skills.json',dataRoot),JSON.stringify(previous));
 return dataRoot;
}

function metadataApi(repo,tree){
 return async path=>{
  if(path==='repos/'+repo.full_name)return {id:repo.id,full_name:repo.full_name,default_branch:'master',private:false,fork:false};
  if(path==='repos/'+repo.full_name+'/commits/master')return {sha:'pinned-commit'};
  if(path==='repos/'+repo.full_name+'/git/trees/pinned-commit?recursive=1')return typeof tree==='function'?tree():tree;
  throw Error('Unexpected API request: '+path);
 };
}

test('Exhausting the file budget in repository A preserves unstarted B and its scan time',async t=>{
 const previous={skills:[oldSkill(repoA),oldSkill(repoB)],repositories:[scan(repoA),scan(repoB,'2026-10-02T00:00:00Z')]};
 const dataRoot=await fixtureRoot(t,previous),calls=[];
 const base=metadataApi(repoA,{truncated:false,tree:[{path:'a-new/SKILL.md',type:'blob',mode:'100644',sha:'a-new'},{path:'z-new/SKILL.md',type:'blob',mode:'100644',sha:'z-new'}]});
 const result=await collectSkills({repositories:[repoA,repoB],dataRoot,limit:2,maxFileReads:1,api:async path=>{
  calls.push(path);
  if(path==='repos/'+repoA.full_name+'/contents/a-new/SKILL.md?ref=pinned-commit')return {type:'file',encoding:'base64',content:Buffer.from('---\nname: a-new\ndescription: Newly discovered skill\n---\n').toString('base64')};
  return base(path);
 }});
 assert.equal(result.coverage.attempted_this_run,1);
 assert(!calls.some(path=>path.startsWith('repos/'+repoB.full_name)));
 assert(result.skills.some(s=>s.id===oldSkill(repoA).id&&s.stale));
 assert(result.skills.some(s=>s.id===oldSkill(repoB).id&&s.observed_at===oldDate));
 assert(result.skills.some(s=>s.name==='a-new'&&!s.stale));
 assert.deepEqual(result.repositories.find(r=>r.id===repoB.id),previous.repositories[1]);
 const saved=JSON.parse(await readFile(new URL('skills.json',dataRoot),'utf8'));
 assert.deepEqual(saved.skills,result.skills);
});

test('A reused repository name with a different GitHub id cannot be scanned under the old identity',async t=>{
 const dataRoot=await fixtureRoot(t,{skills:[oldSkill(repoA)],repositories:[scan(repoA)]}),calls=[];
 const result=await collectSkills({repositories:[repoA],dataRoot,api:async path=>{
  calls.push(path);
  assert.equal(path,'repos/'+repoA.full_name);
  return {id:999,full_name:repoA.full_name,default_branch:'main',private:false,fork:false};
 }});
 assert.deepEqual(calls,['repos/'+repoA.full_name]);
 assert.equal(result.skills.length,1);
 assert.equal(result.skills[0].repository_id,repoA.id);
 assert.equal(result.skills[0].id,oldSkill(repoA).id);
 assert.equal(result.skills[0].stale,true);
 assert.equal(result.skills[0].observed_at,oldDate);
 assert.equal(result.repositories[0].complete,false);
 assert(result.errors.some(error=>error.includes('仓库身份已变化')));
});

test('A failed empty-looking scan retains old skills; only a complete empty tree deletes them',async t=>{
 const dataRoot=await fixtureRoot(t,{skills:[oldSkill(repoA)],repositories:[scan(repoA)]});
 const failed=await collectSkills({repositories:[repoA],dataRoot,api:metadataApi(repoA,()=>{throw Error('403 rate limit')})});
 assert.equal(failed.skills.length,1);assert.equal(failed.skills[0].stale,true);assert.equal(failed.repositories[0].complete,false);
 const complete=await collectSkills({repositories:[repoA],dataRoot,api:metadataApi(repoA,{tree:[],truncated:false})});
 assert.deepEqual(complete.skills,[]);assert.equal(complete.repositories[0].complete,true);assert.deepEqual(complete.errors,[]);
 const saved=JSON.parse(await readFile(new URL('skills.json',dataRoot),'utf8'));
 assert.deepEqual(saved.skills,[]);
});

test('Fair passes finish a large repository and a newly discovered candidate using raw files and cached inventories',async t=>{
 const candidate={id:2,full_name:'unknown/publisher',category:'projects',skill_candidate:true,stars:4};
 const dataRoot=await fixtureRoot(t,{skills:[],repositories:[]}),calls=[],rawCalls=[];
 const heads=new Map([repoA,candidate].map(r=>[String(r.id),{id:r.id,full_name:r.full_name,commit_sha:'pinned',default_branch:'main'}]));
 const result=await collectSkills({repositories:[repoA,candidate],dataRoot,heads,passes:4,perRepositoryFileReads:1,maxFileReads:10,discoveryComplete:true,
  api:async path=>{calls.push(path);if(!path.includes('/git/trees/pinned?recursive=1'))throw Error('Only tree calls use REST');const count=path.includes(repoA.full_name)?3:1;return {tree:Array.from({length:count},(_,i)=>({path:String(i)+'/SKILL.md',type:'blob',mode:'100644',sha:'blob-'+i})),truncated:false}},
  rawText:async(r,path,ref)=>{rawCalls.push([r.id,path,ref]);return '---\nname: skill-'+path[0]+'\ndescription: A valid skill\n---'}
 });
 assert.equal(calls.length,2);assert.equal(rawCalls.length,4);assert.equal(result.skills.length,4);
 assert.equal(result.coverage.candidate_repositories,2);assert.equal(result.coverage.complete_repositories,2);
 assert.equal(result.coverage.pending_repositories,0);assert.equal(result.coverage.complete,true);assert.deepEqual(result.errors,[]);
});
