import {rank,range} from './ranking.js?v=20261116-fast';
import {domains,types,typesOf} from './catalog.js?v=20261101-unified';
import {unpackProject,unpackSkill,shardOf,FAST_SCHEMA_VERSION} from './fast-format.js';

const $=s=>document.querySelector(s);
const local=d=>new Date(d).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('zh-CN').format(n);
const pageSize=30;
const state={period:'all',date:local(new Date()),category:'all',area:'all',domain:'all',q:''};
let data=null,latest=null,editorial={},dates=[],serial=0,page=1,detailSerial=0;
let skillCoverage={},skillTotal=0,indexError=false,skillSearchPromise=null,projectSearchPromise=null;
let projectTextById=new Map(),skillTermsById=new Map();
const skillsByRepository=new Map(),shardPromises=new Map(),trendPromises=new Map();
$('#date').value=state.date;$('#date').max=state.date;

async function json(url,cache='default'){
 const response=await fetch(url,{cache});
 if(!response.ok)throw Error('无法读取数据：HTTP '+response.status);
 return response.json();
}
function fastUrl(path){return 'data/fast/'+path+'?v='+encodeURIComponent(latest?.updated_at||'1')}
function decode(payload,preview=false){
 if(payload.version!==FAST_SCHEMA_VERSION||!Array.isArray(payload.rows||payload.preview))throw Error('排行索引版本不兼容');
 const rows=(payload.rows||payload.preview).map(unpackProject);
 return {updated_at:payload.updated_at,repositories:rows,total:payload.total||rows.length,
  isPreview:preview,has_errors:!!payload.has_errors};
}
function applyEditorial(d){
 if(!d)return;
 for(const r of d.repositories){
  const copy=editorial[r.full_name.toLowerCase()];
  if(copy){r.summary=copy.summary;r.input=copy.input;r.output=copy.output}
 }
}
function attachSearchText(d){
 if(!d)return;
 for(const r of d.repositories){
  const project=projectTextById.get(r.id);
  if(project){r.description=project[1];r.topics=project[2]?project[2].split(' '):[]}
  r._skillSearch=skillTermsById.get(r.id)||'';
 }
}
function decorate(r){
 const copy=editorial[r.full_name.toLowerCase()]||{};
 return {...r,summary:copy.summary||'中文用途说明正在整理',
  input:copy.input||'待阅读项目文档核实',output:copy.output||'待阅读项目文档核实',
  basis:copy.basis||'中文说明待核实',source:copy.source||r.url,
  pending:!copy.summary,skills:skillsByRepository.get(String(r.id))||[]};
}
function sync(){
 for(const [selector,key] of [['[data-period]','period'],['[data-area]','area']]){
  document.querySelectorAll(selector).forEach(b=>{
   const active=b.dataset[key]===state[key];
   b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
  });
 }
}
function skillProgress(){
 const c=skillCoverage;
 return '技能扫描：已检查 '+(c.scanned_repositories||0)+' 个候选仓库，累计完成 '
  +(c.complete_repositories||0)+' / '+(c.candidate_repositories||0)+'；待完成 '
  +(c.pending_repositories||0)+'。已识别 '+fmt(skillTotal)+' 份 Skill 文件。'
  +(c.discovery_complete?'当前发现范围已完成。':'仓库发现与文件扫描仍在继续。');
}
function skillItemsHTML(items){
 return items.map(s=>{
  const installs=s.metrics?.installs?.value;
  return '<li class="skill-child"><a class="skill-name" href="'+escape(s.source_url)
   +'" target="_blank" rel="noopener">'+escape(s.name)+' ↗</a><p class="summary"><b>'
   +(s.translation_status==='curated'?'用途':'用途（原文）')+'</b>'
   +escape(s.summary||s.description)+'</p><p class="io"><b>输入</b>'+escape(s.input||'见技能文档')
   +'<br><b>输出</b>'+escape(s.output||'见技能文档')+'</p><p class="skill-path">'
   +escape(s.path)+'</p><p class="skill-install">skills.sh 安装量：'
   +(Number.isFinite(installs)?fmt(installs):'未接入')
   +(s.official_install_url?' · <a class="source-link" href="'+escape(s.official_install_url)
   +'" target="_blank" rel="noopener">查看平台数据 ↗</a>':'')
   +(s.stale?' · 旧观测记录':'')+'</p></li>';
 }).join('');
}
function skillPanelHTML(skills,offset=0){
 const end=Math.min(offset+60,skills.length);
 return '<p class="skill-parent-note">Skill 属于同一个 GitHub 仓库，Star 只计一次。</p>'
  +'<ul class="skill-children">'+skillItemsHTML(skills.slice(offset,end))+'</ul>'
  +(end<skills.length?'<button class="more-skills" data-offset="'+end+'">显示更多（剩余 '
    +(skills.length-end)+' 项）</button>':'');
}
function renderSkillChildren(r){
 if(data!==latest||!(r.skill_count>0))return '';
 const loaded=skillsByRepository.get(String(r.id));
 return '<details class="repository-skills" data-skill-repo="'+r.id+'"><summary>展开 '
  +fmt(r.skill_count)+' 项 Skill</summary><div class="skill-panel">'
  +(loaded?skillPanelHTML(loaded):'<p class="skill-parent-note">展开时加载该仓库的 Skill，不下载整个目录。</p>')
  +'</div></details>';
}
function renderPagination(total,pages){
 $('#pagination').innerHTML=total?'<button id="prev" '+(page===1?'disabled':'')+'>上一页</button>'
  +'<span>第 '+page+' / '+pages+' 页'+(data.isPreview?' · 加载完整榜单中':'')+'</span>'
  +'<button id="next" '+(page===pages?'disabled':'')+'>下一页</button>':'';
 $('#prev')?.addEventListener('click',()=>{page--;render();$('#board').scrollIntoView()});
 $('#next')?.addEventListener('click',()=>{page++;render();$('#board').scrollIntoView()});
}
function render(){
 if(!data)return;
 const ranked=rank(data.repositories,{...state,preSorted:true});
 const pages=Math.max(1,Math.ceil(ranked.length/pageSize));page=Math.min(page,pages);
 const [a,b]=range(state.period,state.date);
 $('.section-head h1').firstChild.textContent=state.category==='skills'?'Skills 榜 ':'已收录项目 Star 榜 ';
 $('#updated').textContent=new Date(data.updated_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
 $('#resultCount').textContent=data.isPreview?fmt(data.total)+' 个仓库（先显示前排）':fmt(ranked.length)+' 个仓库';
 $('#periodText').textContent=state.period==='all'?'全部创建时间 · 总 Star 从高到低':local(a)+' 至 '+local(b-1)+' 创建 · 按总 Star 排名';
 $('#date').disabled=state.period==='all';
 const status=$('#status');
 status.textContent=data.isPreview
  ?'已先显示前 '+fmt(data.repositories.length)+' 名，完整排行索引正在后台读取。此时搜索或筛选仅限预览，完成后自动显示全部结果。'
  :'已收录 '+fmt(data.total)+' 个公开仓库，当前不是 GitHub 全站完整榜。'
   +(state.category==='skills'?' 单项 Skill 在所属仓库下按需展开，Star 按仓库统计。':'')
   +(data!==latest?' 这是历史版本，不使用最新技能扫描结果补分类。':'')
   +(data.has_errors?' 部分数据沿用上次记录。':'');
 if(indexError&&data.isPreview)status.textContent+=' 完整索引加载失败，可点击「重试完整加载」。';
 if(state.q.trim()&&data===latest&&(!projectTextById.size||!skillTermsById.size))status.textContent+=' 完整搜索索引按需加载中，结果稍后自动补全。';
 status.className=data.has_errors?'error':'';
 $('#skill-progress').hidden=state.category!=='skills'||data!==latest;
 $('#skill-progress').textContent=skillProgress();
 const shown=ranked.slice((page-1)*pageSize,page*pageSize);
 $('#list').innerHTML=shown.length?shown.map((base,i)=>{
  const r=decorate(base);
  return '<article class="row"><span class="rank">'+((page-1)*pageSize+i+1)
   +'</span><div class="project"><button data-id="'+r.id+'">'+escape(r.full_name)
   +'</button><p class="summary"><b>用途</b>'+escape(r.summary)
   +'</p><p class="io"><b>输入</b>'+escape(r.input)+'<br><b>输出</b>'+escape(r.output)
   +'</p><span class="tag">'+escape(domains[r.domain]||'其他')+'</span>'
   +typesOf(r).map(t=>'<span class="tag">'+escape(t==='skills'?'Skills':types[t]||'项目')+'</span>').join('')
   +(r.skill_verification?'<span class="tag">'+escape(({pending:'Skill 待扫描确认',none:'当前未发现有效 Skill',verified:'Skill 已确认'})[r.skill_verification]||'')+'</span>':'')
   +renderSkillChildren(r)+(r.pending?'<span class="tag">说明待核实</span>':'')
   +(r.archived?'<span class="tag">已归档</span>':'')
   +'</div><div class="star"><span>☆</span>'+fmt(r.stars)
   +'</div><time class="created">'+local(r.created_at)+'</time></article>';
 }).join(''):'<div class="empty">当前已加载范围内没有匹配项目。请更换条件或清除搜索。<button id="reset">查看全部项目</button></div>';
 if(indexError&&data.isPreview)status.insertAdjacentHTML('beforeend',' <button id="retry-full">重试完整加载</button>');
 renderPagination(ranked.length,pages);
 $('#reset')?.addEventListener('click',()=>{Object.assign(state,{period:'all',area:'all',domain:'all',category:'all',q:''});$('#search').value='';$('#domain').value='all';$('#type').value='all';update()});
 $('#retry-full')?.addEventListener('click',loadFullIndex);
}
function update(){page=1;sync();render()}
async function ensureProjectSearch(){
 if(projectSearchPromise)return projectSearchPromise;
 projectSearchPromise=json(fastUrl('search.json')).then(payload=>{
  if(payload.version!==FAST_SCHEMA_VERSION)throw Error('项目全文索引版本不兼容');
  projectTextById=new Map(payload.rows.map(row=>[row[0],row]));
  attachSearchText(latest);render();
 }).catch(error=>{projectSearchPromise=null;console.error('Project search unavailable',error)});
 return projectSearchPromise;
}
async function ensureSkillSearch(){
 if(skillSearchPromise)return skillSearchPromise;
 skillSearchPromise=json(fastUrl('skill-search.json')).then(payload=>{
  if(payload.version!==FAST_SCHEMA_VERSION)throw Error('Skill 搜索索引版本不兼容');
  skillTermsById=new Map(payload.rows);
  attachSearchText(latest);render();
 }).catch(e=>{skillSearchPromise=null;$('#status').textContent='Skill 名称搜索暂不可用：'+e.message+'。仓库搜索仍然可用。'});
 return skillSearchPromise;
}
async function loadSkills(id){
 const key=shardOf(id);
 if(!shardPromises.has(key)){
  shardPromises.set(key,json(fastUrl('skills/'+key+'.json')).then(rows=>{
   for(const row of rows){
    const s=unpackSkill(row),key=String(s.repository_id),items=skillsByRepository.get(key)||[];
    items.push(s);skillsByRepository.set(key,items);
   }
  }).catch(e=>{shardPromises.delete(key);throw e}));
 }
 await shardPromises.get(key);
 return skillsByRepository.get(String(id))||[];
}
document.addEventListener('toggle',async event=>{
 const details=event.target;
 if(!(details instanceof HTMLDetailsElement)||!details.matches('details[data-skill-repo]')||!details.open)return;
 const panel=details.querySelector('.skill-panel');
 if(!panel)return;
 const id=Number(details.dataset.skillRepo);
 const already=skillsByRepository.get(String(id));
 if(already){panel.innerHTML=skillPanelHTML(already);return}
 panel.textContent='正在加载此仓库的 Skill…';
 try{
  const skills=await loadSkills(id);
  if(details.isConnected&&details.open)panel.innerHTML=skills.length?skillPanelHTML(skills):'<p>没有可展开的有效 Skill 文件。</p>';
 }catch(e){if(details.isConnected)panel.textContent='Skill 加载失败：'+e.message+'。收起后重新展开可重试。'}
},true);
document.addEventListener('click',event=>{
 const btn=event.target.closest('button.more-skills');
 if(!btn)return;
 const details=btn.closest('details[data-skill-repo]');
 if(!details)return;
 const items=skillsByRepository.get(details.dataset.skillRepo)||[];
 const offset=Number(btn.dataset.offset)||0;
 const ul=btn.previousElementSibling;
 ul?.insertAdjacentHTML('beforeend',skillItemsHTML(items.slice(offset,offset+60)));
 const next=offset+60;
 if(next>=items.length)btn.remove();
 else{btn.dataset.offset=next;btn.textContent='显示更多（剩余 '+(items.length-next)+' 项）'}
});
async function trendFor(id){
 const key=shardOf(id);
 if(!trendPromises.has(key))trendPromises.set(key,json(fastUrl('trend/'+key+'.json')).catch(e=>{trendPromises.delete(key);throw e}));
 const shard=await trendPromises.get(key);
 return shard[String(id)]||[];
}
$('#periods').onclick=e=>{if(e.target.dataset.period){state.period=e.target.dataset.period;update()}};
$('#areas').onclick=e=>{if(e.target.dataset.area){state.area=e.target.dataset.area;state.domain='all';$('#domain').value='all';update()}};
$('#date').onchange=e=>{if(e.target.value){state.date=e.target.value;update()}};
$('#domain').onchange=e=>{state.domain=e.target.value;state.area='all';update()};
$('#type').onchange=e=>{state.category=e.target.value;update()};
let searchTimer;
$('#search').oninput=e=>{
 state.q=e.target.value;
 clearTimeout(searchTimer);
 searchTimer=setTimeout(()=>{update();if(state.q.trim()&&data===latest){ensureProjectSearch();ensureSkillSearch()}},220);
};
$('#snapshot').onchange=async e=>{
 const key=e.target.value,token=++serial;
 if(key==='latest'){data=latest;update();return}
 $('#status').textContent='正在读取压缩后的历史索引…';
 try{
  const payload=await json(fastUrl('history/'+encodeURIComponent(key)+'.json'));
  if(token!==serial)return;
  data=decode(payload);applyEditorial(data);update();
 }catch(error){
  if(token===serial){$('#snapshot').value='latest';data=latest;update();$('#status').textContent='历史版本加载失败：'+error.message}
 }
};
$('#close').onclick=()=>{$('#dialog').close();detailSerial++};
$('#dialog').onclick=e=>{if(e.target===$('#dialog')){$('#dialog').close();detailSerial++}};
$('#rules').onclick=()=>{
 detailSerial++;
 $('#detail').innerHTML='<h2>榜单规则</h2><p>这是已收录的 GitHub 公开项目榜单，并非 GitHub 全站。所有周期按创建日期筛选，同一仓库按总 Star 排名。Skill 目录在仓库下按需展开；单个 Skill 的安装次数与仓库 Star 不能混为一谈。历史数据保留采集时的实际结果。采集未完成的仓库不会被当作已经完整验证。</p>';
 $('#dialog').showModal();
};
$('#list').onclick=async event=>{
 const button=event.target.closest('button[data-id]');
 if(!button||!data)return;
 const base=data.repositories.find(x=>String(x.id)===button.dataset.id);
 if(!base)return;
 const r=decorate(base),token=++detailSerial;
 $('#detail').innerHTML='<span class="tag">'+escape(domains[r.domain]||'其他')+'</span>'
  +'<h2>'+escape(r.full_name)+'</h2><dl class="explain"><dt>做什么</dt><dd>'+escape(r.summary)
  +'</dd><dt>输入</dt><dd>'+escape(r.input)+'</dd><dt>输出</dt><dd>'+escape(r.output)
  +'</dd></dl><p><a target="_blank" rel="noopener" href="'+escape(r.url)
  +'">GitHub 项目 / 使用文档 ↗</a></p>'+renderSkillChildren(r)
  +'<details><summary>原文与说明来源</summary><p id="detail-description">'+escape(r.description||'仓库简介按需加载中…')
  +'</p><p>'+escape(r.basis)+'</p><a target="_blank" rel="noopener" href="'+escape(r.source)
  +'">查看来源 ↗</a></details><dl><dt>仓库总 Star</dt><dd>'+fmt(r.stars)
  +'</dd><dt>创建</dt><dd>'+local(r.created_at)+'</dd><dt>最近提交</dt><dd>'
  +(r.updated_at?local(r.updated_at):'无记录')+'</dd><dt>实际采集</dt><dd>'
  +(r.observed_at?escape(new Date(r.observed_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})):'未记录')
  +'</dd></dl><h3>Star 历史</h3><div id="trend">正在读取此仓库的轻量历史数据…</div>';
 $('#dialog').showModal();
 if(data===latest&&!r.description){ensureProjectSearch().then(()=>{
  const current=latest.repositories.find(x=>x.id===r.id);
  const element=$('#detail-description');
  if(token===detailSerial&&element)element.textContent=current?.description||'仓库暂无简介';
 })}
 try{
  const points=await trendFor(r.id);
  if(token!==detailSerial||!$('#dialog').open)return;
  $('#trend').textContent=points.length<2?'正在积累记录，至少两天的数据才能展示变化。'
   :points.map(p=>p[0]+'：'+fmt(p[1])+' ★').join(' → ');
 }catch(e){if(token===detailSerial&&$('#dialog').open)$('#trend').textContent='历史数据暂不可用：'+e.message}
};
async function loadFullIndex(){
 if(!latest?.isPreview)return;
 indexError=false;
 try{
  const payload=await json(fastUrl('index.json'));
  if(payload.version!==FAST_SCHEMA_VERSION||payload.rows.length!==payload.total)throw Error('完整索引数量不符');
  const old=latest;
  const full=decode(payload);
  applyEditorial(full);attachSearchText(full);
  latest=full;
  if(data===old)data=full;
  render();
  if(state.q.trim()){ensureProjectSearch();ensureSkillSearch()}
 }catch(error){indexError=true;render();console.error('Full index unavailable',error)}
}
try{
 const boot=await json('data/fast/boot.json','no-cache');
 latest=decode(boot,true);data=latest;
 dates=boot.dates||[];skillCoverage=boot.skill_coverage||{};skillTotal=boot.skill_total||0;
 $('#snapshot').insertAdjacentHTML('beforeend',dates.map(d=>'<option value="'+escape(d)+'">'+escape(d)+' 快照</option>').join(''));
 render();
 Promise.resolve().then(loadFullIndex);
 json('data/editorial.json').then(copy=>{editorial=copy;applyEditorial(latest);if(data!==latest)applyEditorial(data);render()}).catch(()=>{});
}catch(error){
 $('#status').textContent='快速排行索引暂不可用：'+error.message;
 $('#status').className='error';
}
