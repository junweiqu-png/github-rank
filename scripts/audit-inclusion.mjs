// Example: node scripts/audit-inclusion.mjs owner/repo otherowner/otherrepo
// Reports actual recorded provenance, not a claim inferred from Star count.
import {readFileSync} from 'node:fs';
import {general} from './general-projects.mjs';
import {fileURLToPath} from 'node:url';
import {independentDiscovery,explainDiscovery} from './lib/discovery-evidence.mjs';
const root=fileURLToPath(new URL('../dist/data/latest.json',import.meta.url));
const data=JSON.parse(readFileSync(root,'utf8'));
const byName=new Map(data.repositories.map(r=>[r.full_name.toLowerCase(),r]));
const sourceSeeds=JSON.parse(readFileSync(new URL('skill-sources.json',import.meta.url),'utf8'));
const seedNames=new Set([...general.map(r=>r.name),...sourceSeeds.repositories].map(n=>n.toLowerCase()));
const inputs=process.argv.slice(2);
if(!inputs.length){console.log('Usage: node scripts/audit-inclusion.mjs owner/repo [other/repo...]');process.exit(0)}
console.log(JSON.stringify({snapshot_at:data.updated_at,results:inputs.map(requested=>{
 const repo=byName.get(requested.toLowerCase());
 if(!repo)return {requested,found:false,evidence:'not_collected',reason:'No repository record in this snapshot; identity/eligibility and search state need external verification'};
 const listed=!!repo.curated_seed_listed||seedNames.has(repo.full_name.toLowerCase());
 return {requested,found:true,full_name:repo.full_name,id:repo.id,stars:repo.stars,created_at:repo.created_at,
  curated_seed_listed:listed,discovery_sources:repo.discovery_sources||[],
  discovery_seen_at:repo.discovery_seen_at||{},independently_discovered:independentDiscovery(repo),
  evidence:explainDiscovery({...repo,curated_seed_listed:listed}),
  verified_skill_count:repo.skill_count||0};
})},null,2));
