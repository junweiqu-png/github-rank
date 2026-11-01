import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isSkillCandidate} from '../scripts/collect-skills.mjs';
test('Previously unknown skill repositories are eligible without manual names or Topics',()=>{
 for(const full_name of ['new-owner/skills','new-owner/agent-skills','new-owner/skill','new-owner/my-skills-kit'])assert.equal(isSkillCandidate({id:77,full_name,category:'projects',description:'',topics:[]}),true,full_name);
 assert.equal(isSkillCandidate({id:78,full_name:'new-owner/tool',category:'projects',description:'Includes SKILL.md',topics:[]}),true);
 assert.equal(isSkillCandidate({id:79,full_name:'new-owner/site',category:'projects',topics:['agent-skills']}),true);
 assert.equal(isSkillCandidate({id:80,full_name:'new-owner/site',category:'projects',topics:[]}),false);
});
