import {readdirSync,statSync,readFileSync} from 'node:fs';
import {gzipSync,gunzipSync} from 'node:zlib';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/data/',import.meta.url));
const latest=JSON.parse(readFileSync(join(root,'latest.json'),'utf8'));
const skills=JSON.parse(readFileSync(join(root,'skills.json'),'utf8'));
const checkpoint=JSON.parse(gunzipSync(readFileSync(join(root,'scan-checkpoint.json.gz'))));
const need=[
 'jub0t/concat','vercel-labs/agent-desktop','trycua/cua',
 'storytold/craft-anything','hmjz100/linkswift','sherlock-project/sherlock',
 'usagi-org/ai-goofish-monitor','ebony-vinyl/dsh-our-free-model',
 'hgtuj5688/tvbox-desktop','yetone/magpie','blinue/magpie',
 'hkuds/deeptutor','sansan0/trendradar'
];
const seen=new Set(latest.repositories.map(r=>r.full_name.toLowerCase()));
const missing=need.filter(n=>!seen.has(n));
if(missing.length)throw Error('Missing verified repositories: '+missing.join(', '));
if(new Set(latest.repositories.map(r=>String(r.id))).size!==latest.repositories.length)throw Error('Duplicate repository IDs');
if(skills.repositories.some(r=>r.inventory||r.file_states||r.pending_trees))throw Error('Public skills catalog leaks unbounded checkpoint state');
if(!Array.isArray(checkpoint.repositories))throw Error('Missing compressed scan checkpoints');
const max=90*1024*1024;
let largest={name:'',size:0};
function visit(dir){for(const item of readdirSync(dir,{withFileTypes:true})){
 const name=join(dir,item.name);
 if(item.isDirectory()){visit(name);continue}
 if(!item.isFile())continue;
 const size=statSync(name).size;
 if(size>largest.size)largest={name,size};
 if(size>max)throw Error('Git blob exceeds safe limit: '+name+' '+size);
}}
visit(root);
console.log(JSON.stringify({verified:need.length,missing,projects:latest.repositories.length,skills:skills.skills.length,scanCheckpoints:checkpoint.repositories.length,largestFileBytes:largest.size,largestFile:largest.name}));