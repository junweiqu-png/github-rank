import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {editorial} from './editorial.mjs';
import {general} from './general-projects.mjs';
import {readmeEditorial} from './readme-editorial.mjs';
import {domainOf,repositoryView,typesOf} from '../dist/catalog.js';
import {collectSkills,isSkillCandidate} from './collect-skills.mjs';
import {discoverRepositories} from './lib/repository-discovery.mjs';
import {createGithubClient} from './lib/github-client.mjs';
const root=new URL('../dist/data/',import.meta.url);
await mkdir(new URL('history/',root),{recursive:true});
const readJson=async(name,fallback)=>{try{return JSON.parse(await readFile(new URL(name,root),'utf8'))}catch{return fallback}};
const writeJson=async(name,data)=>{await writeFile(new URL(name+'.tmp',root),JSON.stringify(data,null,2));await rename(new URL(name+'.tmp',root),new URL(name,root))};
const allEditorial={...editorial,...readmeEditorial,...Object.fromEntries(general.map(r=>[r.name.toLowerCase(),{summary:r.summary,input:r.input,output:r.output,domain:r.domain,source:'https://github.com/'+r.name,basis:'仓库公开介绍，输入输出为典型使用方式'}]))};
allEditorial['vercel-labs/agent-browser']={summary:'供 AI Agent 浏览和操作网页的命令行工具与技能',input:'网页地址和浏览器操作指令',output:'网页信息、截图及操作结果',domain:'ai',source:'https://github.com/vercel-labs/agent-browser',basis:'仓库公开文档，输入输出为典型使用方式'};
await writeJson('editorial.json',allEditorial);
if(process.argv.includes('--editorial-only'))process.exit(0);
const client=createGithubClient({token:process.env.GITHUB_TOKEN}),{api,rawText}=client;
const previous=await readJson('latest.json',{repositories:[]}),previousSkills=await readJson('skills.json',{skills:[],repositories:[]}),errors=[];
const byId=new Map(previous.repositories.map(r=>[String(r.id),r]));
const named=new Map(previous.repositories.map(r=>[r.full_name.toLowerCase(),r]));
function merge(r,skillCandidate=false){
 if(!r||r.id==null||r.private||r.fork)return;
 const old=byId.get(String(r.id));
 const item={...old,id:r.id,full_name:r.full_name,url:r.html_url||r.url||'https://github.com/'+r.full_name,description:r.description||'',category:old?.category||'projects',topics:r.topics||old?.topics||[],stars:r.stargazers_count??r.stars??old?.stars??0,created_at:r.created_at,updated_at:r.pushed_at??r.updated_at,default_branch:r.default_branch||old?.default_branch,archived:r.archived??old?.archived??false,observed_at:new Date().toISOString(),skill_candidate:skillCandidate||old?.skill_candidate||false};
 item.domain=allEditorial[item.full_name.toLowerCase()]?.domain||old?.domain||domainOf(item);item.verification=allEditorial[item.full_name.toLowerCase()]?'中文已整理':'自动发现';byId.set(String(item.id),item);named.set(item.full_name.toLowerCase(),item);
}
const day=new Date(Date.now()+28800000).toISOString().slice(0,10),today=new Date(day+'T00:00:00Z');
const quarter=day.slice(0,5)+String(Math.floor(today.getUTCMonth()/3)*3+1).padStart(2,'0')+'-01';
const week=new Date(+today-((today.getUTCDay()+6)%7)*86400000).toISOString().slice(0,10);
for(const start of [null,day.slice(0,4)+'-01-01',quarter,day.slice(0,7)+'-01',week,day]){
 const since=start?new Date(Date.parse(start)-86400000).toISOString().slice(0,10):null;
 try{const result=await api('search/repositories?q='+encodeURIComponent('stars:>0 fork:false'+(since?' created:>='+since:''))+'&sort=stars&order=desc&per_page=100');for(const r of result.items)merge(r)}catch(e){errors.push('项目发现：'+e.message)}
}
const sources=JSON.parse(await readFile(new URL('skill-sources.json',import.meta.url),'utf8'));
const discovery=await discoverRepositories({api,queries:sources.queries,previousState:await readJson('discovery-state.json',null),maxRequests:Number(process.env.DISCOVERY_REQUESTS)||100});
for(const r of discovery.repositories)merge(r,true);
await writeJson('discovery-state.json',discovery.state);errors.push(...discovery.errors);
// Seed configuration bootstraps the crawler; it never defines individual Skills.
for(const name of new Set([...sources.repositories,...general.map(r=>r.name)])){
 const known=named.get(name.toLowerCase());if(known){if(sources.repositories.includes(name))known.skill_candidate=true;continue}
 try{merge(await api('repos/'+name),sources.repositories.includes(name))}catch(e){errors.push(name+': '+e.message)}
}
console.log(JSON.stringify({phase:'discovery',repositories:byId.size,...discovery.coverage}));
const repositories=[...byId.values()],heads=await client.resolveHeads(repositories);
for(const r of repositories){const current=heads.get(String(r.id));if(current)Object.assign(r,current)}
const priorityRepositoryIds=previous.repositories.filter(r=>isSkillCandidate(r,previousSkills.skills)).map(r=>r.id);
const skills=await collectSkills({api,rawText,heads,repositories,priorityRepositoryIds,passes:12,maxFileReads:50000,perRepositoryFileReads:256,discoveryComplete:discovery.coverage.complete});
const groups=new Map();for(const skill of skills.skills){const id=String(skill.repository_id);if(!groups.has(id))groups.set(id,[]);groups.get(id).push(skill)}
const scans=new Map(skills.repositories.map(s=>[String(s.id),s]));
for(const r of repositories){const scan=scans.get(String(r.id)),view=repositoryView(r,{skills:groups.get(String(r.id))||[],scans:scan?[scan]:[]});r.types=typesOf(view);r.skill_count=view.skill_count;r.skill_verification=view.skill_verification}
const data={updated_at:new Date().toISOString(),coverage:'全领域创建周期搜索，Skills 多路检索、自动分页与时间分片；只对已收录仓库排名，非全量 GitHub。',metric:{name:'GitHub repository stars',grain:'repository',notComparableWith:'skills.sh skill installs'},discovery:{resultsPerQuery:100,periodQueries:6,complete:false,skills:discovery.coverage},errors,repositories};
await writeJson('latest.json',data);
try{await writeFile(new URL(`history/${day}.json`,root),JSON.stringify(data),{flag:'wx'})}catch(e){if(e.code!=='EEXIST')throw e}
let days=await readJson('history/index.json',[]);if(!days.includes(day))days.push(day);await writeJson('history/index.json',days.sort().reverse());
await writeJson('collection-status.json',{updated_at:data.updated_at,discovery:discovery.coverage,skills:skills.coverage,requests:client.stats});
console.log(JSON.stringify({phase:'finished',repositories:repositories.length,verifiedSkillRepositories:repositories.filter(r=>r.types.includes('skills')).length,skills:skills.skills.length,coverage:skills.coverage,requests:client.stats.requests}));
