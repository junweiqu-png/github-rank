export const domains={ai:'AI',devtools:'开发工具',web:'网站与前端',data:'数据库与数据',systems:'系统与运维',productivity:'办公与效率',media:'影音与创作',learning:'学习资料',games:'游戏',other:'其他'};
export const types={projects:'应用 / 框架',skills:'Skill 相关仓库',plugins:'插件',mcp:'MCP 服务',collections:'合集目录'};
import {skillsInRepository} from './skills.js';
// A tool can also publish skills. Keep its primary type and add the verified relation.
export function typesOf(r){return [...new Set([r.category||'projects',...(r.skill_count>0?['skills']:[])])]}
export function repositoryView(r,{editorial={},skills=[],includeSkills=true}={}){
 const found=includeSkills?skillsInRepository(r,skills):[],copy=explanation(r,editorial);
 return {...r,...copy,domain:copy.domain||domainOf(r),skills:found,skill_count:found.length,summary:copy.summary+(found.length?'；已收录 '+found.length+' 项 Skill':'')};
}
export function domainOf(r){if(r.domain)return r.domain;const t=`${(r.topics||[]).join(' ')} ${r.description||''}`;if(['skills','plugins','mcp'].includes(r.category)||/\b(ai|llm|gpt|agent|machine.learning|deep.learning)\b/i.test(t))return 'ai';return 'other'}
export function explanation(r,editorial={}){return editorial[r.full_name.toLowerCase()]||{summary:'中文用途说明正在整理',input:'待阅读项目文档核实',output:'待阅读项目文档核实',source:r.url,pending:true}}

