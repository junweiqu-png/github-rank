const SHA=/^[0-9a-f]{40}$/i;
const REPOSITORY=/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i;
const MAX_RAW_BYTES=1024*1024;

function repositoryName(repo){
 const name=typeof repo==='string'?repo:repo?.full_name;
 if(typeof name!=='string'||!REPOSITORY.test(name)||name.split('/').some(x=>x==='.'||x==='..'))throw Error('Invalid GitHub repository name');
 return name;
}
function resetTime(headers){const seconds=Number(headers.get('x-ratelimit-reset'));return Number.isFinite(seconds)&&seconds>0?seconds*1000:null}
function limited(resource,resetAt){
 const error=new Error('GitHub '+resource+' rate limit reached; resume after the reset time');
 error.code='RATE_LIMIT';error.resource=resource;
 error.reset=resetAt?Math.ceil(resetAt/1000):null;
 error.resetAt=resetAt?new Date(resetAt).toISOString():null;
 return error;
}
function httpError(status,resource){const error=new Error('GitHub '+resource+' request failed (HTTP '+status+')');error.code='GITHUB_HTTP';error.status=status;return error}

/** Public-source client. Never downloads or executes repository programs. */
export function createGithubClient({
 token=process.env.GITHUB_TOKEN,fetchImpl=fetch,
 now=()=>Date.now(),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms)),
 timeoutMs=20_000,maxRetries=2,maxRetryDelayMs=10_000,
 searchIntervalMs=2_500,coreReserve=20,maxRawBytes=MAX_RAW_BYTES,
 graphqlBatchSize=50,
}={}){
 const stats={requests:{core:0,search:0,raw:0,graphql:0},retries:0,
  core:{remaining:null,limit:null,reset:null},search:{remaining:null,limit:null,reset:null},
  graphql:{remaining:null,limit:null,reset:null},
  heads:{requested:0,resolved:0,rejected:0,failed_batches:0,fallback:0,errors:[]}};
 const headers={'User-Agent':'GithubRank','Accept':'application/vnd.github+json',...(token?{Authorization:'Bearer '+token}:{})};
 const pacing=Math.max(2_500,searchIntervalMs),byteLimit=Math.min(MAX_RAW_BYTES,Math.max(1,maxRawBytes));
 let searchNextAt=0,searchQueue=Promise.resolve();

 function observe(response,expected){
  const resource=response.headers.get('x-ratelimit-resource')||expected;
  const bucket=stats[resource];
  if(bucket&&typeof bucket==='object'&&'remaining' in bucket){
   for(const [header,key] of [['x-ratelimit-remaining','remaining'],['x-ratelimit-limit','limit']]){
    const value=response.headers.get(header);if(value!==null&&Number.isFinite(Number(value)))bucket[key]=Number(value);
   }
   const reset=resetTime(response.headers);if(reset)bucket.reset=Math.ceil(reset/1000);
  }
  return resource;
 }
 function resetAt(resource){return stats[resource]?.reset?stats[resource].reset*1000:null}
 function checkCore(){
  const b=stats.core;
  if(b.remaining!==null&&b.remaining<=coreReserve&&(!b.reset||b.reset*1000>now()))throw limited('core',resetAt('core'));
 }
 async function paceSearch(){
  let due=searchNextAt;
  const b=stats.search;
  if(b.reset&&b.reset*1000>now()&&b.remaining!==null){
   if(b.remaining<=0)due=Math.max(due,b.reset*1000+1000);
  }
  const wait=Math.max(0,due-now());
  if(wait>maxRetryDelayMs)throw limited('search',Math.max(due,resetAt('search')||0));
  if(wait)await sleep(wait);
  searchNextAt=now()+pacing;
 }
 function searchAfterResponse(){
  const b=stats.search,reset=resetAt('search');
  if(reset&&reset>now()&&b.remaining!==null&&b.remaining>0){
   searchNextAt=Math.max(searchNextAt,now()+Math.ceil((reset-now())/b.remaining));
  }
 }
 function retryDelay(response,attempt){
  const value=response.headers.get('retry-after');
  if(value!==null){const seconds=Number(value);if(Number.isFinite(seconds))return Math.max(0,seconds*1000);const date=Date.parse(value);if(Number.isFinite(date))return Math.max(0,date-now())}
  return 1000*2**attempt;
 }
 async function requestJson(url,{resource='core',method='GET',body}={}){
  for(let attempt=0;;attempt++){
   if(resource==='core')checkCore();
   if(resource==='search')await paceSearch();
   stats.requests[resource]++;
   let response;
   try{response=await fetchImpl(url,{method,headers:body?{...headers,'Content-Type':'application/json'}:headers,body,signal:AbortSignal.timeout(timeoutMs)})}
   catch{
    if(attempt>=maxRetries){const error=new Error('GitHub '+resource+' network request failed');error.code='GITHUB_NETWORK';throw error}
    stats.retries++;await sleep(Math.min(maxRetryDelayMs,1000*2**attempt));continue;
   }
   const actual=observe(response,resource);
   if(resource==='search')searchAfterResponse();
   let payload;try{payload=await response.json()}catch{payload=null}
   if(response.ok){if(payload===null)throw Error('GitHub returned invalid JSON');return payload}
   const remaining=response.headers.get('x-ratelimit-remaining');
   const isPrimary=remaining!==null&&Number(remaining)===0;
   const isSecondary=/secondary rate|abuse detection|temporarily blocked/i.test(payload?.message||'');
   if(isPrimary){
    const reset=resetTime(response.headers)||now()+60_000;
    // Core and GraphQL exhaustion checkpoint immediately, without a long wait.
    if(actual!=='search')throw limited(actual,reset);
    const wait=reset-now()+1000;
    if(attempt>=maxRetries||wait>maxRetryDelayMs)throw limited(actual,reset);
    stats.retries++;if(wait>0)await sleep(wait);continue;
   }
   if(response.status===429||isSecondary||[502,503,504].includes(response.status)){
    // GitHub asks for at least one minute on secondary limits when no
    // Retry-After is supplied. Checkpoint instead of retrying early.
    const wait=(isSecondary||response.status===429)&&response.headers.get('retry-after')===null?60_000:retryDelay(response,attempt);
    if(attempt>=maxRetries||wait>maxRetryDelayMs){
     if(response.status===429||isSecondary)throw limited(actual,now()+wait);
     throw httpError(response.status,resource);
    }
    stats.retries++;if(wait)await sleep(wait);continue;
   }
   throw httpError(response.status,resource);
  }
 }

 function api(path){
  if(typeof path!=='string'||!path||path.startsWith('/')||path.includes('\\')||path.split(/[/?]/).some(p=>p==='.'||p==='..'))return Promise.reject(Error('Invalid GitHub API path'));
  let decoded;try{decoded=decodeURIComponent(path.split('?')[0])}catch{return Promise.reject(Error('Invalid GitHub API path'))}
  if(decoded.split('/').some(p=>p==='.'||p==='..'))return Promise.reject(Error('Invalid GitHub API path'));
  const url=new URL(path,'https://api.github.com/');
  if(url.origin!=='https://api.github.com'||!/^\/(repos\/[a-z0-9_.-]+\/[a-z0-9_.-]+(?:\/|$)|search\/(?:repositories|code)$|rate_limit$)/i.test(url.pathname))return Promise.reject(Error('Unsupported GitHub API path'));
  const resource=url.pathname.startsWith('/search/')?'search':'core';
  const run=()=>requestJson(url.href,{resource});
  if(resource!=='search')return run();
  const result=searchQueue.then(run);searchQueue=result.catch(()=>{});return result;
 }

 async function rawText(repo,path,ref){
  const name=repositoryName(repo);
  if(typeof ref!=='string'||!SHA.test(ref))throw Error('Raw Skill reads require an exact commit SHA');
  if(typeof path!=='string'||!path||path.startsWith('/')||path.includes('\\')||path.split('/').some(p=>!p||p==='.'||p==='..'))throw Error('Invalid Skill source path');
  const url='https://raw.githubusercontent.com/'+name+'/'+ref+'/'+path.split('/').map(encodeURIComponent).join('/');
  for(let attempt=0;;attempt++){
   stats.requests.raw++;
   let response;
   try{response=await fetchImpl(url,{headers:{'User-Agent':'GithubRank','Accept':'text/plain'},signal:AbortSignal.timeout(timeoutMs)})}
   catch{if(attempt>=maxRetries){const e=new Error('Raw Skill source request failed');e.code='GITHUB_NETWORK';throw e}stats.retries++;await sleep(Math.min(maxRetryDelayMs,1000*2**attempt));continue}
   if(!response.ok){
    if((response.status===429||[502,503,504].includes(response.status))&&attempt<maxRetries){const wait=retryDelay(response,attempt);if(wait<=maxRetryDelayMs){stats.retries++;if(wait)await sleep(wait);continue}}
    throw httpError(response.status,'raw');
   }
   const declared=Number(response.headers.get('content-length'));
   if(declared>byteLimit){await response.body?.cancel();throw Error('Raw Skill source exceeds the 1 MiB text limit')}
   const parts=[];let size=0;
   if(response.body?.getReader){
    const reader=response.body.getReader();
    try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>byteLimit){await reader.cancel();throw Error('Raw Skill source exceeds the 1 MiB text limit')}parts.push(value)}}
    finally{reader.releaseLock()}
   }else{const bytes=new Uint8Array(await response.arrayBuffer());size=bytes.byteLength;if(size>byteLimit)throw Error('Raw Skill source exceeds the 1 MiB text limit');parts.push(bytes)}
   const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.byteLength}
   try{return new TextDecoder('utf-8',{fatal:true}).decode(bytes)}catch{throw Error('Raw Skill source is not valid UTF-8')}
  }
 }

 async function resolveHeads(repos){
  const resolved=new Map(),input=[];
  for(const repo of repos||[]){
   stats.heads.requested++;
   try{repositoryName(repo);if(repo.id===undefined||repo.id===null)throw Error('Missing identity');input.push(repo)}catch{stats.heads.rejected++}
  }
  if(!token){stats.heads.fallback+=input.length;stats.heads.errors.push('GraphQL authentication unavailable');return resolved}
  const batchSize=Math.max(1,Math.min(50,graphqlBatchSize));
  for(let cursor=0;cursor<input.length;cursor+=batchSize){
   const batch=input.slice(cursor,cursor+batchSize);
   const fields=batch.map((repo,i)=>{const [owner,name]=repo.full_name.split('/');return 'r'+i+':repository(owner:'+JSON.stringify(owner)+',name:'+JSON.stringify(name)+'){databaseId nameWithOwner isPrivate isFork stargazerCount description createdAt pushedAt isArchived url defaultBranchRef{name target{... on Commit{oid}}}}'}).join(' ');
   let result;
   try{result=await requestJson('https://api.github.com/graphql',{resource:'graphql',method:'POST',body:JSON.stringify({query:'query{'+fields+' rateLimit{remaining resetAt cost}}'})})}
   catch(error){
    stats.heads.failed_batches++;stats.heads.errors.push(error.code==='RATE_LIMIT'?'GraphQL rate limit reached':'GraphQL request unavailable');
    if(error.code==='RATE_LIMIT'||error.status===401||error.status===403)break;
    continue;
   }
   if(result.data?.rateLimit){const limit=result.data.rateLimit;stats.graphql.remaining=limit.remaining;const reset=Date.parse(limit.resetAt);if(Number.isFinite(reset))stats.graphql.reset=Math.ceil(reset/1000)}
   if(result.errors?.length){stats.heads.errors.push('GraphQL returned partial or missing repository data');if(!result.data)stats.heads.failed_batches++}
   for(let i=0;i<batch.length;i++){
    const original=batch[i],entry=result.data?.['r'+i],branch=entry?.defaultBranchRef;
    if(!entry)continue;
    if(String(entry.databaseId)!==String(original.id)||entry.isPrivate||entry.isFork){stats.heads.rejected++;continue}
    if(!branch||!SHA.test(branch.target?.oid||''))continue;
    try{repositoryName(entry.nameWithOwner)}catch{stats.heads.rejected++;continue}
    resolved.set(String(original.id),{id:entry.databaseId,full_name:entry.nameWithOwner,default_branch:branch.name,commit_sha:branch.target.oid,
     stars:Number.isFinite(entry.stargazerCount)?entry.stargazerCount:original.stars,
     description:typeof entry.description==='string'?entry.description:entry.description===null?'':original.description,
     created_at:entry.createdAt||original.created_at,updated_at:entry.pushedAt??original.updated_at,
     archived:typeof entry.isArchived==='boolean'?entry.isArchived:original.archived,
     url:entry.url||original.url||'https://github.com/'+entry.nameWithOwner,
     observed_at:new Date(now()).toISOString()});
   }
  }
  stats.heads.resolved+=resolved.size;stats.heads.fallback+=input.length-resolved.size;
  return resolved;
 }
 return {api,rawText,resolveHeads,stats};
}
