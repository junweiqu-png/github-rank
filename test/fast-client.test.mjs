import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {FAST_SCHEMA_VERSION,FAST_SHARDS,packProject,unpackProject,packSkill,unpackSkill,shardOf,newestFirst} from '../dist/fast-format.js';
import {rank} from '../dist/ranking.js';

const root=new URL('../dist/data/',import.meta.url);
function data(rel){return JSON.parse(readFileSync(new URL(rel,root),'utf8'))}

test('Compact schema preserves exact identity, Star, date and type filtering',()=>{
 const raw={id:12345,full_name:'sample/agent',stars:25000,created_at:'2026-10-31T20:05:45Z',
  domain:'ai',types:['projects','skills'],skill_count:3,skill_verification:'verified',
  archived:false,updated_at:'2026-11-11T02:00:00Z',observed_at:'2026-11-13T12:00:00Z',
  category:'projects',description:'Tool for testing',topics:['ai','desktop']};
 const restored=unpackProject(packProject(raw));
 for(const key of ['id','full_name','stars','created_at','domain','category','skill_count','skill_verification','description'])
  assert.deepEqual(restored[key],raw[key]);
 assert.deepEqual(restored.types,raw.types);assert.deepEqual(restored.topics,raw.topics);
 assert.deepEqual(rank([restored],{period:'all',date:'2026-11-16',category:'skills',preSorted:true}).map(x=>x.id),[12345]);
 assert.deepEqual(rank([restored],{period:'all',date:'2026-11-16',q:'desktop',preSorted:true}).map(x=>x.id),[12345]);
 const fields={repository_id:12345,name:'valid-skill',description:'Sample skill',summary:'中文用途',
  input:'用户输入',output:'结果',path:'skills/valid/SKILL.md',source_url:'https://github.com/sample/agent/blob/main/skills/valid/SKILL.md',
  translation_status:'curated',official_install_url:null,stale:true,metrics:{installs:{value:null}}};
 const unpacked=unpackSkill(packSkill(fields));
 assert.equal(unpacked.name,fields.name);assert.equal(unpacked.stale,true);assert.equal(unpacked.summary,fields.summary);
 assert.equal(unpacked.metrics.installs.value,null);
 assert.equal(shardOf(12345),String(12345%FAST_SHARDS).padStart(2,'0'));
});

test('Generated fast indexes contain every source project and Skill, no manual allowlist',()=>{
 const source=data('latest.json'),sourceSkills=data('skills.json');
 const boot=data('fast/boot.json'),index=data('fast/index.json'),stats=data('fast/stats.json');
 assert.equal(boot.version,FAST_SCHEMA_VERSION);
 assert.equal(index.version,FAST_SCHEMA_VERSION);
 assert.equal(boot.updated_at,index.updated_at);
 assert.equal(index.updated_at,source.updated_at);
 assert.equal(boot.total,source.repositories.length);
 assert.equal(index.rows.length,source.repositories.length);
 assert.equal(boot.skill_total,sourceSkills.skills.length);
 assert.equal(stats.projects,source.repositories.length);
 assert.equal(stats.skills,sourceSkills.skills.length);
 assert.ok(boot.preview.length>29);
 assert.ok(statSync(new URL('fast/boot.json',root)).size<250000,'First paint boot payload must be small');
 const byId=new Map(source.repositories.map(r=>[r.id,r]));
 const seen=new Set();
 for(const row of index.rows){
  const restored=unpackProject(row),original=byId.get(restored.id);
  assert.ok(original,'Unexpected repository id');
  assert.equal(restored.full_name,original.full_name);
  assert.equal(restored.stars,original.stars);
  assert.equal(restored.created_at,original.created_at);
  assert.deepEqual(restored.types,original.types);
  assert.equal(restored.skill_count,original.skill_count);
  assert.equal(restored.description,original.description||'');
  assert.ok(!seen.has(restored.id));seen.add(restored.id);
 }
 assert.equal(seen.size,source.repositories.length);
 assert.deepEqual(boot.preview,index.rows.slice(0,boot.preview.length));
 for(let i=1;i<index.rows.length;i++)assert.ok(newestFirst(index.rows[i-1],index.rows[i])<=0);
 let skillCount=0;
 for(let bucket=0;bucket<FAST_SHARDS;bucket++){
  const shard=data('fast/skills/'+String(bucket).padStart(2,'0')+'.json');
  for(const item of shard){
   assert.equal(Number(shardOf(item[0])),bucket);
   assert.ok(byId.has(item[0]));
   skillCount++;
  }
 }
 assert.equal(skillCount,sourceSkills.skills.length);
});

test('Client avoids monolithic source downloads and per-repository full history requests',()=>{
 const app=readFileSync(fileURLToPath(new URL('../dist/fast-app.js',import.meta.url)),'utf8');
 assert.ok(app.includes('data/fast/boot.json'));
 assert.ok(app.includes('fastUrl('));
 assert.equal(app.includes("json('data/latest.json')"),false);
 assert.equal(app.includes("json('data/skills.json')"),false);
 assert.equal(app.includes('data/history/'+'$'+'{'),false);
 const html=readFileSync(fileURLToPath(new URL('../dist/index.html',import.meta.url)),'utf8');
 assert.ok(html.includes('fast-app.js?v=20261116-fast'));
});
