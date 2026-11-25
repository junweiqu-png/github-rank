import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {readSkills,writeSkills,SAFE_GIT_BYTES} from '../scripts/lib/skill-storage.mjs';

test('Legacy Skill catalog migrates losslessly without accepting corrupt gzip',async t=>{
 const dir=await mkdtemp(new URL('../.skill-storage-test-',import.meta.url));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 const root=pathToFileURL(dir+'/');
 const legacy=new URL('skills.json',root), gz=new URL('skills.json.gz',root);
 const data={skills:[{id:'1:SKILL.md',description:'元数据',fields:[null,42]}],repositories:[{id:1}],coverage:{complete:false}};
 assert.deepEqual(readSkills(root,{allowMissing:true}),{skills:[],repositories:[]});
 await writeFile(legacy,JSON.stringify(data));
 assert.deepEqual(readSkills(root),data);
 await writeSkills(root,data);
 assert.deepEqual(readSkills(root),data);
 assert.ok((await readFile(gz)).length<SAFE_GIT_BYTES);
 await assert.rejects(readFile(legacy),{code:'ENOENT'});
 await writeFile(legacy,JSON.stringify(data));
 await writeFile(gz,'corrupt');
 assert.throws(()=>readSkills(root,{allowMissing:true}));
});
