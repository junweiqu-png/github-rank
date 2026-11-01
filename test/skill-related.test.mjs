import {test} from 'node:test';
import assert from 'node:assert/strict';
import {rank} from '../dist/ranking.js';
import {skillsInRepository} from '../dist/skills.js';
import {repositoryView} from '../dist/catalog.js';

test('A project with discovered skills appears under both relevant types, once in all projects',()=>{
 const repos=[{id:1,full_name:'future/tool',category:'projects',skill_count:2,domain:'ai',created_at:'2026-01-01',stars:50}];
 const options={date:'2026-11-01'};
 assert.deepEqual(rank(repos,{...options,category:'skills'}).map(r=>r.id),[1]);
 assert.deepEqual(rank(repos,{...options,category:'projects'}).map(r=>r.id),[1]);
 assert.equal(rank(repos,options).length,1);
 assert.equal(rank([{...repos[0],skill_count:0}],{...options,category:'skills'}).length,0);
 assert.equal(rank([{...repos[0],category:'skills',skill_count:0}],{...options,category:'skills'}).length,1);
});

test('The catalog-to-project join supplies both type membership and expansion records',()=>{
 const repo={id:9,full_name:'unlisted/tool',category:'plugins',domain:'ai',created_at:'2026-01-01',stars:9};
 const skills=[{id:'9:a',repository_id:9,repository:'unlisted/tool',name:'new-task'}];
 const view=repositoryView(repo,{skills});
 assert.equal(view.skill_count,1);assert.equal(view.skills[0].name,'new-task');
 assert.equal(rank([view],{date:'2026-11-01',category:'skills'}).length,1);
 assert.equal(rank([view],{date:'2026-11-01',category:'plugins'}).length,1);
 assert.equal(rank([view],{date:'2026-11-01',category:'skills',q:'new-task'}).length,1);
 const historical=repositoryView(repo,{skills,includeSkills:false});
 assert.equal(historical.skill_count,0);
 assert.equal(rank([historical],{date:'2026-11-01',category:'skills'}).length,0);
});

test('Search candidates enter Skills only after a valid file is found; an empty full scan is distinguished',()=>{
 const repo={id:8,full_name:'candidate/tool',category:'skills',skill_candidate:true,created_at:'2026-01-01',stars:2};
 const pending=repositoryView(repo);
 assert.equal(pending.skill_verification,'pending');assert.equal(rank([pending],{date:'2026-11-01',category:'skills'}).length,0);
 const empty=repositoryView(repo,{scans:[{id:8,complete:true,skill_count:0}]});
 assert.equal(empty.skill_verification,'none');assert.equal(rank([empty],{date:'2026-11-01',category:'skills'}).length,0);
 const old=repositoryView({...repo,category:'projects',types:['projects','skills']},{includeSkills:false});
 assert.equal(rank([old],{date:'2026-11-01',category:'skills'}).length,1);
});

test('Skill parent membership follows repository identity across rename, not reused names',()=>{
 const skills=[{id:'1:SKILL.md',repository_id:1,repository:'old/tool',name:'task'},
  {id:'2:SKILL.md',repository_id:2,repository:'new/tool',name:'another'}];
 assert.deepEqual(skillsInRepository({id:1,full_name:'new/tool'},skills).map(s=>s.id),['1:SKILL.md']);
 assert.deepEqual(skillsInRepository({id:3,full_name:'old/tool'},skills),[]);
});
