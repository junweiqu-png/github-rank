// Shared, pure interchange format for the static site's lightweight index.
// The original repository and Skill source catalogs remain authoritative.
export const FAST_SCHEMA_VERSION=1;
export const FAST_SHARDS=64;

export function shardOf(id){
 const number=Number(id);
 if(!Number.isSafeInteger(number)||number<0)throw TypeError('Invalid GitHub repository id');
 return String(number%FAST_SHARDS).padStart(2,'0');
}
export function packProject(r){
 return [
  r.id,r.full_name,r.stars,r.created_at,r.domain||'other',
  r.types||[r.category||'projects'],r.skill_count||0,r.skill_verification||'',
  r.archived?1:0,r.updated_at||'',r.observed_at||'',r.category||'projects',
  r.description||'',(r.topics||[]).join(' ')
 ];
}
export function unpackProject(a){
 if(!Array.isArray(a)||a.length!==14)throw TypeError('Malformed project index row');
 return {
  id:a[0],full_name:a[1],stars:a[2],created_at:a[3],domain:a[4],
  types:a[5],skill_count:a[6],skill_verification:a[7],
  archived:!!a[8],updated_at:a[9],observed_at:a[10],category:a[11],
  description:a[12],topics:a[13]?a[13].split(' '):[],
  url:'https://github.com/'+a[1]
 };
}
export function packSkill(s){
 return [
  s.repository_id,s.name,s.description||'',s.summary||'',s.input||'',s.output||'',
  s.path,s.source_url||'',s.translation_status||'',s.official_install_url||'',
  s.stale?1:0,Number.isFinite(s.metrics?.installs?.value)?s.metrics.installs.value:null
 ];
}
export function unpackSkill(a){
 if(!Array.isArray(a)||a.length!==12)throw TypeError('Malformed Skill index row');
 return {
  repository_id:a[0],name:a[1],description:a[2],summary:a[3],input:a[4],output:a[5],
  path:a[6],source_url:a[7],translation_status:a[8],
  official_install_url:a[9],stale:!!a[10],
  metrics:{installs:{value:a[11]}}
 };
}
export function newestFirst(a,b){
 return b[2]-a[2]||String(a[1]).localeCompare(String(b[1]));
}
