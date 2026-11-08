const PAGE_SIZE=100;
const SEARCH_LIMIT=1000;
const FIRST_SECOND=Date.parse('2008-01-01T00:00:00Z')/1000;
const iso=seconds=>new Date(seconds*1000).toISOString().replace('.000Z','Z');
const second=value=>Date.parse(value)/1000;
// A calendar window belongs to a query's identity, but must not be sent
// twice as competing GitHub "created:" qualifiers.
const CREATION_WINDOW=/(?:^|\s)created:(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})(?=\s|$)/;
function scopeFor(query,maxEnd){
 const found=query.match(CREATION_WINDOW);
 if(!found)return {start:FIRST_SECOND,end:maxEnd,search:query};
 const start=second(found[1]+'T00:00:00Z'),end=second(found[2]+'T23:59:59Z');
 if(!Number.isFinite(start)||!Number.isFinite(end)||start>end)throw TypeError('Invalid creation-window query: '+query);
 return {start:Math.max(FIRST_SECOND,start),end:Math.min(maxEnd,end),search:query.replace(found[0],' ').trim()};
}

function validTask(task,queries){
 return task&&queries.has(task.query)&&Number.isInteger(second(task.start))&&Number.isInteger(second(task.end))&&second(task.start)<=second(task.end)&&Number.isInteger(task.page)&&task.page>=1&&task.page<=SEARCH_LIMIT/PAGE_SIZE;
}

function splitTask(task){
 const start=second(task.start),end=second(task.end);if(start>=end)return null;
 const middle=Math.floor((start+end)/2);
 return [{query:task.query,start:iso(start),end:iso(middle),page:1},{query:task.query,start:iso(middle+1),end:iso(end),page:1}];
}

/**
 * Enumerate a configured set of GitHub repository-search scopes.
 *
 * Every search scope is paginated, and ranges above GitHub's 1000-result limit
 * are split into disjoint creation-time intervals. The FIFO queue makes all
 * source first pages run before the next page/partition of any one source.
 * State contains only unfinished work; callers retain/merge repository records.
 * A completed cycle restarts on the next invocation to discover newer repos.
 * `coverage.complete` applies to these queries, never to GitHub as a whole.
 */
export async function discoverRepositories({api,queries,previousState=null,maxRequests=120,now=new Date()}){
 if(typeof api!=='function')throw new TypeError('A GitHub API reader is required');
 if(!Array.isArray(queries)||queries.some(q=>typeof q!=='string'||!q.trim()))throw new TypeError('queries must be non-empty search strings');
 const sources=[...new Set(queries.map(q=>q.trim()))],sourceSet=new Set(sources);
 const timestamp=new Date(now);if(!Number.isFinite(+timestamp))throw new TypeError('Invalid discovery time');
 const end=Math.max(FIRST_SECOND,Math.floor(Date.UTC(timestamp.getUTCFullYear(),timestamp.getUTCMonth(),timestamp.getUTCDate()+1)/1000)-1);
 const windows=new Map(sources.map(query=>[query,scopeFor(query,end)]));
 const initial=query=>({query,start:iso(windows.get(query).start),end:iso(windows.get(query).end),page:1});
 const budget=Number.isFinite(maxRequests)?Math.max(0,Math.floor(maxRequests)):120;
 const usable=previousState?.version===1&&previousState.complete===false&&Array.isArray(previousState.queries)&&Array.isArray(previousState.pending)&&previousState.pending.every(task=>validTask(task,new Set(previousState.queries)));
 let queue,started;
 if(usable){
  const previousQueries=new Set(previousState.queries);
  // A newly configured source starts immediately, ahead of resumed deep pages.
  queue=[...sources.filter(q=>!previousQueries.has(q)).map(initial),...previousState.pending.filter(task=>sourceSet.has(task.query)).map(task=>({...task}))];
  started=previousState.cycle_started_at||timestamp.toISOString();
 }else{queue=sources.map(initial);started=timestamp.toISOString()}
 const repositories=new Map(),retry=[],errors=[];let requests=0;
 while(queue.length&&requests<budget){
  const task=queue.shift();requests++;
  const q=`${windows.get(task.query).search} created:${task.start}..${task.end}`;
  try{
   const result=await api('search/repositories?q='+encodeURIComponent(q)+'&sort=stars&order=desc&per_page='+PAGE_SIZE+'&page='+task.page);
   if(!result||!Array.isArray(result.items)||!Number.isInteger(result.total_count)||result.total_count<0)throw Error('Invalid repository search response');
   for(const repository of result.items){
    if(repository?.id==null||typeof repository.full_name!=='string'||repository.private||repository.fork)continue;
    repositories.set(String(repository.id),repository);
   }
   if(result.incomplete_results){
    errors.push(`${task.query}: GitHub returned incomplete_results; scope remains pending`);
    const attempts=(Number(task.incomplete_attempts)||0)+1;
    const smaller=attempts>1?splitTask(task):null;
    // Retry transient search timeouts once. Repeatedly incomplete scopes get
    // narrower, so one expensive search cannot remain stuck forever.
    if(smaller)queue.push(...smaller);else retry.push({...task,incomplete_attempts:attempts});
    continue;
   }
   const start=second(task.start),finish=second(task.end);
   if(result.total_count>SEARCH_LIMIT&&start<finish){
    queue.push(...splitTask(task));
    continue;
   }
   if(!result.items.length&&(task.page-1)*PAGE_SIZE<result.total_count)throw Error('Search returned an empty page before its reported result count');
   const pages=Math.ceil(Math.min(SEARCH_LIMIT,result.total_count)/PAGE_SIZE);
   if(task.page<pages)queue.push({...task,page:task.page+1});
   else if(result.total_count>SEARCH_LIMIT){
    // Even one creation second can theoretically exceed the API result cap.
    // Keep that interval visible and retryable rather than claiming coverage.
    errors.push(`${task.query}: a single-second scope exceeds GitHub's 1000-result limit`);
    retry.push({...task,page:1,limited:true});
   }
  }catch(error){errors.push(`${task.query}: ${error?.message||String(error)}`);retry.push(task)}
 }
 const pending=[...queue,...retry],pendingQueries=new Set(pending.map(task=>task.query));
 const complete=pending.length===0;
 const state={version:1,queries:sources,cycle_started_at:started,cycle_completed_at:complete?timestamp.toISOString():null,complete,pending};
 const coverage={queries:sources.length,completed_queries:sources.filter(q=>!pendingQueries.has(q)).length,pending_queries:pendingQueries.size,pending_partitions:pending.length,requests_this_run:requests,repositories_this_run:repositories.size,complete,scope:'configured repository searches, not all of GitHub'};
 return {repositories:[...repositories.values()],state,coverage,errors};
}
