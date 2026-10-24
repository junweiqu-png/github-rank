import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {rank} from '../dist/ranking.js';
import {domainOf,explanation} from '../dist/catalog.js';
const date='2026-10-24';
test('AI and other fields are separate from extension type',()=>{
 const records=[{id:1,full_name:'ai/app',stars:9,created_at:date,category:'projects',domain:'ai'},{id:2,full_name:'web/lib',stars:10,created_at:date,category:'projects',domain:'web'},{id:3,full_name:'ai/skill',stars:1,created_at:date,category:'skills',domain:'ai'}];
 assert.deepEqual(rank(records,{date,area:'ai'}).map(r=>r.id),[1,3]);
 assert.deepEqual(rank(records,{date,area:'other'}).map(r=>r.id),[2]);
 assert.deepEqual(rank(records,{date,area:'ai',category:'projects'}).map(r=>r.id),[1]);
 assert.deepEqual(rank(records,{date,domain:'web'}).map(r=>r.id),[2]);
});
test('Chinese input/output are searchable',()=>{
 assert.equal(rank([{full_name:'tool',stars:1,created_at:date,output:'剪辑后的视频'}],{date,q:'视频'}).length,1);
});
test('Unknown description does not invent inputs and outputs',()=>{
 const x=explanation({full_name:'unknown/project',url:'https://github.com/unknown/project'});assert.equal(x.pending,true);assert.match(x.input,/核实/);
});
test('Catalog copy covers every currently collected project and retains sources',async()=>{
 const root=new URL('../dist/data/',import.meta.url),d=JSON.parse(await readFile(new URL('latest.json',root),'utf8')),e=JSON.parse(await readFile(new URL('editorial.json',root),'utf8'));
 assert.equal(new Set(d.repositories.map(r=>r.id)).size,d.repositories.length);
 for(const r of d.repositories){const copy=explanation(r,e);assert.match(copy.summary,/[\u4e00-\u9fff]/);assert.match(copy.input,/[\u4e00-\u9fff]/);assert.match(copy.output,/[\u4e00-\u9fff]/);assert.match(copy.source,/^https:\/\/github.com\//)}
 assert.equal(explanation({full_name:'react/react'},e).domain,'web');assert.equal(domainOf({category:'mcp'}),'ai');
});
