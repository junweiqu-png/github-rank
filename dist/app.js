import {rank,range} from './ranking.js';
import {domains,types,typesOf,repositoryView} from './catalog.js';
import {skillsInRepository,searchSkills,sortSkills} from './skills.js';
const $=s=>document.querySelector(s);
const local=d=>new Date(d).toLocaleDateString('sv-SE',{timeZone:'Asia/Shanghai'});
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>new Intl.NumberFormat('zh-CN').format(n);
let data,latest,editorial={},dates=[],serial=0,page=1,detailSerial=0,view='repositories',skillRepository=null,skillCatalog={skills:[],coverage:{},errors:[]};
const pageSize=30,state={period:'all',date:local(new Date()),category:'all',area:'all',domain:'all',q:''};
$('#date').value=state.date;$('#date').max=state.date;
async function json(url){const r=await fetch(url,{cache:'no-cache'});if(!r.ok)throw Error('数据暂不可用');return r.json()}
function decorate(r,source=data){return repositoryView(r,{editorial,skills:skillCatalog.skills,includeSkills:source===latest})}
function expandSkills(id){const repository=latest.repositories.find(r=>String(r.id)===String(id));if(!repository)return;skillRepository=repository;view='skills';state.q='';$('#search').value='';$('#dialog').close();update();$('#board').scrollIntoView()}
function sync(){for(const [selector,key] of [['[data-period]','period'],['[data-area]','area']])document.querySelectorAll(selector).forEach(b=>{const active=b.dataset[key]===state[key];b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});}
function update(){page=1;sync();render()}
function syncView(){
 document.querySelectorAll('[data-view]').forEach(b=>{const active=b.dataset.view===view;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 $('#repository-controls').hidden=view==='skills';$('#skill-controls').hidden=view!=='skills';$('#board').classList.toggle('skills-view',view==='skills');
 const title=$('.section-head h1');title.firstChild.textContent=view==='skills'?'单项 Skill 目录 ':'已收录项目 Star 榜 ';
 const headers=document.querySelectorAll('.table-head span');headers[0].textContent=view==='skills'?'自动发现的技能 / 用途与来源':'排名 / 项目 · 中文用途与输入输出';headers[1].textContent=view==='skills'?'安装量（skills.sh）':'仓库总 STAR';headers[2].textContent='仓库创建日期';
}
function renderSkills(){
 const catalog=skillRepository?skillsInRepository(skillRepository,skillCatalog.skills):skillCatalog.skills;
 const rows=sortSkills(searchSkills(state.q,catalog),$('#skill-sort').value),pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.min(page,pages);$('#resultCount').textContent=`${rows.length} 项 Skill`;
 $('#skill-scope').hidden=!skillRepository;$('#skill-scope').innerHTML=skillRepository?`正在展开 ${escape(skillRepository.full_name)} · 已收录 ${catalog.length} 项 Skill <button id="clear-skill-scope">查看全部 Skill</button>`:'';
 $('#clear-skill-scope')?.addEventListener('click',()=>{skillRepository=null;state.q='';$('#search').value='';update()});
 if(skillCatalog.updated_at)$('#updated').textContent=new Date(skillCatalog.updated_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
 const parents=new Set(skillCatalog.skills.map(s=>String(s.repository_id))),coverage=skillCatalog.coverage;$('#status').textContent=`当前目录收录 ${parents.size} 个仓库内的 ${skillCatalog.skills.length} 份 Skill 文件。本轮完成 ${coverage.complete_this_run||0} / ${coverage.candidate_repositories||0} 个候选仓库扫描；尚非全站。${skillCatalog.errors.length?' 部分扫描未完成，旧记录已保留并标注。':''}`;$('#status').className=skillCatalog.errors.length?'error':'';
 $('#list').innerHTML=rows.length?rows.slice((page-1)*pageSize,page*pageSize).map(s=>`<article class="row"><span class="rank">·</span><div class="project"><a class="skill-name" target="_blank" rel="noopener" href="${escape(s.source_url)}">${escape(s.name)} ↗</a><p class="summary"><b>${s.translation_status==='curated'?'用途':'用途（原文）'}</b>${escape(s.summary||s.description)}</p><p class="io"><b>输入</b>${escape(s.input||'见技能文档')}<br><b>输出</b>${escape(s.output||'见技能文档')}</p><p>所属仓库：<button class="related-link" data-parent-repository="${escape(s.repository_id)}">${escape(s.repository)}</button> <a class="source-link" href="${escape(s.repository_url)}" target="_blank" rel="noopener">GitHub ↗</a><br><span class="skill-path">${escape(s.path)}</span></p>${s.stale?'<span class="tag">旧观测记录</span>':''}<p>观测：${escape(local(s.observed_at))}</p></div><div class="star"><span class="missing-metric">— 未接入</span>${s.official_install_url?`<br><a class="source-link" href="${escape(s.official_install_url)}" target="_blank" rel="noopener">查看平台数据 ↗</a>`:''}</div></article>`).join(''):'<div class="empty">已扫描的技能中没有匹配项。新仓库会分批扫描，扫描失败不表示仓库没有技能。</div>';
 renderPagination(rows.length,pages);
}
function renderPagination(total,pages){$('#pagination').innerHTML=total?`<button id="prev" ${page===1?'disabled':''}>上一页</button><span>第 ${page} / ${pages} 页</span><button id="next" ${page===pages?'disabled':''}>下一页</button>`:'';$('#prev')?.addEventListener('click',()=>{page--;render();$('#board').scrollIntoView()});$('#next')?.addEventListener('click',()=>{page++;render();$('#board').scrollIntoView()})}
function render(){
 if(data)$('#updated').textContent=new Date(data.updated_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
 syncView();if(view==='skills'){renderSkills();return}
 if(!data)return;
 const repositories=data.repositories.map(r=>decorate(r)),rows=rank(repositories,state),pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.min(page,pages);
 const [a,b]=range(state.period,state.date);
 $('#updated').textContent=new Date(data.updated_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'});
 $('#resultCount').textContent=`${rows.length} 个项目`;
 $('#periodText').textContent=state.period==='all'?'全部创建时间 · 总 Star 从高到低':`${local(a)} 至 ${local(b-1)} 创建 · 按总 Star 排名`;
 $('#date').disabled=state.period==='all';
 $('#status').textContent=`已收录 ${data.repositories.length} 个公开仓库，尚非 GitHub 全量榜。${state.category==='skills'?' 每项是一个仓库，包含单项 Skill 仓库、Skill 合集或相关工具；一个仓库可同时属于多种类型。点击“展开”查看其中已收录的 Skill，尚未展开不表示没有 Skill。':''}${data!==latest?' 历史版本保留当时类型，不用当前技能扫描结果补分类。':''}${data.errors?.length?' 部分数据沿用上次记录。':''}`;
 $('#status').className=data.errors?.length?'error':'';
 const shown=rows.slice((page-1)*pageSize,page*pageSize);
 $('#list').innerHTML=shown.length?shown.map((r,i)=>`<article class="row"><span class="rank">${(page-1)*pageSize+i+1}</span><div class="project"><button data-id="${r.id}">${escape(r.full_name)}</button><p class="summary"><b>用途</b>${escape(r.summary)}</p><p class="io"><b>输入</b>${escape(r.input)}<br><b>输出</b>${escape(r.output)}</p><span class="tag">${escape(domains[r.domain]||'其他')}</span>${typesOf(r).map(t=>`<span class="tag">${escape(types[t]||'项目')}</span>`).join('')}${r.skill_count?` <button class="related-link" data-expand-skills="${r.id}">展开 ${r.skill_count} 项 Skill →</button>`:''}${r.pending?'<span class="tag">说明待核实</span>':''}${r.archived?'<span class="tag">已归档</span>':''}</div><div class="star"><span>☆</span>${fmt(r.stars)}</div><time class="created">${local(r.created_at)}</time></article>`).join(''):'<div class="empty">当前收录范围内没有匹配的项目。<br>可切换周期、领域或清除搜索条件。<br><button id="reset">查看全部项目</button></div>';
 $('#pagination').innerHTML=rows.length?`<button id="prev" ${page===1?'disabled':''}>上一页</button><span>第 ${page} / ${pages} 页</span><button id="next" ${page===pages?'disabled':''}>下一页</button>`:'';
 $('#prev')?.addEventListener('click',()=>{page--;render();$('#board').scrollIntoView()});$('#next')?.addEventListener('click',()=>{page++;render();$('#board').scrollIntoView()});
 $('#reset')?.addEventListener('click',()=>{Object.assign(state,{period:'all',area:'all',domain:'all',category:'all',q:''});$('#search').value='';$('#domain').value='all';$('#type').value='all';update()});
}
$('#periods').onclick=e=>{if(e.target.dataset.period){state.period=e.target.dataset.period;update()}};
$('#views').onclick=e=>{if(e.target.dataset.view){view=e.target.dataset.view;skillRepository=null;state.q='';$('#search').value='';update()}};
$('#areas').onclick=e=>{if(e.target.dataset.area){state.area=e.target.dataset.area;state.domain='all';$('#domain').value='all';update()}};
$('#date').onchange=e=>{if(e.target.value){state.date=e.target.value;update()}};
$('#domain').onchange=e=>{state.domain=e.target.value;state.area='all';update()};
$('#type').onchange=e=>{state.category=e.target.value;update()};
$('#search').oninput=e=>{state.q=e.target.value;update()};
$('#skill-sort').onchange=()=>update();
$('#snapshot').onchange=async e=>{const token=++serial;$('#status').textContent='正在读取快照…';try{const next=e.target.value==='latest'?latest:await json(`data/history/${e.target.value}.json`);if(token===serial){data=next;update()}}catch{if(token===serial){$('#snapshot').value='latest';data=latest;update();$('#status').textContent='历史快照读取失败，已恢复最新数据。'}}};
$('#close').onclick=()=>{$('#dialog').close();detailSerial++};$('#dialog').onclick=e=>{if(e.target===$('#dialog')){$('#dialog').close();detailSerial++}};
$('#rules').onclick=()=>{detailSerial++;$('#detail').innerHTML='<h2>榜单规则</h2><p>范围为 GitHub 各领域公开项目，包括 AI、开发工具、网站、数据、运维、效率、影音、学习与游戏。当前榜单依据已收录仓库，不代表已收录 GitHub 全站。</p><ul><li>GitHub Star（星标数）属于整个仓库。项目榜每项是仓库；单项 Skill 目录每项是一份 Skill 文件，一个仓库可有多项。skills.sh 安装量尚未接入。</li><li>累计榜包含全部创建时间；年、季度、月、周、日榜仅包含对应期间创建的仓库。</li><li>统一按数据版本中的总 Star 排名，同分按仓库名排序。北京时间、周一开周。</li><li>中文说明依据仓库公开介绍整理，输入输出描述典型使用方式。详情可查看原文；信息不足时明确标注待核实。</li><li>AI 与其他领域分开筛选。类型可重叠：提供 Skill 的应用或插件也会进入 Skill 相关仓库；原有相关分类还包括合集与工具。单项目录仅展示已扫描并识别的 Skill，缺记录不代表没有。</li><li>不收录私有仓库与 Fork；同一个仓库只计一次。</li><li>历史快照保存采集时的数据。旧快照没有后来收录的项目，上线前快照不补造。</li><li>每个项目保留自己的实际采集时间；请求失败时沿用原记录。</li></ul>';$('#dialog').showModal()};
$('#list').onclick=async e=>{
 const expand=e.target.closest('[data-expand-skills]');if(expand){expandSkills(expand.dataset.expandSkills);return}
 const parent=e.target.closest('[data-parent-repository]'),button=e.target.closest('[data-id]');if(!parent&&!button)return;
 const source=parent?latest:data,id=parent?.dataset.parentRepository||button?.dataset.id,record=source.repositories.find(x=>String(x.id)===id);if(!record)return;
 const r=decorate(record,source),token=++detailSerial;
 $('#detail').innerHTML=`<span class="tag">${escape(domains[r.domain])}</span><h2>${escape(r.full_name)}</h2><dl class="explain"><dt>做什么</dt><dd>${escape(r.summary)}</dd><dt>输入</dt><dd>${escape(r.input)}</dd><dt>输出</dt><dd>${escape(r.output)}</dd></dl><p><a target="_blank" rel="noopener" href="${escape(r.url)}">GitHub 项目 / 使用文档 ↗</a></p><details><summary>原文与说明来源</summary><p>${escape(r.description||'仓库暂无简介')}</p><p>${escape(r.basis||'中文说明待核实')}</p><a target="_blank" rel="noopener" href="${escape(r.source||r.url)}">查看来源 ↗</a></details><dl><dt>仓库总 Star</dt><dd>${fmt(r.stars)}</dd><dt>创建</dt><dd>${local(r.created_at)}</dd><dt>最近提交</dt><dd>${r.updated_at?local(r.updated_at):'无记录'}</dd><dt>实际采集</dt><dd>${escape(new Date(r.observed_at).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}))}</dd></dl><h3>Star 历史</h3><div id="trend">正在读取…</div>`;
 $('#dialog').showModal();const points=(await Promise.all(dates.slice(0,30).reverse().map(async day=>{try{const d=await json(`data/history/${day}.json`);const item=d.repositories.find(x=>x.id===r.id);return item?{day,stars:item.stars}:null}catch{return null}}))).filter(Boolean);
 if(token!==detailSerial||!$('#dialog').open)return;$('#trend').textContent=points.length<2?'正在积累记录，至少两天的数据才能展示变化。':points.map(p=>`${p.day}：${fmt(p.stars)} ★`).join(' → ');
};
try{[data,editorial,skillCatalog]=await Promise.all([json('data/latest.json'),json('data/editorial.json'),json('data/skills.json').catch(()=>({skills:[],coverage:{},errors:['技能目录暂不可用']}))]);latest=data;try{dates=await json('data/history/index.json');$('#snapshot').insertAdjacentHTML('beforeend',dates.map(d=>`<option value="${escape(d)}">${escape(d)} 快照</option>`).join(''))}catch{}sync();render()}catch{$('#status').textContent='数据暂时无法加载，请稍后刷新。';$('#status').className='error'}


