// Pure views over the generated SKILL.md catalog. No skill names are enumerated here.
export function skillsInRepository(repository,skills=[]){return skills.filter(s=>typeof repository==='object'&&repository.id!=null?String(s.repository_id)===String(repository.id):s.repository.toLowerCase()===repository.toLowerCase())}
export function searchSkills(q,skills=[]){const term=q.toLowerCase();return skills.filter(s=>`${s.name} ${s.repository} ${s.description||''} ${s.summary||''} ${s.input||''} ${s.output||''}`.toLowerCase().includes(term))}
export function sortSkills(skills,sort='name'){
 if(sort==='installs')return skills.filter(s=>Number.isFinite(s.metrics?.installs?.value)).sort((a,b)=>b.metrics.installs.value-a.metrics.installs.value||a.id.localeCompare(b.id));
 return [...skills].sort((a,b)=>(sort==='repository'?a.repository.localeCompare(b.repository):a.name.localeCompare(b.name))||a.id.localeCompare(b.id));
}
