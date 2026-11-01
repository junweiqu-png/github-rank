import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sortSkills} from '../dist/skills.js';
test('Installation ranking excludes missing values rather than treating them as zero or repo stars',()=>{
 const skills=[{id:'a',name:'a',repository:'repo/a',repository_stars:99999,metrics:{installs:{value:null,status:'not_connected'}}},{id:'b',name:'b',repository:'repo/b',metrics:{installs:{value:0,status:'observed'}}},{id:'c',name:'c',repository:'repo/c',metrics:{installs:{value:4,status:'observed'}}}];
 assert.deepEqual(sortSkills(skills,'installs').map(s=>s.id),['c','b']);
});
