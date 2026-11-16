import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {FAST_SCHEMA_VERSION,FAST_SHARDS,packProject,packSkill,newestFirst,shardOf} from '../dist/fast-format.js';

const root=new URL('../dist/data/',import.meta.url);
const out=new URL('fast/',root);
async function readJson(rel){
 try{return JSON.parse(await readFile(new URL(rel,root),'utf8'))}
 catch(error){
  if(error.code!=='ENOENT')throw error;
  return JSON.parse(gunzipSync(await readFile(new URL(rel+'.gz',root))).toString('utf8'));
 }
}
async function write(rel,data){
 const path=new URL(rel,out);
 await mkdir(new URL('./',path),{recursive:true});
 await writeFile(path,JSON.stringify(data));
}
function safeDate(value){return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)}

const latest=await readJson('latest.json');
const skills=await readJson('skills.json');
if(!Array.isArray(latest.repositories)||!Array.isArray(skills.skills))throw Error('Missing source catalogs');
const rows=latest.repositories.map(r=>packProject(r,false)).sort(newestFirst);
const ids=new Set(rows.map(r=>r[0]));
if(ids.size!==rows.length)throw Error('Duplicated project IDs in fast catalog source');
if(rows.some(r=>!Number.isInteger(r[0])||!r[1]||!Number.isFinite(r[2])))throw Error('Invalid fast project row');
const skillBuckets=Array.from({length:FAST_SHARDS},()=>[]);
const skillSearch=new Map();
for(const skill of skills.skills){
 if(!ids.has(skill.repository_id))throw Error('Orphaned Skill in fast catalog: '+skill.repository_id);
 skillBuckets[Number(shardOf(skill.repository_id))].push(packSkill(skill));
 const old=skillSearch.get(skill.repository_id)||'';
 skillSearch.set(skill.repository_id,old+' '+(skill.name||'')+' '+(skill.summary||skill.description||''));
}
const dates=(await readJson('history/index.json')).filter(safeDate).slice(0,30);

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
await write('boot.json',{
 version:FAST_SCHEMA_VERSION,updated_at:latest.updated_at,total:rows.length,
 preview:rows.slice(0,90),dates,
 has_errors:!!latest.errors?.length,
 skill_total:skills.skills.length,skill_coverage:skills.coverage||{}
});
await write('index.json',{
 version:FAST_SCHEMA_VERSION,updated_at:latest.updated_at,total:rows.length,rows
});
await write('search.json',{
 version:FAST_SCHEMA_VERSION,updated_at:latest.updated_at,
 rows:latest.repositories.map(r=>[r.id,r.description||'',(r.topics||[]).join(' ')])
});
await write('skill-search.json',{
 version:FAST_SCHEMA_VERSION,updated_at:latest.updated_at,
 rows:[...skillSearch].map(([id,value])=>[id,value])
});
for(let i=0;i<FAST_SHARDS;i++){
 await write('skills/'+String(i).padStart(2,'0')+'.json',skillBuckets[i]);
}

// Historical snapshots are compacted independently, preserving every repository
// and the Star values from the actual dated snapshot (never fabricated).
const trendBuckets=Array.from({length:FAST_SHARDS},()=>new Map());
for(const day of dates){
 const snapshot=await readJson('history/'+day+'.json');
 const snapshots=snapshot.repositories.map(packProject).sort(newestFirst);
 await write('history/'+day+'.json',{
  version:FAST_SCHEMA_VERSION,updated_at:snapshot.updated_at,
  has_errors:!!snapshot.errors?.length,total:snapshots.length,rows:snapshots
 });
 for(const r of snapshot.repositories){
  const b=trendBuckets[Number(shardOf(r.id))],id=String(r.id),points=b.get(id)||[];
  points.push([day,r.stars]);b.set(id,points);
 }
}
for(let i=0;i<FAST_SHARDS;i++){
 await write('trend/'+String(i).padStart(2,'0')+'.json',
  Object.fromEntries(trendBuckets[i]));
}
const stats={version:FAST_SCHEMA_VERSION,updated_at:latest.updated_at,
 projects:rows.length,skills:skills.skills.length,skill_shards:FAST_SHARDS,
 history_snapshots:dates.length};
await write('stats.json',stats);
console.log(JSON.stringify({phase:'fast-client-data',...stats,preview:90,
 skill_bucket_records:skillBuckets.reduce((n,a)=>n+a.length,0)}));
