// One-time auditable backfill of verified public repositories, without a full Skill rescan.
// Normal scheduled discovery remains source-driven and resumable.
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {general} from './general-projects.mjs';
import {repositoryView,typesOf} from '../dist/catalog.js';
const dataRoot=new URL('../dist/data/',import.meta.url);
const names=[
 'jub0t/Concat','vercel-labs/agent-desktop','trycua/cua',
 'storytold/craft-anything','hmjz100/LinkSwift','sherlock-project/sherlock',
 'Usagi-org/ai-goofish-monitor','Ebony-Vinyl/dsh-our-free-model',
 'hgtuj5688/tvbox-desktop','yetone/magpie','Blinue/Magpie',
 'HKUDS/DeepTutor','sansan0/TrendRadar'
];
const sourceByName=new Map(general.map(r=>[r.name.toLowerCase(),r]));
const prior=JSON.parse(await readFile(new URL('latest.json',dataRoot),'utf8'));
const editorial=JSON.parse(await readFile(new URL('editorial.json',dataRoot),'utf8'));
const byId=new Map(prior.repositories.map(r=>[String(r.id),r]));
const verified=[];
for(const name of names){
 const response=await fetch('https://api.github.com/repos/'+name,{headers:{'User-Agent':'GithubRank-verified-audit','Accept':'application/vnd.github+json'},signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Cannot verify '+name+': HTTP '+response.status);
 const r=await response.json();
 if(r.private||r.fork||!r.id||!r.full_name)throw Error('Invalid verified target: '+name);
 const old=byId.get(String(r.id))||{},record=sourceByName.get(name.toLowerCase());
 if(!record)throw Error('Missing approved seed: '+name);
 const item={...old,id:r.id,full_name:r.full_name,url:r.html_url,description:r.description||'',category:old.category||'projects',topics:r.topics||[],
 stars:r.stargazers_count,created_at:r.created_at,updated_at:r.pushed_at||r.updated_at,default_branch:r.default_branch,
 archived:!!r.archived,observed_at:new Date().toISOString(),skill_candidate:old.skill_candidate||false,
 domain:record.domain,verification:'中文已整理'};
 item.types=typesOf(repositoryView(item));item.skill_count=old.skill_count||0;
 byId.set(String(item.id),item);
 editorial[item.full_name.toLowerCase()]={summary:record.summary,input:record.input,output:record.output,domain:record.domain,source:r.html_url,basis:'仓库公开介绍，输入输出为典型使用方式'};
 verified.push({name:item.full_name,stars:item.stars,id:item.id});
 console.log(JSON.stringify({verified:item.full_name,stars:item.stars}));
}
prior.repositories=[...byId.values()];
prior.updated_at=new Date().toISOString();
prior.coverage='本数据版本新增已核实仓库；其他旧记录保留原观测时间。普通项目与Skills自动发现将继续分页扫描，非全站索引。';
prior.manual_audit={verified_at:prior.updated_at,source:'GitHub REST repository API',verified_repositories:verified.map(r=>r.name),unresolved:['babelfast']};
const writeJson=async(name,value)=>{await writeFile(new URL(name+'.tmp',dataRoot),JSON.stringify(value));await rename(new URL(name+'.tmp',dataRoot),new URL(name,dataRoot))};
await writeJson('latest.json',prior);
await writeJson('editorial.json',editorial);
const day=new Date(Date.now()+28800000).toISOString().slice(0,10);
await mkdir(new URL('history/',dataRoot),{recursive:true});
try{await writeFile(new URL('history/'+day+'.json',dataRoot),JSON.stringify(prior),{flag:'wx'})}catch(e){if(e.code!=='EEXIST')throw e}
const days=JSON.parse(await readFile(new URL('history/index.json',dataRoot),'utf8'));
if(!days.includes(day))days.push(day);
await writeJson('history/index.json',days.sort().reverse());
if(verified.length!==names.length)throw Error('Insufficient verified projects');
console.log(JSON.stringify({phase:'bootstrapped',verified:verified.length,repositories:prior.repositories.length,updated_at:prior.updated_at}));
