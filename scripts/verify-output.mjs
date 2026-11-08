import {readdirSync,statSync,readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/data/',import.meta.url));
const latest=JSON.parse(readFileSync(join(root,'latest.json'),'utf8'));
const skills=JSON.parse(readFileSync(join(root,'skills.json'),'utf8'));
const checkpoint=JSON.parse(gunzipSync(readFileSync(join(root,'scan-checkpoint.json.gz'))));
// Publication checks invariants, not a hand-picked list of repository names.
if(!Array.isArray(latest.repositories)||!latest.repositories.length)throw Error('Missing public repository catalog');
if(!Array.isArray(skills.skills)||!Array.isArray(skills.repositories))throw Error('Invalid public Skill catalog');
const ids=new Set(),names=new Set();
for(const r of latest.repositories){
 if(!Number.isInteger(r.id)||r.id<=0||typeof r.full_name!=='string'||!/^[-\w.]+\/[-\w.]+$/.test(r.full_name)||!Number.isFinite(r.stars)||r.stars<0)
  throw Error('Malformed repository record');
 if(ids.has(String(r.id)))throw Error('Duplicate repository ID: '+r.id);
 ids.add(String(r.id));
 const name=r.full_name.toLowerCase();if(names.has(name))throw Error('Duplicate repository name: '+name);
 names.add(name);
}
for(const s of skills.skills)if(!ids.has(String(s.repository_id)))throw Error('Orphaned Skill: '+s.id);
const audited=latest.manual_audit?.verified_repositories||[];
const missingAudited=audited.filter(n=>!names.has(n.toLowerCase()));
if(skills.repositories.some(r=>r.inventory||r.file_states||r.pending_trees))throw Error('Public skills catalog leaks unbounded checkpoint state');
if(!Array.isArray(checkpoint.repositories))throw Error('Missing compressed scan checkpoints');
const max=90*1024*1024;
let largest={name:'',size:0};
function visit(dir){for(const item of readdirSync(dir,{withFileTypes:true})){
 const name=join(dir,item.name);
 if(item.isDirectory()){visit(name);continue}
 if(!item.isFile())continue;
 const size=statSync(name).size;
 if(size>largest.size)largest={name,size};
 if(size>max)throw Error('Git blob exceeds safe limit: '+name+' '+size);
}}
visit(root);
console.log(JSON.stringify({manual_audit_records:audited.length,manual_audit_missing:missingAudited,projects:latest.repositories.length,skills:skills.skills.length,scanCheckpoints:checkpoint.repositories.length,largestFileBytes:largest.size,largestFile:largest.name}));
