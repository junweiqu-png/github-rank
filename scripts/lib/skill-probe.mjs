import {discoverRepositorySkills,SKILL_DISCOVERY_RULES_VERSION} from './skill-discovery.mjs';

// Probe a bounded sample of ordinary repositories, including those whose names,
// descriptions and Topics never mention Skills. This is not a fixed allowlist.
export async function probeUnlabelledSkillRepositories({
 api,repositories,heads=new Map(),previousState=null,maxRepositories=512,maxConcurrent=8,
 now=new Date(),isCandidate=()=>false,maxTreeRequests=8,
}={}){
 if(typeof api!=='function'||!Array.isArray(repositories))throw TypeError('Repositories and GitHub API are required');
 const entries=new Map(([1,2].includes(previousState?.version)&&Array.isArray(previousState.entries)?previousState.entries:[])
  .filter(e=>e&&e.id!=null).map(e=>[String(e.id),e]));
 const date=new Date(now),ts=+date;
 if(!Number.isFinite(ts))throw TypeError('Invalid probe time');
 const unseen=[],retry=[],errors=[];let cached=0,positive=0,withoutRevision=0;
 for(const repo of repositories){
  if(!repo||repo.id==null||isCandidate(repo))continue;
  const id=String(repo.id),sha=heads.get(id)?.commit_sha||repo.commit_sha;
  if(!sha){withoutRevision++;continue}
  const old=entries.get(id);
  if(old?.sha===sha&&old.discovery_rules_version===SKILL_DISCOVERY_RULES_VERSION&&old.status==='complete'){
   cached++;if(old.has_skill_file){repo.skill_candidate=true;positive++}
   continue;
  }
  if(old?.sha===sha&&old.discovery_rules_version===SKILL_DISCOVERY_RULES_VERSION&&old.status==='incomplete'&&ts-Date.parse(old.checked_at)<20*3600*1000){retry.push({repo,sha});continue}
  unseen.push({repo,sha,previous:old});
 }
 // Retry old incomplete scans first; otherwise fresh arrivals can starve them.
 unseen.sort((a,b)=>Number(!!b.previous)-Number(!!a.previous)||b.repo.stars-a.repo.stars||String(a.repo.id).localeCompare(String(b.repo.id)));
 const capacity=Math.max(0,Math.floor(maxRepositories));
 const domains=new Map();
 for(const entry of unseen){
  const name=typeof entry.repo.domain==='string'?entry.repo.domain:'uncategorized';
  if(!domains.has(name))domains.set(name,[]);
  domains.get(name).push(entry);
 }
 // Reserve a fair domain sample first, then fill remaining slots by the
 // global priority order. No hardcoded repo names, topics or owner lists.
 const fair=Math.max(1,Math.min(8,Math.floor(capacity/(Math.max(1,domains.size)*2))));
 const chosen=[],selected=new Set();
 const pick=entry=>{const id=String(entry.repo.id);if(chosen.length<capacity&&!selected.has(id)){chosen.push(entry);selected.add(id)}};
 for(const group of domains.values())for(const entry of group.slice(0,fair))pick(entry);
 for(const entry of unseen)pick(entry);
 let probed=0,detected=0,cursor=0,rateLimited=false;
 const concurrent=Math.max(1,Math.min(12,Math.floor(maxConcurrent)||1));
 const worker=async()=>{
  while(cursor<chosen.length&&!rateLimited){
   const {repo,sha}=chosen[cursor++];
   const id=String(repo.id);probed++;
  try{
   const prior=entries.get(id);
   const scan=await discoverRepositorySkills({...repo,commit_sha:sha},{
    maxFileReads:0,maxTreeRequests,
    getTree:(r,ref,recursive)=>api('repos/'+r.full_name+'/git/trees/'+encodeURIComponent(ref)+(recursive?'?recursive=1':'')),
    getText:()=>{throw Error('Probing must not read SKILL.md content')},
   },[],prior?.sha===sha?{commit_sha:sha,discovery_rules_version:prior.discovery_rules_version,inventory:prior.inventory,pending_trees:prior.pending_trees,inventory_complete:prior.inventory_complete}:{});

   const has=scan.inventory.length>0;
   const status=has||scan.inventory_complete?'complete':'incomplete';
   entries.set(id,{id,sha,status,has_skill_file:has,checked_at:date.toISOString(),discovery_rules_version:SKILL_DISCOVERY_RULES_VERSION,
    inventory_complete:scan.inventory_complete,
    inventory:status==='complete'?[]:scan.inventory,
    pending_trees:status==='complete'?[]:scan.pending_trees});
   if(has){repo.skill_candidate=true;detected++}
   if(status==='incomplete')errors.push(repo.full_name+': '+scan.errors.join('; '));
  }catch(error){
   entries.set(id,{id,sha,status:'incomplete',has_skill_file:false,checked_at:date.toISOString(),discovery_rules_version:SKILL_DISCOVERY_RULES_VERSION});
   errors.push(repo.full_name+': '+error.message);
   if(error.code==='RATE_LIMIT')rateLimited=true;
  }
 }};
 await Promise.all(Array.from({length:Math.min(chosen.length,concurrent)},worker));
 const pending=unseen.length-probed+retry.length+withoutRevision;
 return {state:{version:SKILL_DISCOVERY_RULES_VERSION,entries:[...entries.values()]},
  coverage:{unlabelled:unseen.length+retry.length+cached+withoutRevision,cached,previously_detected:positive,probed_this_run:probed,detected_this_run:detected,pending,incomplete:errors.length,complete:pending===0&&errors.length===0},
  errors};
}
