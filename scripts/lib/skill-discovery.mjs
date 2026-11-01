import {parseDocument} from 'yaml';

const MAX_TREE_REQUESTS=512;
const MAX_SKILL_FILES=2000;
const MAX_SOURCE_CHARS=1024*1024;
const MAX_FRONTMATTER_CHARS=64*1024;

function validPath(path){
 return typeof path==='string'&&path.length>0&&!path.startsWith('/')&&!path.includes('\\')&&!path.split('/').some(p=>p==='.'||p==='..'||p==='');
}

function validMetadata(fields){
 if(!fields||typeof fields!=='object'||Array.isArray(fields))return null;
 if(typeof fields.name!=='string'||typeof fields.description!=='string')return null;
 const name=fields.name.trim(),description=fields.description.trim();
 if(name.length<1||name.length>64||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name))return null;
 if(description.length<1||description.length>1024)return null;
 return {name,description};
}

function metadata(source){
 if(typeof source!=='string')throw Error('File reader returned non-text content');
 if(source.length>MAX_SOURCE_CHARS)throw Error('SKILL.md exceeds the text size budget');
 const text=source.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n');
 if(!/^---[ \t]*\n/.test(text))return null;
 const lines=text.split('\n');
 const end=lines.findIndex((line,index)=>index>0&&/^---[ \t]*$/.test(line));
 if(end<0)return null;
 const frontmatter=lines.slice(1,end).join('\n');
 if(frontmatter.length>MAX_FRONTMATTER_CHARS)throw Error('SKILL.md frontmatter exceeds the size budget');
 // Core YAML has no executable custom tags. Reject aliases and parse warnings
 // rather than interpreting untrusted metadata in an application-specific way.
 const doc=parseDocument(frontmatter,{schema:'core',strict:true,uniqueKeys:true});
 if(doc.errors.length||doc.warnings.length)return null;
 let fields;
 try{fields=doc.toJS({maxAliasCount:0})}catch{return null}
 return validMetadata(fields);
}

/**
 * Discover skills through repository files, never through a list of known names.
 * getTree(repo, ref, recursive) returns a GitHub Git Tree response.
 * getText(repo, path, ref) returns the UTF-8 file text at that revision.
 * previousSkills must contain the previous observations for this repository.
 * An incomplete scan may add or refresh records, but never deletes old records.
 */
export async function discoverRepositorySkills(repo,{getTree,getText,maxFileReads=MAX_SKILL_FILES,maxTreeRequests=MAX_TREE_REQUESTS,concurrency=6,deferredPaths=new Set()},previousSkills=[],previousScan={}){
 const errors=[],files=new Map(),fresh=new Map(),pendingTrees=[];
 const old=Array.isArray(previousSkills)?previousSkills:[];
 const ref=repo.commit_sha||repo.default_branch||'main';
 const observedAt=repo.observed_at||new Date().toISOString();
 let treeRequests=0;
 const previousByPath=new Map(old.filter(s=>typeof s.path==='string').map(s=>[s.path,s]));

 function addEntries(tree,prefix=''){
  for(const entry of tree.tree){
   const path=prefix+entry.path;
   if(entry.type!=='blob'||entry.mode==='120000'||!/(^|\/)SKILL\.md$/.test(path))continue;
   if(!validPath(path)){errors.push('Rejected invalid SKILL.md path');continue}
   const existing=files.get(path);
   if(existing&&existing.sha!==entry.sha){errors.push('Conflicting tree entries: '+path);continue}
   files.set(path,{...entry,path});
  }
 }

 async function readTree(treeRef,recursive){
  if(++treeRequests>maxTreeRequests)throw Error('Git tree request budget exceeded');
  const result=await getTree(repo,treeRef,recursive);
  if(!result||!Array.isArray(result.tree))throw Error('Invalid Git tree response');
  return result;
 }

 try{
  if(repo.id===undefined||typeof repo.full_name!=='string')throw Error('Repository id and full_name are required');
  const sameRevision=previousScan.commit_sha===ref&&Array.isArray(previousScan.inventory);
  const resumeTrees=sameRevision&&previousScan.pending_trees?.length;
  const cachedInventory=sameRevision&&previousScan.inventory_complete;
  const recursive=cachedInventory||resumeTrees?{tree:previousScan.inventory,truncated:!!resumeTrees}:await readTree(ref,true);
  addEntries(recursive);
  if(recursive.truncated===true){
   if(!resumeTrees)files.clear();
   // A recursive Git Tree is not paginated. Re-fetch each non-recursive tree
   // so a truncated list cannot silently be treated as the complete inventory.
   const queue=resumeTrees?previousScan.pending_trees.map(t=>({...t,ancestors:new Set(t.ancestors||[])})):[{ref,prefix:'',ancestors:new Set()}];
   for(let cursor=0;cursor<queue.length;cursor++){
    const current=queue[cursor];
    if(treeRequests>=maxTreeRequests){pendingTrees.push(...queue.slice(cursor).map(t=>({...t,ancestors:[...t.ancestors]})));errors.push('Git tree request budget exceeded; subtree queue saved');break}
    try{
     const tree=await readTree(current.ref,false);
     addEntries(tree,current.prefix);
     if(tree.truncated===true)errors.push('Non-recursive tree is truncated: '+(current.prefix||'/'));
     const ancestors=new Set(current.ancestors);ancestors.add(current.ref);
     for(const entry of tree.tree){
      if(entry.type!=='tree')continue;
      const path=current.prefix+entry.path;
      if(!validPath(path)||typeof entry.sha!=='string'||ancestors.has(entry.sha)){errors.push('Invalid or cyclic subtree: '+path);continue}
      queue.push({ref:entry.sha,prefix:path+'/',ancestors});
     }
    }catch(error){
     errors.push('Tree scan failed at '+(current.prefix||'/')+': '+error.message);
     pendingTrees.push({...current,ancestors:[...current.ancestors]});
     if(treeRequests>=maxTreeRequests){pendingTrees.push(...queue.slice(cursor+1).map(t=>({...t,ancestors:[...t.ancestors]})));break}
    }
   }
  }
 }catch(error){errors.push('Repository tree scan failed: '+error.message)}

 const inventoryComplete=errors.length===0;
 const invalidByPath=new Map((previousScan.file_states||[]).filter(s=>s.status==='invalid').map(s=>[s.path,s]));
 const fileStates=[];let fileReads=0,pending=0;
 async function processFile(entry){
  try{
   const previous=previousByPath.get(entry.path);
   const cached=typeof entry.sha==='string'&&entry.sha.length>0&&previous?.blob_sha===entry.sha?validMetadata(previous):null;
   if(!cached&&deferredPaths.has(entry.path)){pending++;errors.push('SKILL.md deferred after an earlier read failure: '+entry.path);return}
   const invalid=invalidByPath.get(entry.path);
   if(!cached&&entry.sha&&invalid?.blob_sha===entry.sha){fileStates.push(invalid);return}
   if(!cached&&fileReads>=maxFileReads){pending++;return}
   if(!cached)fileReads++;
   const fields=cached||metadata(await getText(repo,entry.path,ref));
   if(!fields){fileStates.push({path:entry.path,blob_sha:entry.sha,status:'invalid'});return}
   const sourceUrl='https://github.com/'+repo.full_name+'/blob/'+encodeURIComponent(ref)+'/'+entry.path.split('/').map(encodeURIComponent).join('/');
   fresh.set(entry.path,{
    id:String(repo.id)+':'+entry.path,
    repository_id:repo.id,
    repository:repo.full_name,
    path:entry.path,
    directory:entry.path==='SKILL.md'?'':entry.path.slice(0,-'/SKILL.md'.length),
    blob_sha:entry.sha||null,
    revision:ref,
    name:fields.name,
    description:fields.description,
    source_url:sourceUrl,
    repository_url:'https://github.com/'+repo.full_name,
    observed_at:observedAt,
    first_seen_at:previous?.first_seen_at||previous?.observed_at||observedAt,
    stale:false,
   });
  }catch(error){pending++;errors.push('SKILL.md read failed at '+entry.path+': '+error.message)}
 }
 const entries=[...files.values()].sort((a,b)=>a.path.localeCompare(b.path));let cursor=0;
 await Promise.all(Array.from({length:Math.max(1,Math.min(12,concurrency))},async()=>{while(cursor<entries.length)await processFile(entries[cursor++])}));
 if(pending&&fileReads>=maxFileReads)errors.push('Metadata file budget reached; '+pending+' files remain in the checkpoint');
 const complete=inventoryComplete&&pending===0&&errors.length===0;
 if(!complete){
  for(const previous of old){
   if(typeof previous.path==='string'&&!fresh.has(previous.path))fresh.set(previous.path,{...previous,stale:true});
  }
 }
 return {skills:[...fresh.values()].sort((a,b)=>a.path.localeCompare(b.path)),complete,errors,commit_sha:ref,inventory_complete:inventoryComplete,inventory:[...files.values()].map(e=>({path:e.path,sha:e.sha,type:'blob',mode:e.mode||'100644'})),pending_trees:pendingTrees,file_states:fileStates,metadata_pending:pending,file_reads:fileReads};
}
