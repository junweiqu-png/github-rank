import {readFileSync} from 'node:fs';
import {writeFile,rename,rm} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';

export const SAFE_GIT_BYTES=90*1024*1024;
const base='skills.json';
export function readSkills(root,{allowMissing=false}={}){
 let bytes;
 try { bytes=readFileSync(new URL(base+'.gz',root)); }
 catch(error){
  if(error.code!=='ENOENT')throw error;
  try { bytes=readFileSync(new URL(base,root)); }
  catch(error){
   if(allowMissing&&error.code==='ENOENT')return {skills:[],repositories:[]};
   throw error;
  }
  return parse(bytes);
 }
 return parse(gunzipSync(bytes));
}
function parse(bytes){
 const data=JSON.parse(bytes.toString('utf8'));
 if(!Array.isArray(data?.skills)||!Array.isArray(data?.repositories))throw Error('Invalid Skill catalog');
 return data;
}
export async function writeSkills(root,data){
 const bytes=gzipSync(Buffer.from(JSON.stringify(data)),{level:4});
 if(bytes.length>SAFE_GIT_BYTES)throw Error('Compressed Skill catalog exceeds safe Git size');
 const dest=new URL(base+'.gz',root),temp=new URL(base+'.gz.tmp',root);
 await writeFile(temp,bytes);
 await rename(temp,dest);
 await rm(new URL(base,root),{force:true});
}
