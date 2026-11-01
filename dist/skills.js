// A curated directory, not a ranking. Installation totals stay at the official
// source until a supported data connection is available; never reuse repo stars.
export const skillDirectory=[
 {name:'find-skills',repository:'vercel-labs/skills',summary:'帮 Agent 查找并安装所需技能',input:'想完成的任务或技能需求',output:'匹配的技能及安装方式'},
 {name:'grill-me',repository:'mattpocock/skills',summary:'通过连续追问把想法和需求问清楚',input:'一个想法、计划或尚不清晰的需求',output:'经过追问明确的需求与决策'},
 {name:'grill-with-docs',repository:'mattpocock/skills',summary:'结合代码和文档追问需求，并保留设计记录',input:'已有项目、文档和待讨论的方案',output:'澄清后的方案、项目上下文与决策记录'},
 {name:'improve-codebase-architecture',repository:'mattpocock/skills',summary:'检查代码库结构，寻找可改进的架构边界',input:'现有代码库',output:'架构问题与可实施的改进候选'},
 {name:'agent-browser',repository:'vercel-labs/agent-browser',summary:'让 Agent 浏览、点击和操作网页',input:'网址和浏览器操作任务',output:'网页信息、截图或操作结果'},
 {name:'tdd',repository:'mattpocock/skills',summary:'用测试驱动开发流程实现或修复功能',input:'要实现的行为、代码和测试环境',output:'先测试再实现的代码与验证结果'},
 {name:'setup-matt-pocock-skills',repository:'mattpocock/skills',summary:'配置 Matt Pocock 技能工作流所需的项目约定',input:'项目和所用的任务管理方式',output:'工作流所需的配置与目录约定'},
 {name:'frontend-design',repository:'anthropics/skills',summary:'指导 Agent 制作有设计感的前端界面',input:'页面用途、内容与设计要求',output:'前端界面设计与实现代码'},
 {name:'handoff',repository:'mattpocock/skills',summary:'整理当前进度，供新的会话接续工作',input:'当前任务、已完成工作和未解决问题',output:'可供新会话使用的交接文档'},
 {name:'triage',repository:'mattpocock/skills',summary:'整理收到的 Issue 和需求，判断后续处理方式',input:'原始故障报告、Issue 或功能请求',output:'分类、补充信息及可执行的后续任务'}
].map(s=>({...s,url:`https://www.skills.sh/${s.repository}/${s.name}`,repositoryUrl:`https://github.com/${s.repository}`}));
export function skillsInRepository(repository){return skillDirectory.filter(s=>s.repository.toLowerCase()===repository.toLowerCase())}
export function searchSkills(q){const term=q.toLowerCase();return skillDirectory.filter(s=>`${s.name} ${s.repository} ${s.summary} ${s.input} ${s.output}`.toLowerCase().includes(term))}
