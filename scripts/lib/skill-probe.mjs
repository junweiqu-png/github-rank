import {discoverRepositorySkills} from './skill-discovery.mjs';

// Probe a bounded sample of ordinary repositories, including those whose names,
// descriptions and Topics never mention Skills. This is not a fixed allowlist.
export async function probeUnlabelledSkillRepositories({
 api,repositories,heads=new Map(),previousState=null,maxRepositories=64,
 now=new Date(),isCandidate=()=>false,maxTreeRequests=8,
}={}){
 if(typeof api!=='function'||!Array.isArray(repositories))throw TypeError('Repositories and GitHub API are required');
 const entries=new Map((previousState?.version===1&&Array.isArray(previousState.entries)?previousState.entries:[])
  .filter(e=>e&&e.id!=null).map(e=>[String(e.id),e]));
 const date=new Date(now),ts=+date;
 if(!Number.isFinite(ts))throw TypeError('Invalid probe time');
 const unseen=[],retry=[],errors=[];let cached=0,positive=0,withoutRevision=0;
 for(const repo of repositories){
  if(!repo||repo.id==null||isCandidate(repo))continue;
  const id=String(repo.id),sha=heads.get(id)?.commit_sha||repo.commit_sha;
  if(!sha){withoutRevision++;continue}
  const old=entries.get(id);
  if(old?.sha===sha&&old.status==='complete'){
   cached++;if(old.has_skill_file){repo.skill_candidate=true;positive++}
   continue;
  }
  if(old?.sha===sha&&old.status==='incomplete'&&ts-Date.parse(old.checked_at)<20*3600*1000){retry.push({repo,sha});continue}
  unseen.push({repo,sha,previous:old});
 }
 unseen.sort((a,b)=>Number(!!a.previous)-Number(!!b.previous)||b.repo.stars-a.repo.stars||String(a.repo.id).localeCompare(String(b.repo.id)));
 let probed=0,detected=0;
 for(const {repo,sha} of unseen.slice(0,Math.max(0,Math.floor(maxRepositories)))){
  const id=String(repo.id);probed++;
  try{
   const prior=entries.get(id);
   const scan=await discoverRepositorySkills({...repo,commit_sha:sha},{
    maxFileReads:0,maxTreeRequests,
    getTree:(r,ref,recursive)=>api('repos/'+r.full_name+'/git/trees/'+encodeURIComponent(ref)+(recursive?'?recursive=1':'')),
    getText:()=>{throw Error('Probing must not read SKILL.md content')},
   },[],prior?.sha===sha?{commit_sha:sha,inventory:prior.inventory,pending_trees:prior.pending_trees,inventory_complete:prior.inventory_complete}:{});

   const has=scan.inventory.length>0;
   const status=has||scan.inventory_complete?'complete':'incomplete';
   entries.set(id,{id,sha,status,has_skill_file:has,checked_at:date.toISOString(),
    inventory_complete:scan.inventory_complete,
    inventory:status==='complete'?[]:scan.inventory,
    pending_trees:status==='complete'?[]:scan.pending_trees});
   if(has){repo.skill_candidate=true;detected++}
   if(status==='incomplete')errors.push(repo.full_name+': '+scan.errors.join('; '));
  }catch(error){
   entries.set(id,{id,sha,status:'incomplete',has_skill_file:false,checked_at:date.toISOString()});
   errors.push(repo.full_name+': '+error.message);
   if(error.code==='RATE_LIMIT')break;
  }
 }
 const pending=unseen.length-probed+retry.length+withoutRevision;
 return {state:{version:1,entries:[...entries.values()]},
  coverage:{unlabelled:unseen.length+retry.length+cached+withoutRevision,cached,previously_detected:positive,probed_this_run:probed,detected_this_run:detected,pending,incomplete:errors.length,complete:pending===0&&errors.length===0},
  errors};
}
