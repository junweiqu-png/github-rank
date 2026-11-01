import {test} from 'node:test';
import assert from 'node:assert/strict';
import {skillDirectory,skillsInRepository,searchSkills} from '../dist/skills.js';
test('Single-skill directory contains all ten reported names without assigning repository stars',()=>{
 const names=['find-skills','grill-me','grill-with-docs','improve-codebase-architecture','agent-browser','tdd','setup-matt-pocock-skills','frontend-design','handoff','triage'];
 assert.deepEqual(skillDirectory.map(s=>s.name).sort(),names.sort());
 assert.equal(new Set(skillDirectory.map(s=>s.repository+'/'+s.name)).size,10);
 for(const s of skillDirectory){assert.equal('stars' in s,false);assert.equal('installs' in s,false);assert(s.url.startsWith('https://www.skills.sh/'))}
});
test('Several skills map to one parent repository and remain individually searchable',()=>{
 assert.equal(skillsInRepository('mattpocock/skills').length,7);
 assert.equal(searchSkills('grill-me')[0].repository,'mattpocock/skills');
 assert.equal(searchSkills('安装')[0].name,'find-skills');
});
