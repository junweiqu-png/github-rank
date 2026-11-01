import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {discoverRepositorySkills} from './lib/skill-discovery.mjs';
const root=new URL('../dist/data/',import.meta.url);
export function isSkillCandidate(r,previous=[]){return r.skill_candidate===true||r.category==='skills'||previous.some(s=>String(s.repository_id)===String(r.id))||/(^|[-_/])skills?($|[-_/])/i.test(r.full_name)||/SKILL\.md|\bagent skills?\b/i.test(r.description||'')||(r.topics||[]).some(t=>/^(agent-skills?|claude-skills|skills|claude-code-skills)$/.test(t))}

export async function collectSkills({api,repositories,limit=Infinity,maxFileReads=30000,perRepositoryFileReads=256,passes=1,rawText,heads=new Map(),priorityRepositoryIds=[],discoveryComplete=false,dataRoot=root}){
 const root=dataRoot;
 let previous={skills:[],repositories:[]};try{previous=JSON.parse(await readFile(new URL('skills.json',root),'utf8'))}catch{}
 const copy=JSON.parse(await readFile(new URL('skill-copy.json',import.meta.url),'utf8'));
 const scans=new Map(previous.repositories.map(r=>[String(r.id),r]));
 const priority=new Set(priorityRepositoryIds.map(String));
 const candidates=repositories.filter(r=>isSkillCandidate(r,previous.skills));
 candidates.sort((a,b)=>Number(priority.has(String(b.id)))-Number(priority.has(String(a.id)))||Number(scans.get(String(a.id))?.complete===true)-Number(scans.get(String(b.id))?.complete===true)||(Date.parse(scans.get(String(a.id))?.checked_at)||0)-(Date.parse(scans.get(String(b.id))?.checked_at)||0)||b.stars-a.stars);
 const selected=candidates.slice(0,limit),skills=new Map(previous.skills.map(s=>[s.id,{...s,stale:true}]));
 const errorsById=new Map(),attempted=new Set(),completed=new Set(),deferredById=new Map();let reads=0,quotaStopped=false,processed=0;
 function dataset(){
  const relevant=candidates.map(r=>scans.get(String(r.id))).filter(Boolean),done=relevant.filter(r=>r.complete).length;
  return {updated_at:new Date().toISOString(),source:'GitHub SKILL.md frontmatter',grain:'skill',skills:[...skills.values()],repositories:[...scans.values()],coverage:{candidate_repositories:candidates.length,scanned_repositories:relevant.length,complete_repositories:done,pending_repositories:candidates.length-done,failed_repositories:relevant.filter(r=>r.failed).length,tree_indexed_repositories:relevant.filter(r=>r.inventory_complete||r.complete).length,pending_files:relevant.reduce((n,r)=>n+(r.metadata_pending||0),0),attempted_this_run:attempted.size,complete_this_run:completed.size,file_reads_this_run:reads,discovery_complete:discoveryComplete,complete:discoveryComplete&&done===candidates.length},metrics:{installs:{source:'skills.sh',status:'not_connected',definition:'平台安装统计，不是 GitHub 通用安装次数'}},errors:[...errorsById.values()].flat().slice(0,200)};
 }
 async function persist(){const data=dataset();await mkdir(root,{recursive:true});await writeFile(new URL('skills.tmp',root),JSON.stringify(data,null,2));await rename(new URL('skills.tmp',root),new URL('skills.json',root));return data}
 for(let pass=0;pass<passes;pass++){
  let work=0;
  for(const original of selected){
   if(reads>=maxFileReads)break;
   const id=String(original.id),priorScan=scans.get(id);
   if(quotaStopped&&!(priorScan?.inventory_complete&&priorScan.commit_sha===heads.get(id)?.commit_sha))continue;
   if(pass>0&&(priorScan?.complete||(priorScan?.failed&&!priorScan.inventory_complete)))continue;
   attempted.add(id);work++;
   const old=[...skills.values()].filter(s=>String(s.repository_id)===id);
   try{
    let head=heads.get(id),repo;
    if(head){if(String(head.id)!==id)throw Error('仓库身份已变化，等待仓库元数据刷新');repo={...original,...head}}
    else{
     const info=await api('repos/'+original.full_name);if(info.private||info.fork)throw Error('跳过非公开原始仓库');if(String(info.id)!==id)throw Error('仓库身份已变化，等待仓库元数据刷新');
     head=await api('repos/'+info.full_name+'/commits/'+encodeURIComponent(info.default_branch));
     repo={...original,id:info.id,full_name:info.full_name,default_branch:info.default_branch,commit_sha:head.sha,observed_at:new Date().toISOString()};heads.set(id,repo);
    }
    if(!deferredById.has(id))deferredById.set(id,new Set());const deferredPaths=deferredById.get(id);
    const result=await discoverRepositorySkills(repo,{
     deferredPaths,
     maxFileReads:Math.min(perRepositoryFileReads,maxFileReads-reads),
     getTree:async(r,ref,recursive)=>{try{return await api('repos/'+r.full_name+'/git/trees/'+encodeURIComponent(ref)+(recursive?'?recursive=1':''))}catch(e){if(e.code==='RATE_LIMIT')quotaStopped=true;throw e}},
     getText:async(r,path,ref)=>{try{if(rawText)return await rawText(r,path,ref);const file=await api('repos/'+r.full_name+'/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref));if(file.type!=='file'||file.encoding!=='base64')throw Error('不是支持的普通文本文件');return Buffer.from(file.content,'base64').toString('utf8')}catch(e){deferredPaths.add(path);throw e}}
    },old,priorScan);
    reads+=result.file_reads;
    if(result.complete)for(const s of old)skills.delete(s.id);
    for(const s of result.skills){const translated=copy[s.repository.toLowerCase()+':'+s.name];skills.set(s.id,{...s,summary:translated?.summary||s.description,input:translated?.input||'具体输入和前置条件见技能文档',output:translated?.output||'具体交付内容见技能文档',translation_status:translated?'curated':'original',official_install_url:translated?.official_install_url||null,metrics:{installs:{source:'skills.sh',value:null,status:'not_connected',observed_at:null}}})}
    const failure=result.errors.some(e=>!e.startsWith('Metadata file budget reached;'));
    errorsById.set(id,result.errors.map(e=>repo.full_name+': '+e));if(result.complete)completed.add(id);
    scans.set(id,{id:repo.id,repository:repo.full_name,checked_at:new Date().toISOString(),complete:result.complete,failed:failure,skill_count:result.skills.length,commit_sha:repo.commit_sha,inventory_complete:result.inventory_complete,inventory:result.inventory,pending_trees:result.pending_trees,file_states:result.file_states,metadata_pending:result.metadata_pending});
   }catch(e){
    if(e.code==='RATE_LIMIT'){quotaStopped=true;continue}
    errorsById.set(id,[original.full_name+': '+e.message]);for(const s of old)skills.set(s.id,{...s,stale:true});scans.set(id,{...priorScan,id:original.id,repository:original.full_name,checked_at:new Date().toISOString(),complete:false,failed:true,skill_count:old.length});
   }
   processed++;if(processed%25===0){await persist();console.log(JSON.stringify({phase:'skill-scan',pass:pass+1,attempted:attempted.size,completed:completed.size,candidates:candidates.length,file_reads:reads}))}
  }
  if(!work||reads>=maxFileReads)break;
 }
 const data=await persist();console.log(JSON.stringify({phase:'skill-scan-finished',skills:data.skills.length,...data.coverage}));return data;
}
