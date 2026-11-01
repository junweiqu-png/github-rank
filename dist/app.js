import {rank,range} from './ranking.js?v=20261101-unified';
import {domains,types,typesOf,repositoryView} from './catalog.js?v=20261101-unified';

const $=s=>document.querySelector(s);
const local=d=>new Date(d).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('zh-CN').format(n);
let data,latest,editorial={},dates=[],serial=0,page=1,detailSerial=0,skillCatalog={skills:[],repositories:[],coverage:{},errors:[]};
const skillsByRepository=new Map(),scansByRepository=new Map();
const pageSize=30,state={period:'all',date:local(new Date()),category:'all',area:'all',domain:'all',q:''};
$('#date').value=state.date;$('#date').max=state.date;
async function json(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('数据暂不可用');return r.json()}
function indexSkillData(){
 skillsByRepository.clear();scansByRepository.clear();
 for(const skill of skillCatalog.skills||[]){if(skill.repository_id==null)continue;const key=String(skill.repository_id);if(!skillsByRepository.has(key))skillsByRepository.set(key,[]);skillsByRepository.get(key).push(skill)}
 for(const scan of skillCatalog.repositories||[]){const id=scan.id??scan.repository_id;if(id!=null)scansByRepository.set(String(id),scan)}
}
function decorate(r,source=data){const current=source===latest,key=String(r.id),scan=current?scansByRepository.get(key):null;return repositoryView(r,{editorial,skills:current?skillsByRepository.get(key)||[]:[],scans:scan?[scan]:[],includeSkills:current})}
function skillVerificationTag(r){const labels={pending:'Skill 待扫描确认',none:'当前未发现有效 Skill',verified:'Skill 已确认'};return labels[r.skill_verification]?`<span class="tag" data-skill-verification="${escape(r.skill_verification)}">${labels[r.skill_verification]}</span>`:''}
function sync(){for(const [selector,key] of [['[data-period]','period'],['[data-area]','area']])document.querySelectorAll(selector).forEach(b=>{const active=b.dataset[key]===state[key];b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});}
function update(){page=1;sync();render()}
function skillProgress(){
 const coverage=skillCatalog.coverage||{},scans=skillCatalog.repositories||[];
 if(!coverage.candidate_repositories&&!scans.length&&skillCatalog.errors?.length)return '技能扫描数据暂不可用，仓库榜仍可浏览。';
 const candidates=coverage.candidate_repositories??0,scanned=coverage.scanned_repositories??scans.length;
 const complete=coverage.complete_repositories??scans.filter(r=>r.complete).length;
 const pending=coverage.pending_repositories??Math.max(candidates-complete,0);
 const failed=coverage.failed_repositories??scans.filter(r=>!r.complete).length;
 return `技能扫描：已检查 ${scanned} 个候选仓库，累计完成 ${complete} / ${candidates}；待完成 ${pending}${failed?'，'+failed+' 个扫描未完成或失败':''}。已识别 ${skillCatalog.skills.length} 份 Skill 文件，均归入所属仓库。${coverage.discovery_complete===true?'已完成当前发现范围的检索。':'仓库发现与文件扫描仍在继续，当前不是全站完整索引。'}`;
}
function renderSkillChildren(r){
 if(!r.skills?.length)return '';
 const term=state.q.trim().toLowerCase(),match=term&&r.skills.some(s=>`${s.name} ${s.description||''} ${s.summary||''}`.toLowerCase().includes(term));
 return `<details class="repository-skills"${match?' open':''}><summary>展开 ${r.skills.length} 项 Skill</summary><p class="skill-parent-note">以下 Skill 均属于 ${escape(r.full_name)}，仓库 Star 只在上方计一次。</p><ul class="skill-children" aria-label="${escape(r.full_name)} 内的 Skill">${r.skills.map(s=>{
  const installs=s.metrics?.installs?.value;
  return `<li class="skill-child"><a class="skill-name" href="${escape(s.source_url)}" target="_blank" rel="noopener">${escape(s.name)} ↗</a><p class="summary"><b>${s.translation_status==='curated'?'用途':'用途（原文）'}</b>${escape(s.summary||s.description)}</p><p class="io"><b>输入</b>${escape(s.input||'见技能文档')}<br><b>输出</b>${escape(s.output||'见技能文档')}</p><p class="skill-path">${escape(s.path)}</p><p class="skill-install">skills.sh 安装量：${Number.isFinite(installs)?fmt(installs):'未接入'}${s.official_install_url?` · <a class="source-link" href="${escape(s.official_install_url)}" target="_blank" rel="noopener">查看平台数据 ↗</a>`:''}${s.stale?' · 旧观测记录':''}</p></li>`;
 }).join('')}</ul></details>`;
}
function renderPagination(total,pages){$('#pagination').innerHTML=total?`<button id="prev" ${page===1?'disabled':''}>上一页</button><span>第 ${page} / ${pages} 页</span><button id="next" ${page===pages?'disabled':''}>下一页</button>`:'';$('#prev')?.addEventListener('click',()=>{page--;render();$('#board').scrollIntoView()});$('#next')?.addEventListener('click',()=>{page++;render();$('#board').scrollIntoView()})}
function render(){
 if(data)$('#updated').textContent=new Date(data.updated_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});

 if(!data)return;
 const repositories=data.repositories.map(r=>decorate(r)),rows=rank(repositories,state),pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.min(page,pages);
 const [a,b]=range(state.period,state.date);
 $('.section-head h1').firstChild.textContent=state.category==='skills'?'Skills 榜 ':'已收录项目 Star 榜 ';
 $('#updated').textContent=new Date(data.updated_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
 $('#resultCount').textContent=`${rows.length} 个仓库`;
 $('#periodText').textContent=state.period==='all'?'全部创建时间 · 总 Star 从高到低':`${local(a)} 至 ${local(b-1)} 创建 · 按总 Star 排名`;
 $('#date').disabled=state.period==='all';
 $('#status').textContent=`已收录 ${data.repositories.length} 个公开仓库，尚非 GitHub 全量榜。${state.category==='skills'?' 单项 Skill 仓库与 Skill 合集统一在此排名；具体 Skill 在所属仓库内展开，Star 按仓库统计；待扫描候选不计入 Skills 榜。':''}${data!==latest?' 历史版本保留当时类型，不使用当前技能扫描结果补分类。':''}${data.errors?.length?' 部分数据沿用上次记录。':''}`;
 $('#skill-progress').hidden=state.category!=='skills'||data!==latest;
 $('#skill-progress').textContent=skillProgress();
 $('#status').className=data.errors?.length?'error':'';
 const shown=rows.slice((page-1)*pageSize,page*pageSize);
 $('#list').innerHTML=shown.length?shown.map((r,i)=>`<article class="row"><span class="rank">${(page-1)*pageSize+i+1}</span><div class="project"><button data-id="${r.id}">${escape(r.full_name)}</button><p class="summary"><b>用途</b>${escape(r.summary)}</p><p class="io"><b>输入</b>${escape(r.input)}<br><b>输出</b>${escape(r.output)}</p><span class="tag">${escape(domains[r.domain]||'其他')}</span>${typesOf(r).map(t=>`<span class="tag">${escape(t==='skills'?'Skills':types[t]||'项目')}</span>`).join('')}${skillVerificationTag(r)}${renderSkillChildren(r)}${r.pending?'<span class="tag">说明待核实</span>':''}${r.archived?'<span class="tag">已归档</span>':''}</div><div class="star"><span>☆</span>${fmt(r.stars)}</div><time class="created">${local(r.created_at)}</time></article>`).join(''):'<div class="empty">当前收录范围内没有匹配的项目。<br>可切换周期、领域或清除搜索条件。<br><button id="reset">查看全部项目</button></div>';
 renderPagination(rows.length,pages);
 $('#reset')?.addEventListener('click',()=>{Object.assign(state,{period:'all',area:'all',domain:'all',category:'all',q:''});$('#search').value='';$('#domain').value='all';$('#type').value='all';update()});
}
$('#periods').onclick=e=>{if(e.target.dataset.period){state.period=e.target.dataset.period;update()}};
$('#areas').onclick=e=>{if(e.target.dataset.area){state.area=e.target.dataset.area;state.domain='all';$('#domain').value='all';update()}};
$('#date').onchange=e=>{if(e.target.value){state.date=e.target.value;update()}};
$('#domain').onchange=e=>{state.domain=e.target.value;state.area='all';update()};
$('#type').onchange=e=>{state.category=e.target.value;update()};
$('#search').oninput=e=>{state.q=e.target.value;update()};
$('#snapshot').onchange=async e=>{const token=++serial;$('#status').textContent='正在读取快照…';try{const next=e.target.value==='latest'?latest:await json(`data/history/${e.target.value}.json`);if(token===serial){data=next;update()}}catch{if(token===serial){$('#snapshot').value='latest';data=latest;update();$('#status').textContent='历史快照读取失败，已恢复最新数据。'}}};
$('#close').onclick=()=>{$('#dialog').close();detailSerial++};$('#dialog').onclick=e=>{if(e.target===$('#dialog')){$('#dialog').close();detailSerial++}};
$('#rules').onclick=()=>{detailSerial++;$('#detail').innerHTML='<h2>榜单规则</h2><p>范围为 GitHub 各领域公开项目，包括 AI、开发工具、网站、数据、运维、效率、影音、学习与游戏。当前榜单依据已收录仓库，不代表已收录 GitHub 全站。</p><ul><li>GitHub Star（星标数）属于整个仓库。单项 Skill 仓库和 Skill 合集均进入 Skills 分类，每个仓库只排名一次；仓库内的具体 Skill 在该仓库下展开。skills.sh 安装量尚未接入。</li><li>累计榜包含全部创建时间；年、季度、月、周、日榜仅包含对应期间创建的仓库。</li><li>统一按数据版本中的总 Star 排名，同分按仓库名排序。北京时间、周一开周。</li><li>中文说明依据仓库公开介绍整理，输入输出描述典型使用方式。详情可查看原文；信息不足时明确标注待核实。</li><li>AI 与其他领域分开筛选。仓库名、主题或关键词命中只产生待扫描候选；扫描发现合法 Skill 文件后才确认 Skills 分类。应用或插件也可同时提供 Skill。扫描未完成时不据此断言没有 Skill。</li><li>不收录私有仓库与 Fork；同一个仓库只计一次。</li><li>历史快照保存采集时的数据。旧快照没有后来收录的项目，上线前快照不补造。</li><li>每个项目保留自己的实际采集时间；请求失败时沿用原记录。</li></ul>';$('#dialog').showModal()};
$('#list').onclick=async e=>{
 const button=e.target.closest('[data-id]');if(!button)return;
 const record=data.repositories.find(x=>String(x.id)===button.dataset.id);if(!record)return;
 const r=decorate(record),token=++detailSerial;
 $('#detail').innerHTML=`<span class="tag">${escape(domains[r.domain])}</span><h2>${escape(r.full_name)}</h2><dl class="explain"><dt>做什么</dt><dd>${escape(r.summary)}</dd><dt>输入</dt><dd>${escape(r.input)}</dd><dt>输出</dt><dd>${escape(r.output)}</dd></dl><p><a target="_blank" rel="noopener" href="${escape(r.url)}">GitHub 项目 / 使用文档 ↗</a></p>${renderSkillChildren(r)}<details><summary>原文与说明来源</summary><p>${escape(r.description||'仓库暂无简介')}</p><p>${escape(r.basis||'中文说明待核实')}</p><a target="_blank" rel="noopener" href="${escape(r.source||r.url)}">查看来源 ↗</a></details><dl><dt>仓库总 Star</dt><dd>${fmt(r.stars)}</dd><dt>创建</dt><dd>${local(r.created_at)}</dd><dt>最近提交</dt><dd>${r.updated_at?local(r.updated_at):'无记录'}</dd><dt>实际采集</dt><dd>${escape(new Date(r.observed_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}))}</dd></dl><h3>Star 历史</h3><div id="trend">正在读取…</div>`;
 $('#dialog').showModal();const points=(await Promise.all(dates.slice(0,30).reverse().map(async day=>{try{const d=await json(`data/history/${day}.json`);const item=d.repositories.find(x=>x.id===r.id);return item?{day,stars:item.stars}:null}catch{return null}}))).filter(Boolean);
 if(token!==detailSerial||!$('#dialog').open)return;$('#trend').textContent=points.length<2?'正在积累记录，至少两天的数据才能展示变化。':points.map(p=>`${p.day}：${fmt(p.stars)} ★`).join(' → ');
};
try{[data,editorial,skillCatalog]=await Promise.all([json('data/latest.json'),json('data/editorial.json'),json('data/skills.json').catch(()=>({skills:[],repositories:[],coverage:{},errors:['技能扫描数据暂不可用']}))]);latest=data;indexSkillData();try{dates=await json('data/history/index.json');$('#snapshot').insertAdjacentHTML('beforeend',dates.map(d=>`<option value="${escape(d)}">${escape(d)} 快照</option>`).join(''))}catch{}sync();render()}catch{$('#status').textContent='数据暂时无法加载，请稍后刷新。';$('#status').className='error'}


