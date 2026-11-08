import {test} from 'node:test';
import assert from 'node:assert/strict';
import {general} from '../scripts/general-projects.mjs';
import {readFile} from 'node:fs/promises';

test('Known non-Skill omissions have stable seed coverage without duplicate repository rows',()=>{
 const names=general.map(r=>r.name.toLowerCase());
 const expected=['jub0t/concat','vercel-labs/agent-desktop','trycua/cua','storytold/craft-anything','hmjz100/linkswift','sherlock-project/sherlock','usagi-org/ai-goofish-monitor','ebony-vinyl/dsh-our-free-model','hgtuj5688/tvbox-desktop','yetone/magpie','blinue/magpie','hkuds/deeptutor','sansan0/trendradar'];
 assert.equal(new Set(names).size,names.length);
 for(const name of expected)assert.ok(names.includes(name),'Missing verified seed: '+name);
 for(const r of general)assert.ok(r.name&&r.domain&&r.summary&&r.input&&r.output);
});
test('Ordinary project discovery is resumable and uses configured pagination, not just first 100',async()=>{
 const source=await readFile(new URL('../scripts/collect.mjs',import.meta.url),'utf8');
 assert.match(source,/general-discovery-state\.json/);
 assert.match(source,/generalDiscovery=await discoverRepositories/);
 assert.match(source,/general:generalDiscovery\.coverage/);
});