import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createGithubClient} from '../scripts/lib/github-client.mjs';
const sha='a'.repeat(40);
const json=(data,{status=200,headers={}}={})=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json',...headers}});

test('Search requests serialize and honor a minimum interval; low core reserve does not block search',async()=>{
 let clock=1_000_000;const starts=[],sleeps=[];
 const client=createGithubClient({token:'test-secret',now:()=>clock,sleep:async ms=>{sleeps.push(ms);clock+=ms},fetchImpl:async url=>{
  starts.push(clock);return url.includes('/search/')?json({items:[]},{headers:{'x-ratelimit-resource':'search','x-ratelimit-remaining':'28','x-ratelimit-reset':String((clock+60_000)/1000)}}):json({id:1},{headers:{'x-ratelimit-resource':'core','x-ratelimit-remaining':'19','x-ratelimit-reset':String((clock+60_000)/1000)}});
 }});
 assert.equal((await client.api('repos/owner/tool')).id,1);
 await assert.rejects(client.api('repos/owner/tool'),e=>e.code==='RATE_LIMIT'&&e.resource==='core'&&e.reset>0);
 await Promise.all([client.api('search/repositories?q=skill'),client.api('search/repositories?q=skills')]);
 assert.ok(starts[2]-starts[1]>=2500);assert.ok(sleeps.length>0);assert.equal(client.stats.requests.core,1);
 assert.ok(!JSON.stringify(client.stats).includes('test-secret'));
});

test('A bounded secondary-limit retry honors Retry-After without leaking server text',async()=>{
 let calls=0;const sleeps=[];
 const client=createGithubClient({token:'secret',sleep:async ms=>sleeps.push(ms),fetchImpl:async()=>++calls===1?json({message:'You have exceeded a secondary rate limit. secret'},{status:403,headers:{'retry-after':'1'}}):json({id:7})});
 assert.equal((await client.api('repos/owner/tool')).id,7);assert.deepEqual(sleeps,[1000]);assert.equal(client.stats.retries,1);
 assert.ok(!JSON.stringify(client.stats).includes('secret'));
 const stopped=createGithubClient({sleep:async()=>assert.fail('Must not wait for a minute'),fetchImpl:async()=>json({message:'secondary rate limit'},{status:429,headers:{'retry-after':'60'}})});
 await assert.rejects(stopped.api('repos/owner/tool'),e=>e.code==='RATE_LIMIT'&&e.reset>0);
 const noHeader=createGithubClient({sleep:async()=>assert.fail('Must checkpoint rather than retry secondary limits early'),fetchImpl:async()=>json({message:'secondary rate limit'},{status:403})});
 await assert.rejects(noHeader.api('repos/owner/tool'),e=>e.code==='RATE_LIMIT');
});

test('Raw source reads use pinned public SHA and validate streaming byte size and UTF-8',async()=>{
 let called;const client=createGithubClient({token:'do-not-send',maxRawBytes:8,fetchImpl:async(url,options)=>{called={url,options};return new Response('中文')}});
 assert.equal(await client.rawText({full_name:'owner/tool'},'skills/a b/SKILL.md',sha),'中文');
 assert.ok(called.url.endsWith('/'+sha+'/skills/a%20b/SKILL.md'));assert.equal(called.options.headers.Authorization,undefined);
 assert.equal(client.stats.requests.core,0);
 await assert.rejects(client.rawText('owner/tool','SKILL.md','main'),/exact commit SHA/);
 await assert.rejects(client.rawText('owner/tool','../SKILL.md',sha),/Invalid/);
 const large=createGithubClient({maxRawBytes:8,fetchImpl:async()=>new Response('123456789')});
 await assert.rejects(large.rawText('owner/tool','SKILL.md',sha),/text limit/);
 const binary=createGithubClient({fetchImpl:async()=>new Response(new Uint8Array([255]))});
 await assert.rejects(binary.rawText('owner/tool','SKILL.md',sha),/UTF-8/);
});

test('GraphQL batches 50 repositories, follows rename by ID, and rejects reused names or forks',async()=>{
 const requests=[];
 const input=Array.from({length:51},(_,i)=>({id:i+1,full_name:'owner/r'+i}));
 const client=createGithubClient({token:'token',fetchImpl:async(url,options)=>{
  assert.equal(url,'https://api.github.com/graphql');assert.equal(options.headers['Content-Type'],'application/json');const query=JSON.parse(options.body).query;requests.push(query);
  const rows=[...query.matchAll(/r(\d+):repository\(owner:"owner",name:"r(\d+)"\)/g)];
  return json({data:Object.fromEntries(rows.map(([,alias,index])=>['r'+alias,{databaseId:Number(index)+1,nameWithOwner:'renamed/r'+index,isPrivate:false,isFork:Number(index)===2,stargazerCount:120+Number(index),description:'Fresh project description',createdAt:'2026-01-01T00:00:00Z',pushedAt:'2026-11-01T00:00:00Z',isArchived:false,url:'https://github.com/renamed/r'+index,defaultBranchRef:{name:'main',target:{oid:sha}}}]))});
 }});
 const out=await client.resolveHeads(input);assert.equal(requests.length,2);assert.equal(out.size,50);assert.equal(out.get('1').full_name,'renamed/r0');assert.equal(out.has('3'),false);
 assert.equal(out.get('1').stars,120);assert.equal(out.get('1').description,'Fresh project description');assert.equal(out.get('1').updated_at,'2026-11-01T00:00:00Z');
 const reused=createGithubClient({token:'token',fetchImpl:async()=>json({data:{r0:{databaseId:999,nameWithOwner:'owner/tool',isPrivate:false,isFork:false,defaultBranchRef:{name:'main',target:{oid:sha}}}}})});
 assert.equal((await reused.resolveHeads([{id:1,full_name:'owner/tool'}])).size,0);
 assert.equal(reused.stats.heads.rejected,1);
});

test('GraphQL authorization failure safely leaves unresolved entries for REST fallback',async()=>{
 let calls=0;const client=createGithubClient({token:'token',fetchImpl:async()=>{calls++;return json({message:'Forbidden'},{status:403})}});
 const out=await client.resolveHeads([{id:1,full_name:'owner/tool'}]);assert.equal(out.size,0);assert.equal(calls,1);assert.equal(client.stats.heads.fallback,1);
 assert.equal(client.stats.heads.failed_batches,1);assert.ok(client.stats.heads.errors.length>0);
});

test('API requests cannot be redirected to arbitrary hosts or parent paths',async()=>{
 const client=createGithubClient({fetchImpl:async()=>assert.fail('Invalid paths must not fetch')});
 for(const path of ['https://example.com/repos/x/y','//example.com/x','repos/x/y/../../users','repos/x/y/%2e%2e/users','users/me','repos/x/y\\secret'])await assert.rejects(client.api(path),/GitHub API path/);
});
