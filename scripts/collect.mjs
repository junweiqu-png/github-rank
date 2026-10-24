import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {editorial} from './editorial.mjs';
import {general} from './general-projects.mjs';
import {readmeEditorial} from './readme-editorial.mjs';
import {domainOf} from '../dist/catalog.js';
const root=new URL('../dist/data/',import.meta.url);
await mkdir(new URL('history/',root),{recursive:true});
const allEditorial={...editorial,...readmeEditorial,...Object.fromEntries(general.map(r=>[r.name.toLowerCase(),{summary:r.summary,input:r.input,output:r.output,domain:r.domain,source:'https://github.com/'+r.name,basis:'仓库公开介绍，输入输出为典型使用方式'}]))};
await writeFile(new URL('editorial.json',root),JSON.stringify(allEditorial,null,2));
if(process.argv.includes('--editorial-only'))process.exit(0);
const headers={'User-Agent':'GithubAtlas','Accept':'application/vnd.github+json',...(process.env.GITHUB_TOKEN?{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`}:{})};
let previous={repositories:[]};try{previous=JSON.parse(await readFile(new URL('latest.json',root),'utf8'))}catch{}
const errors=[];let fresh=0,rateLimited=false;
async function api(path){const res=await fetch('https://api.github.com/'+path,{headers,signal:AbortSignal.timeout(15000)});if(!res.ok){if(res.status===429||(res.status===403&&res.headers.get('x-ratelimit-remaining')==='0'))rateLimited=true;throw Error(`GitHub ${res.status}: ${path}`)}return res.json()}
const candidates=new Map(previous.repositories.map(r=>[r.full_name.toLowerCase(),{name:r.full_name,category:r.category,domain:r.domain,previous:r}]));
for(const r of general)candidates.set(r.name.toLowerCase(),{...candidates.get(r.name.toLowerCase()),name:r.name,category:'projects',domain:r.domain});
const day=new Date(Date.now()+28800000).toISOString().slice(0,10),today=new Date(day+'T00:00:00Z');
const quarter=day.slice(0,5)+String(Math.floor(today.getUTCMonth()/3)*3+1).padStart(2,'0')+'-01';
const week=new Date(+today-((today.getUTCDay()+6)%7)*86400000).toISOString().slice(0,10);
// No AI restriction. Bounded discovery samples; the UI reapplies exact Beijing boundaries.
for(const start of [null,day.slice(0,4)+'-01-01',quarter,day.slice(0,7)+'-01',week,day]){
 if(rateLimited)break;
 const since=start?new Date(Date.parse(start)-86400000).toISOString().slice(0,10):null;
 try{const q=`stars:>0 fork:false${since?' created:>='+since:''}`;const result=await api('search/repositories?q='+encodeURIComponent(q)+'&sort=stars&order=desc&per_page=15');
 for(const r of result.items){const key=r.full_name.toLowerCase(),old=candidates.get(key);candidates.set(key,{name:r.full_name,category:old?.category||'projects',domain:old?.domain,cached:r,previous:old?.previous})}
 }catch(e){errors.push(e.message)}
}
const byId=new Map();
for(const c of candidates.values()){
 try{
 let r=c.cached;const recent=c.previous&&Date.now()-Date.parse(c.previous.observed_at)<6*3600000;
 if(!r&&(rateLimited||recent)){if(c.previous)byId.set(c.previous.id,{...c.previous,domain:c.domain||domainOf(c.previous)});continue}
 r ||= await api('repos/'+c.name);if(r.fork||r.private)continue;
 const item={id:r.id,full_name:r.full_name,url:r.html_url,description:r.description||'',category:c.category,topics:r.topics||[],stars:r.stargazers_count,created_at:r.created_at,updated_at:r.pushed_at,archived:r.archived,observed_at:new Date().toISOString()};
 item.domain=c.domain||allEditorial[r.full_name.toLowerCase()]?.domain||domainOf(item);item.verification=allEditorial[r.full_name.toLowerCase()]?'中文已整理':'自动发现';byId.set(item.id,item);fresh++;
 }catch(e){errors.push(e.message);if(c.previous)byId.set(c.previous.id,c.previous)}
}
if(!fresh)throw Error('未采集到新数据，保留旧版本。'+errors.join('; '));
const data={updated_at:new Date().toISOString(),coverage:'涵盖各领域的 GitHub 公开项目；当前为已收录项目排名，非全量 GitHub 排名。',errors,repositories:[...byId.values()]};
await writeFile(new URL('latest.tmp',root),JSON.stringify(data,null,2));await rename(new URL('latest.tmp',root),new URL('latest.json',root));
try{await writeFile(new URL(`history/${day}.json`,root),JSON.stringify(data),{flag:'wx'})}catch(e){if(e.code!=='EEXIST')throw e}
let days=[];try{days=JSON.parse(await readFile(new URL('history/index.json',root),'utf8'))}catch{}if(!days.includes(day))days.push(day);await writeFile(new URL('history/index.json',root),JSON.stringify(days.sort().reverse()));
console.log(JSON.stringify({repositories:data.repositories.length,fresh,explained:data.repositories.filter(r=>allEditorial[r.full_name.toLowerCase()]).length,errors}));
