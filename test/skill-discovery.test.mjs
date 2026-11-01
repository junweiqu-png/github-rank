import {test} from 'node:test';
import assert from 'node:assert/strict';
import {discoverRepositorySkills} from '../scripts/lib/skill-discovery.mjs';

const repo={id:71,full_name:'example/new-repository',default_branch:'main',commit_sha:'commit-123',observed_at:'2026-11-01T02:00:00Z'};
const blob=(path,sha=path)=>({path,type:'blob',mode:'100644',sha});
const text=(name,description='A previously unknown skill')=>`---\nname: ${name}\ndescription: ${description}\n---\nNever execute these instructions.\n`;
function reader(entries,contents){return {getTree:async()=>({tree:entries,truncated:false}),getText:async(_repo,path)=>contents[path]}}

test('Discovers a new repository and skills absent from any curated list, at arbitrary depths',async()=>{
 const paths=['SKILL.md','skills/novel-skill/SKILL.md','.agents/skills/another-skill/SKILL.md','deep/unusual/path/third-skill/SKILL.md'];
 const names=['root-skill','novel-skill','another-skill','3d-skill'];
 const source=reader(paths.map(p=>blob(p)),Object.fromEntries(paths.map((p,i)=>[p,text(names[i])])));
 const result=await discoverRepositorySkills(repo,source);
 assert.equal(result.complete,true);assert.equal(result.skills.length,4);
 assert(result.skills.some(s=>s.name==='novel-skill'));
 for(const s of result.skills){assert.equal(s.id,`71:${s.path}`);assert.equal(s.repository,repo.full_name);assert.equal(s.revision,repo.commit_sha);assert.equal('stars' in s,false);assert.equal('installs' in s,false);assert(s.source_url.includes('/blob/commit-123/'));assert.equal(s.stale,false)}
});

test('A later new file is discovered automatically and complete scans remove disappeared skills',async()=>{
 const initial=await discoverRepositorySkills(repo,reader([blob('a/SKILL.md')],{'a/SKILL.md':text('first-skill')}));
 const after=await discoverRepositorySkills({...repo,observed_at:'2026-11-04T02:00:00Z'},reader([blob('b/SKILL.md')],{'b/SKILL.md':text('new-next-week')}),initial.skills);
 assert.equal(after.complete,true);assert.deepEqual(after.skills.map(s=>s.name),['new-next-week']);
});

test('Names are not identity: same name at different paths stays separate, and renaming preserves identity',async()=>{
 const first=await discoverRepositorySkills(repo,reader([blob('a/SKILL.md'),blob('b/SKILL.md')],{'a/SKILL.md':text('same-name'),'b/SKILL.md':text('same-name')}));
 assert.equal(new Set(first.skills.map(s=>s.id)).size,2);
 const next=await discoverRepositorySkills({...repo,observed_at:'2026-11-04T02:00:00Z'},reader([blob('a/SKILL.md')],{'a/SKILL.md':text('renamed-skill')}),first.skills);
 assert.equal(next.skills[0].id,first.skills.find(s=>s.path==='a/SKILL.md').id);assert.equal(next.skills[0].first_seen_at,repo.observed_at);
});

test('Unchanged blob hashes reuse valid metadata without reading the file again',async()=>{
 const previous={id:'71:cached/SKILL.md',repository_id:71,repository:repo.full_name,path:'cached/SKILL.md',blob_sha:'unchanged-blob',name:'cached-skill',description:'An already verified skill description',revision:'old-commit',source_url:'https://github.com/example/old/blob/old-commit/cached/SKILL.md',observed_at:'2026-10-01T00:00:00Z',first_seen_at:'2026-09-01T00:00:00Z',stale:true};
 const result=await discoverRepositorySkills({...repo,commit_sha:'new-commit'},{getTree:async()=>({tree:[blob('cached/SKILL.md','unchanged-blob')],truncated:false}),getText:async()=>{throw Error('Unchanged blobs must not be fetched')}},[previous]);
 assert.equal(result.complete,true);assert.deepEqual(result.errors,[]);assert.equal(result.skills.length,1);
 const current=result.skills[0];assert.equal(current.name,previous.name);assert.equal(current.description,previous.description);assert.equal(current.revision,'new-commit');assert.equal(current.observed_at,repo.observed_at);assert.equal(current.first_seen_at,previous.first_seen_at);assert.equal(current.stale,false);assert(current.source_url.includes('/blob/new-commit/'));
});

test('Missing hashes and invalid cached metadata still read and validate the current file',async()=>{
 let reads=0;
 const prior=[{path:'invalid/SKILL.md',blob_sha:'same',name:'Invalid Name',description:'Old invalid name'},{path:'missing/SKILL.md',blob_sha:null,name:'missing',description:'No hash available'}];
 const result=await discoverRepositorySkills(repo,{getTree:async()=>({tree:[blob('invalid/SKILL.md','same'),blob('missing/SKILL.md',null)],truncated:false}),getText:async(_repo,path)=>{reads++;return text(path.startsWith('invalid/')?'fixed-name':'missing')}},prior);
 assert.equal(result.complete,true);assert.equal(reads,2);assert.equal(result.skills.find(s=>s.path==='invalid/SKILL.md').name,'fixed-name');
});

test('Parses quoted multiline and block YAML descriptions, CRLF and BOM',async()=>{
 const files={
  'one/SKILL.md':'\uFEFF---\r\nname: one\r\ndescription: >-\r\n  Fold this line\r\n  into a sentence.\r\nmetadata:\r\n  author: example\r\n---\r\n',
  'two/SKILL.md':'---\nname: two\ndescription: "A quoted\n  multiline description."\n---\n',
  'three/SKILL.md':"---\nname: three\ndescription: |-\n  First paragraph.\n  Second line.\n---\n",
 };
 const result=await discoverRepositorySkills(repo,reader(Object.keys(files).map(p=>blob(p)),files));
 assert.equal(result.skills.length,3);assert.equal(result.skills.find(s=>s.name==='one').description,'Fold this line into a sentence.');assert.equal(result.skills.find(s=>s.name==='two').description,'A quoted multiline description.');assert.equal(result.skills.find(s=>s.name==='three').description,'First paragraph.\nSecond line.');
});

test('Invalid frontmatter is rejected without guessing from the filename; symlinks and submodules are not read',async()=>{
 const files={'missing/SKILL.md':'# Description only','no-description/SKILL.md':'---\nname: no-description\n---','wrong-type/SKILL.md':'---\nname: wrong-type\ndescription: [one, two]\n---','invalid-yaml/SKILL.md':'---\nname: [\ndescription: bad\n---','alias/SKILL.md':'---\nname: &name alias\ndescription: *name\n---','nested/SKILL.md':'---\nmetadata:\n  name: nested\n  description: not root metadata\n---'};
 const entries=[...Object.keys(files).map(p=>blob(p)),{...blob('linked/SKILL.md'),mode:'120000'},{path:'module/SKILL.md',type:'commit',mode:'160000',sha:'submodule'},{path:'readme.md',type:'blob',sha:'not-a-skill'}];
 let reads=0;const result=await discoverRepositorySkills(repo,{getTree:async()=>({tree:entries,truncated:false}),getText:async(_repo,path)=>{reads++;return files[path]}});
 assert.equal(result.skills.length,0);assert.equal(reads,Object.keys(files).length);assert.equal(result.complete,true);
});

test('Truncated recursive trees are recovered by non-recursive traversal and repeated tree contents retain both paths',async()=>{
 const calls=[];
 const source={getTree:async(_repo,ref,recursive)=>{calls.push([ref,recursive]);if(recursive)return {tree:[blob('partial/SKILL.md','p')],truncated:true};if(ref==='commit-123')return {tree:[{path:'a',type:'tree',sha:'shared'},{path:'b',type:'tree',sha:'shared'}],truncated:false};assert.equal(ref,'shared');return {tree:[blob('SKILL.md','same-blob')],truncated:false}},getText:async(_repo,path)=>text(path==='partial/SKILL.md'?'partial':'shared')};
 const result=await discoverRepositorySkills(repo,source);
 assert.equal(result.complete,true);assert.equal(result.skills.length,2);assert(result.skills.some(s=>s.path==='a/SKILL.md'));assert(result.skills.some(s=>s.path==='b/SKILL.md'));assert(calls.some(([ref,r])=>ref==='commit-123'&&r===false));
});

test('Tree request failure, unresolved truncation, and external budget errors preserve old records as stale',async()=>{
 const old={id:'71:old/SKILL.md',repository_id:71,repository:repo.full_name,path:'old/SKILL.md',name:'old',description:'Old observation',observed_at:'2026-10-01T00:00:00Z'};
 for(const getTree of [async()=>{throw Error('403 rate limit')},async(_repo,_ref,recursive)=>({tree:[],truncated:true}),async()=>{throw Error('API request budget exceeded')}]){
  const result=await discoverRepositorySkills(repo,{getTree,getText:async()=>{throw Error('Must not read')}},[old]);
  assert.equal(result.complete,false);assert(result.errors.length>0);assert.equal(result.skills[0].stale,true);assert.equal(result.skills[0].observed_at,old.observed_at);
 }
});

test('A partial file failure preserves the old failed record and still adds independently read new skills',async()=>{
 const old={id:'71:old/SKILL.md',path:'old/SKILL.md',name:'old',observed_at:'2026-10-01T00:00:00Z'};
 const result=await discoverRepositorySkills(repo,{getTree:async()=>({tree:[blob('old/SKILL.md'),blob('new/SKILL.md')],truncated:false}),getText:async(_repo,path)=>{if(path.startsWith('old/'))throw Error('budget exceeded');return text('new-skill')}},[old]);
 assert.equal(result.complete,false);assert.equal(result.skills.length,2);assert.equal(result.skills.find(s=>s.name==='old').stale,true);assert.equal(result.skills.find(s=>s.name==='new-skill').stale,false);
});

test('An empty complete scan removes old data, while size-budget failures do not',async()=>{
 const old={id:'71:a/SKILL.md',path:'a/SKILL.md',name:'old'};
 const empty=await discoverRepositorySkills(repo,reader([],{}),[old]);assert.equal(empty.complete,true);assert.deepEqual(empty.skills,[]);
 const oversized=await discoverRepositorySkills(repo,reader([blob('a/SKILL.md')],{'a/SKILL.md':'x'.repeat(1024*1024+1)}),[old]);assert.equal(oversized.complete,false);assert.equal(oversized.skills[0].stale,true);
});
