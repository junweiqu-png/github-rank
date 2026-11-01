import {test} from 'node:test';
import assert from 'node:assert/strict';
import {searchSkills,skillsInRepository} from '../dist/skills.js';
const generated=[
 {id:'123:.agents/skills/future',name:'never-listed-before',repository:'example/new-repo',path:'.agents/skills/future/SKILL.md',description:'A skill added after the website shipped',summary:'后来新增的技能',input:'文件',output:'结果'},
 {id:'123:other',name:'second-unseen-skill',repository:'example/new-repo',path:'other/SKILL.md',description:'Another dynamically discovered skill',summary:'同一仓库另一个新技能',input:'文档',output:'结果'}
];
test('UI search consumes the generated catalog, including a previously unknown skill',()=>{
 assert.equal(searchSkills('never-listed-before',generated)[0]?.id,generated[0].id);
});
test('Repository membership consumes discovered records rather than a fixed allowlist',()=>{
 assert.equal(skillsInRepository('example/new-repo',generated).length,2);
});
