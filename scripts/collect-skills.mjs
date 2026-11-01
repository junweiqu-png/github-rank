import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {discoverRepositorySkills} from './lib/skill-discovery.mjs';
const root=new URL('../dist/data/',import.meta.url);
export function isSkillCandidate(r,previous=[]){return r.category==='skills'||previous.some(s=>String(s.repository_id)===String(r.id))||/(^|[-_/])skills?($|[-_/])/i.test(r.full_name)||/SKILL\.md|\bagent skills?\b/i.test(r.description||'')||(r.topics||[]).some(t=>/^(agent-skills?|claude-skills|skills|claude-code-skills)$/.test(t))}
export async function collectSkills({api,repositories,limit=80,maxFileReads=700,dataRoot=root}){
 const root=dataRoot;
 let previous={skills:[],repositories:[]};try{previous=JSON.parse(await readFile(new URL('skills.json',root),'utf8'))}catch{}
 const copy=JSON.parse(await readFile(new URL('skill-copy.json',import.meta.url),'utf8'));
 const sources=JSON.parse(await readFile(new URL('skill-sources.json',import.meta.url),'utf8'));
 const priority=new Set(sources.repositories.map(s=>s.toLowerCase()));
 const scans=new Map(previous.repositories.map(r=>[String(r.id),r]));
 const candidates=repositories.filter(r=>isSkillCandidate(r,previous.skills));
 // Oldest/unscanned first. The limit is a per-run API budget, never an allowlist.
 const needsBootstrap=r=>priority.has(r.full_name.toLowerCase())&&scans.get(String(r.id))?.complete!==true;
 candidates.sort((a,b)=>Number(needsBootstrap(b))-Number(needsBootstrap(a))||(Date.parse(scans.get(String(a.id))?.checked_at)||0)-(Date.parse(scans.get(String(b.id))?.checked_at)||0)||b.stars-a.stars);
 const selected=candidates.slice(0,limit);
 const skills=new Map(previous.skills.map(s=>[s.id,{...s,stale:true}]));
 const errors=[];let reads=0,completed=0,attempted=0;
 for(const original of selected){
  if(reads>=maxFileReads)break;
  attempted++;
  const old=previous.skills.filter(s=>String(s.repository_id)===String(original.id));
  try{
   const info=await api('repos/'+original.full_name);if(info.private||info.fork)throw Error('跳过非公开原始仓库');if(String(info.id)!==String(original.id))throw Error('仓库身份已变化，等待仓库元数据刷新');const branch=info.default_branch;
   const head=await api('repos/'+original.full_name+'/commits/'+encodeURIComponent(branch));
   const repo={...original,id:info.id,full_name:info.full_name,default_branch:branch,commit_sha:head.sha,observed_at:new Date().toISOString()};
   const result=await discoverRepositorySkills(repo,{
    getTree:async(r,ref,recursive)=>api('repos/'+r.full_name+'/git/trees/'+encodeURIComponent(ref)+(recursive?'?recursive=1':'')),
    getText:async(r,path,ref)=>{if(++reads>maxFileReads)throw Error('本次技能文件读取预算已用完，后续条目下次继续');const file=await api('repos/'+r.full_name+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref));if(file.type!=='file'||file.encoding!=='base64')throw Error('不是支持的普通文本文件');return Buffer.from(file.content,'base64').toString('utf8')}
   },old);
   if(result.complete)for(const s of old)skills.delete(s.id);
   for(const s of result.skills){const translated=copy[s.repository.toLowerCase()+':'+s.name];skills.set(s.id,{...s,summary:translated?.summary||s.description,input:translated?.input||'具体输入和前置条件见技能文档',output:translated?.output||'具体交付内容见技能文档',translation_status:translated?'curated':'original',official_install_url:translated?.official_install_url||null,metrics:{installs:{source:'skills.sh',value:null,status:'not_connected',observed_at:null}}})}
   errors.push(...result.errors.map(e=>original.full_name+': '+(typeof e==='string'?e:JSON.stringify(e))));
   if(result.complete)completed++;
   scans.set(String(original.id),{id:original.id,repository:original.full_name,checked_at:new Date().toISOString(),complete:result.complete,skill_count:result.skills.length,commit_sha:head.sha});
  }catch(e){errors.push(original.full_name+': '+e.message);for(const s of old)skills.set(s.id,{...s,stale:true});scans.set(String(original.id),{id:original.id,repository:original.full_name,checked_at:new Date().toISOString(),complete:false,skill_count:old.length})}
 }
 const data={updated_at:new Date().toISOString(),source:'GitHub SKILL.md frontmatter',grain:'skill',skills:[...skills.values()],repositories:[...scans.values()],coverage:{candidate_repositories:candidates.length,attempted_this_run:attempted,complete_this_run:completed,pending_this_run:candidates.length-completed,complete:false},metrics:{installs:{source:'skills.sh',status:'not_connected',definition:'平台安装统计，不是 GitHub 通用安装次数'}},errors};
 await mkdir(root,{recursive:true});await writeFile(new URL('skills.tmp',root),JSON.stringify(data,null,2));await rename(new URL('skills.tmp',root),new URL('skills.json',root));
 console.log(JSON.stringify({skills:data.skills.length,scanned:attempted,complete:completed,candidates:candidates.length,errors:errors.length}));return data;
}
