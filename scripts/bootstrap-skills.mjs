// Optional first-run bootstrap, using the same scanner as the scheduled pipeline.
import {readFile} from 'node:fs/promises';
import {collectSkills} from './collect-skills.mjs';
const headers={'User-Agent':'GitHubAtlas','Accept':'application/vnd.github+json',...(process.env.GITHUB_TOKEN?{Authorization:'Bearer '+process.env.GITHUB_TOKEN}:{})};
let limited=false;
async function api(path){if(limited)throw Error('API 配额已用完');const r=await fetch('https://api.github.com/'+path,{headers,signal:AbortSignal.timeout(15000)});if(!r.ok){if(r.status===403||r.status===429)limited=true;throw Error('GitHub '+r.status+': '+path)}return r.json()}
const sources=JSON.parse(await readFile(new URL('skill-sources.json',import.meta.url),'utf8'));
const repositories=[];for(const name of sources.repositories){const r=await api('repos/'+name);repositories.push({id:r.id,full_name:r.full_name,stars:r.stargazers_count,category:'skills',default_branch:r.default_branch})}
await collectSkills({api,repositories,limit:4,maxFileReads:45});
