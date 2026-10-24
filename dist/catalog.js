export const domains={ai:'AI',devtools:'开发工具',web:'网站与前端',data:'数据库与数据',systems:'系统与运维',productivity:'办公与效率',media:'影音与创作',learning:'学习资料',games:'游戏',other:'其他'};
export const types={projects:'应用 / 框架',skills:'Skills',plugins:'插件',mcp:'MCP 服务',collections:'合集目录'};
export function domainOf(r){if(r.domain)return r.domain;const t=`${(r.topics||[]).join(' ')} ${r.description||''}`;if(['skills','plugins','mcp'].includes(r.category)||/\b(ai|llm|gpt|agent|machine.learning|deep.learning)\b/i.test(t))return 'ai';return 'other'}
export function explanation(r,editorial={}){return editorial[r.full_name.toLowerCase()]||{summary:'中文用途说明正在整理',input:'待阅读项目文档核实',output:'待阅读项目文档核实',source:r.url,pending:true}}
