// Chinese explanations based on public repository descriptions. Input/output describe
// typical use, not an exhaustive API contract. Preserve original text in the dataset.
const rows=`
morluto/rea|让 AI 分析软件行为和二进制程序，辅助逆向工程|待分析的软件、二进制文件或行为问题|分析证据、逆向结果和行为解释
mattpocock/skills|供编程助手使用的软件工程工作流技能集|开发需求、代码或评审任务|按技能流程完成的设计、代码或评审结果
ollama/ollama|在自己的电脑或服务器上运行大语言模型|模型名称、问题或 API 请求|模型生成的回答和文本
anthropics/skills|Anthropic 发布的 Agent 技能示例与技能包|任务要求和相应文件|由所选技能处理后的文档、代码等成果
langgenius/dify|通过可视化流程搭建 AI 应用、知识库问答和 Agent|模型配置、知识文档、工作流和用户问题|可运行的 AI 应用及回答结果
open-webui/open-webui|在自己的服务器上部署 AI 聊天网页|接入的模型服务、问题和附件|聊天回答及会话记录
langchain-ai/langchain|用于编写大模型应用和 Agent 的开发框架|模型、工具、数据源和任务代码|执行模型与工具后的应用结果
browser-use/browser-use|让 AI 通过浏览器完成网页操作|任务描述、网页和浏览器环境|网页操作结果及采集的信息
stablyai/orca|在桌面或手机上管理多个编程 Agent|编程任务、代码仓库和已有模型订阅|各 Agent 的执行状态和任务成果
modelcontextprotocol/servers|MCP 服务器示例和资源目录|希望连接的数据源或工具需求|可参考部署的服务器和集成方式
unslothai/unsloth|在本地运行和训练语言模型、扩散模型|模型、训练数据和训练配置|训练后的模型或模型生成结果
upstash/context7|向编程助手提供较新的软件库文档|软件库名称及相关技术问题|对应文档片段和代码用法
microsoft/autogen|编排多个 AI Agent 协同完成任务|Agent 配置、工具和任务|Agent 协作过程及任务结果
ChromeDevTools/chrome-devtools-mcp|让编程助手使用 Chrome 开发者工具排查网页问题|网页地址、浏览器和调试任务|调试信息、性能记录及操作结果
anthropics/claude-plugins-official|Anthropic 维护的 Claude Code 插件目录|需要扩展的工作能力|可安装的插件及其说明
microsoft/playwright-mcp|通过 MCP 操作浏览器进行网页测试和自动化|网页地址与浏览器操作指令|网页信息、截图或操作结果
vercel-labs/skills|发现、安装和管理 Agent 技能的命令行工具|技能仓库地址或搜索关键词|安装到 Agent 环境中的技能
github/github-mcp-server|让 AI 助手读取和操作 GitHub 项目|仓库、Issue、PR 等查询或操作请求|GitHub 数据或操作结果
QwenLM/qwen-code|在终端里使用的开源 AI 编程助手|代码仓库和自然语言开发任务|代码改动、解释或命令执行结果
openai/skills|面向 Codex 的技能目录|任务需求及选定技能|可安装技能和相应任务成果
xerj-org/xerj|在本地索引和搜索代码、文档与日志|文件目录和搜索问题|全文或语义搜索结果
mvschwarz/openrig|组织具有角色分工和共享上下文的 Agent 团队|团队配置、项目上下文和任务|团队任务状态及协作成果
inkeep/open-knowledge|结合 AI 的 Markdown 编辑器与知识库|Markdown 文档和知识内容|编辑后的文档和可查阅的知识库
jeremylongshore/tons-of-skills-marketplace|跨模型的 Agent 技能平台和安装工具|技能需求、技能包及 Agent 环境|安装和适配后的技能
nano-muse/nanoMuse|可在多种设备上使用的个人 Agent|日常任务、设备权限和上下文|任务成果、持续任务状态及记忆
framerslab/agentos|用 TypeScript 构建带记忆的 AI Agent|Agent 配置、模型和用户任务|Agent 行为及任务执行结果
Ikalus1988/MisakaNet|通过 MCP 查询已有的软件故障修复经验|报错信息和故障线索|带证据等级的修复经验
Cotal-AI/Cotal|定义多个 Agent 如何协调工作的开放标准|参与者、任务和协调信息|按标准交换的协作消息
gosuda/portal-tunnel|通过可自托管的中继将本机服务暴露给外部使用|本地服务地址和中继配置|可远程访问的服务入口
guaardvark/guaardvark|在自己的 GPU 上部署综合 AI 工作室|本地模型、文件和创作或自动化任务|问答、生成内容或 Agent 执行结果
nirholas/three.ws|生成并嵌入可交互的 3D AI 角色|文字或照片及角色配置|带骨骼动画的 GLB 角色和网页组件
SikamikanikoBG/homelab-monitor|自托管的家庭服务器监控面板|GPU、容器、系统服务等运行数据|资源状态和能耗监控面板
damianvtran/local-operator|在自己的电脑上组织和运行多个 Agent|Agent 分工、模型订阅和工作任务|后台协作结果及任务状态
Cloudgeni-ai/opengeni|面向组织的可自托管 Agent 执行服务|任务、审批规则、凭据授权和上下文|可回放的 Agent 会话和执行记录
juspay/neurolink|用统一接口接入多家 AI 模型和语音等能力|模型配置、文本、语音或文件请求|生成内容、流式响应或决策结果
JasonColapietro/suede-creator-skills|供编程助手使用的技能集与技能目录|开发或创作任务及技能需求|技能执行结果和可发现的技能条目
mizzlelover/cida|指导 AI 写出清楚自然的现代中文|写作目标、原始材料和文本证据|结构清晰的中文表达
kukucaiCndy/Corum-Harness|基于 DeepSeek Harness 的桌面 Agent 和开发环境|项目代码、开发任务和模型配置|代码改动及 Agent 执行结果
PGHQdev/OpenScreenShot|数据保留在本机的开源浏览器截图扩展|需要截取的网页|网页截图
hproxy-com/free-proxy-list|提供持续检查的免费代理列表|代理筛选条件或检测请求|代理地址、延迟和可用性信息
atrislabs/atris|根据自然语言任务规划、构建并检查成果|任务描述和项目上下文|构建结果及检查证据
dcc-mcp/dcc-mcp-core|让 AI 通过 MCP 或 REST 操作创作软件|创作软件实例和操作任务|软件操作结果及创作成果
call518/MCP-OpenStack-Ops|通过 MCP 查询和管理 OpenStack 云环境|项目范围、云凭据和运维请求|云资源信息及获授权的操作结果
linny006/awesome-agent-skills|带质量评价的 Agent 技能精选目录|想解决的任务或技能关键词|可选技能及评价信息
luocfprime/labtasker|安排和管理实验任务|实验任务和调度配置|任务执行顺序及状态
curie-eng/curie|把 GitHub Issue 委派给自托管 Agent 完成|Issue、代码仓库和审批规则|供人工审查的代码改动和 PR
burin-labs/harn|用于构建 AI Agent 的编程语言和运行时|Agent 程序与任务输入|程序运行后的 Agent 结果
tedix-hq/tedix|处理工作任务并集中呈现需要人决定的事项|工作任务和相关上下文|已处理结果及待决策事项
shalintripathi/saas-marketing-agents|面向 B2B SaaS 营销的 Agent 和技能套件|产品信息、营销目标和材料|营销分析、内容和活动方案
eugenelim/agent-ready-repo|给软件团队安装 AI 开发工作流套件|项目、所需技能和开发阶段|安装后的技能、子 Agent 和工作流
linny006/skills-tracker|跟踪 GitHub 上新出现的技能仓库|GitHub 仓库数据|技能项目索引及变化记录
productdevbook/yuva|把邮件、在线聊天等客户消息放进统一工作台|客户消息、产品和团队配置|会话收件箱、帮助中心等服务界面
wilgon456/Paseobility|为 Paseo 连接的项目和设备提供工作技能|项目、浏览器、文件或电脑任务|对应技能完成的操作结果
CorpusIQ/corpusiq-docs|整理 Agent 与 MCP 的实践知识和资源|需要查阅的技术主题|知识文档与项目参考
andisab/swe-marketplace|面向软件工程的 Claude Code 插件目录|开发、评审、研究等工作需求|可用插件、技能及专业 Agent
raghavpillai/openteam|带长期记忆和定时工作流的自托管 Agent|工作目标、设备工具和调度设置|持续执行的任务结果
Maz2580/geospark|通过几何引擎回答可验证的空间计算问题|坐标、几何数据和距离等问题|计算结果及来源、许可信息
ashlrai/phantom-secrets|在本地用替代标识保护 Agent 使用的密钥|真实密钥、代理配置和 Agent 请求|替换密钥后的请求及转发结果
memtomem/memtomem|用 Markdown 文件保存和检索 Agent 长期记忆|Markdown 或代码文件及搜索请求|相关记忆和检索片段
JialaoLiu/dsh-baton|将任务从 Claude Code 或 Codex 转交本地 DeepSeek Harness|需要转交的任务|本地执行后带回的任务结果
cmeans/mcp-synology|通过 MCP 管理和查询群晖 NAS|NAS 连接信息和文件或系统请求|文件查询、系统状态及授权操作结果
phinn/KinetAios|把多个编程 Agent 放进同一个本地工作台|编程任务、模型环境和项目|会话、代码成果和长期记忆
FOURTEEN1416/academic-agent-toolkit|覆盖论文、数学建模和科研图表的学术技能包|研究材料、论文或建模需求|学术文档、图表或建模成果
bradleybond512/crystal-ball|结合三维地球和多个实时数据面板的情报平台|数据源和分析查询|地理面板、证据关系及分析结果
axisvela/praxo-core|用于开发有规则约束的 AI Agent 的框架|模型、工具、记忆和规则配置|受规则约束的 Agent 执行结果
EvannZhongg/Nosis|带会话隔离和工具扩展的个人 Agent 运行时|任务、会话和工具配置|任务成果及持久保存的会话记录
AlgoVaultLabs/crypto-quant-signal-mcp|通过 MCP 提供加密资产衍生品分析信号|行情和分析请求|组合信号、资金费率及市场状态分析
zh-xx/Antu|把结构化法律信息变成可离线查看的图|案件事实、流程或关系的 JSON 数据|独立 HTML 时间线、流程图或关系图
holistis/bug-bounty-intelligence-mcp|用多阶段检查辅助分析 Solidity 安全问题|Solidity 代码仓库|模式匹配结果或安全分析报告
Albasha0x0/Corvus|供 AI 分析本机二进制和托管程序的 MCP 服务|程序文件和逆向分析请求|反编译内容、引用关系或补丁结果
aws-samples/sample-aws-genai-db-modernizer|分析数据库迁移到 AWS 的现代化方案|关系数据库结构和实际查询|引擎建议、迁移阶段和成本估算
cyanseek/dsh-landscape|检查 DeepSeek Harness 插件能力与缺口|现有插件和所需能力|验证结果、能力缺口和开发需求说明
carrick-tools/carrick|给 AI 提供跨服务的 TypeScript 代码关系|TypeScript 仓库和上下文查询|类型、路由和函数行为等相关信息
dbc-oduffy/coordinator-claude|组织从需求规划到交付审查的开发流程|产品需求、代码和任务进度|计划、委派任务及交付决策材料
cgfixit/CyClaw|本地优先、可离线使用的 AI Agent|本地任务和可用模型环境|Agent 的任务执行结果
formhaus-dev/formhaus|用一份 JSON 定义多种平台中的动态表单|含字段、校验和分支的 JSON|表单组件和校验行为
linny006/claude-code-plugin-tracker|跟踪 Claude Code 插件、扩展和钩子|GitHub 插件仓库数据|持续更新的插件索引
aylee1024/lord-claude|在 Claude Code 中调用其他模型的命令行 Agent|任务及已有模型 CLI 订阅|不同模型 Agent 的执行结果
clocksmith/gamma|在本地探索、比较和测试 AI 模型|模型、测试数据和实验配置|比较指标和能力实验结果
hwdsl2/uplinkcrate|把多个 MCP 服务聚合成自托管统一入口|MCP 后端、环境配置及认证信息|统一的 MCP 访问端点
chenxi2015/aiworkstation|个人 AI 工作站项目|项目简介未列明，需查看文档|项目简介未列明，需查看文档
Aarekaz/transit-mcp|查询华盛顿和纽约的公共交通实时信息|车站、线路或到站查询|到站时间、故障和车辆位置
mapax-io/neuralops-nexus|让人与多个 AI 角色在同一工作区协作|工作目标、成员及项目上下文|共享任务状态及协作成果
pironjulien/NexusBrowser|让 AI 在真实 Chrome 的后台标签中执行任务|本地 Chrome、桥接服务和任务|网页操作结果
Elnora-AI/elnora-cli|Elnora 生物实验流程平台的命令行接口|平台命令和实验流程参数|平台返回的流程信息或操作结果
Dougladmo/graph-eng|面向 Claude Code 的图工程插件和工作流|图工程任务及项目上下文|相应工作流成果，具体格式见文档
Longfellow1/penpal|让多个 AI 助手共享本地记忆|需要保存的上下文和记忆查询|跨助手可检索的本地记忆
njbbaer/simulacra|用模板化上下文构建 Telegram AI 机器人|模型配置、上下文模板和聊天消息|机器人的聊天回复
raghuramsirigiri/raghuram-skills|把数据变成离线可用的交互报告|原始数据和报告需求|带交互 SVG 图表的独立 HTML
CSalcedoDataBI/dax-for-agents|供 AI 查阅的 DAX 语言参考资料|DAX 函数或语法问题|函数签名、语义和使用注意事项
ramith27/thaliyola|自托管的团队项目知识库|经人工审核的文档和检索问题|语义搜索结果及共享知识
bex-co/open-accounting-bench|测试 AI Agent 处理会计账本的能力|测试任务、Agent 和 Beancount 账本|自动验证的评测结果
samsara0xgg/Jarvis|macOS 上具有长期上下文的语音助手|语音问题及已连接的服务|语音回复或工具操作结果
AIfromScratch66/SKillSentra-for-Chatgpt|管理 ChatGPT 所用技能的生命周期|技能文件和管理操作|技能管理结果
alivirgo/Major-AI-Skills|供多种编程助手安装的通用技能集|产品或效率任务和所需技能|安装后的技能与任务结果
TheColliery/.github|介绍面向编程 Agent 的工具系列|希望了解的工具或工作规范|工具入口、规范和基准信息
Ephemeral6/ai-galgame|在 Claude Code 中运行 AI 视觉小说|故事包和玩家选择|互动剧情与视觉小说体验
stephennmiller/taskgraph-ai|把产品需求变成带依赖关系的开发任务|产品需求文档|有先后依赖的任务列表和执行状态
gaius-codius/ostrakon|收集工作中的想法并整理成 Agent 提示|随手记下的想法和项目上下文|分类后的想法与可执行提示
raiki61/claude-plugins|通过独立上下文反复实现、审查和研究|开发或研究任务|审查记录及迭代结果
byheaven/byheaven-skills|用于代码与效率工作的 Agent 技能合集|代码任务或日常工作需求|对应技能的任务成果
caredhieacid/jensenmo-happy_coding_everyday|指导编程 Agent 按良好工程习惯修改代码|需求、故障和项目代码|经检查的代码改动和说明
tidegap/tidegap|把非紧急模型任务安排到电网更清洁的时段|任务、截止时间及区域配置|调度后的执行时间与任务结果
dheerajjha/reviewer|在本地像审 PR 一样审查 Agent 改动|本地代码差异和人工批注|带批注的审查内容及反馈给 Agent 的说明
JuanSPZ/agent-ready-index|面向 Agent 的网站索引及 MCP 工具项目|待索引网站或查询需求|网站索引及查询结果，格式需查文档
reefbarman/agentlink|在 VS Code 中组织可控的编程 Agent|项目、模型配置和编程指令|代码差异、任务进度和审查结果
hermez-agency/ponos|将任务交给隔离工作区中的编程 Agent|任务单、仓库和必要的外部连接|任务成果和独立代码改动
ArthurC02/SkillHub|寻找、制作、试用和分享 Agent 技能的平台|技能需求或待分享的技能|技能条目和试用结果
mblauberg/provenant|供 Claude 与 Codex 使用的开发流程执行框架|开发任务、规则和项目上下文|按规则执行的开发流程结果
kinqsradio/orbyn-fullstack-skills|覆盖全栈开发的工程技能集|架构、接口、迁移或前端开发任务|对应工程技能的输出
Zhang-jx00/jiangzuo|指导 Agent 先理解、验证再交付的全栈技能|需求、项目代码和上下文|经验证的代码改动与文档
Classgrid/classgrid_platform_desktop|可研究资料、分析文件和编辑仓库的桌面 Agent|问题、文件、代码及已连接的工具|研究分析、文件成果或仓库改动
seotarek/orthotect|面向编程 Agent 的接口工程和运行时检查架构|接口设计、代码和检查规则|接口约束及运行时检查结果
CompleteTech-Skills/hatch-pet|为 Codex 制作不同画风的动画宠物的技能|角色描述或参考图|适配宠物功能的动画素材
ankush1982/ai-secure-by-design|按适用规范为项目加入隐私与安全开发约束|项目特征和适用规范选择|开发检查规则及产品代码骨架
Atlas-X-AI/hermes-kanban-watch|在 Claude Code 中查看 Hermes 看板工作进度|Hermes 任务看板及工作状态|只读的任务进度视图
wcfcarolina13/motion-studio|通过代码制作带音乐的动态图形视频|影片需求、画面代码及获授权音频|可预览和渲染的动态图形影片
anandkaranubc/gitgoblin|寻找可贡献的开源项目并协助形成 PR|兴趣方向和项目待办|贡献机会及相应代码改动
loosephoto/space-finder-mcp|搜索天文、航天数据及相关多媒体|天体、航天任务、发射或历史问题|资料、媒体和相关事件信息
giantswarm/pro|通过 MCP 管理 GitHub 项目|项目管理查询或操作请求|GitHub 项目数据和操作结果
jasp402/HyperCodeMotion-MCP|通过结构化工具创建和检查动态图形|JSON 动效构图及修改指令|创建、校验或优化后的构图
makar52nn-crypto/x402-money-reactor|提供按调用付费的 AI 数据接口|接口请求及所需链上支付|对应接口数据或代币安全分析
Yashasm18/chaos-doctor|用攻击和修复两个模型反复测试 Agent|待测试 Agent 和测试配置|故障发现、修复与测试记录
ragnarwestad/aide|按规格文档组织 AI 编程工作|规格、项目和所需技能|开发任务及仪表盘中的执行结果
passioncode-ai/passioncode|统一安装和更新 PassionCode 技能及插件|安装命令和目标 Agent 环境|成套安装或更新的技能插件
MikeMoore1337/ai-development-toolkit|可移植的 AI 开发技能和质量检查工具包|开发需求、代码和检查任务|开发成果及质量检查结果
mimukit/skills|个人维护的可安装 Agent 技能合集|所选技能及对应任务|技能安装结果及任务成果
Darkmalan-1987/sparring-reason|协助推理并提供质疑与来源核查的 AI 搭档|想法、论证或问题|推理反馈、质疑和来源信息
luxsolari/lux-swiss|指导 Agent 使用严格双色的瑞士风格设计|页面内容与设计需求|统一双色风格的界面设计
SeokpilYoon/adb-autolink|在受信网络中连接 Android 无线调试工具|Android 设备、网络及调试请求|ADB 连接和调试操作结果
musterd-io/musterd|组织有明确成员和验收责任的 Agent 团队|团队成员、任务和验收要求|可追踪责任的工作成果
iberi22/xavier|为 Agent 提供向量记忆与知识图谱|需要保存的知识或检索请求|向量检索结果和知识关系
bogdanstancu1119-maker/psie-arca|项目说明未提供清晰可验证的功能定义|待阅读项目文档确认|待阅读项目文档确认
xsoc-corp/openclaw-nie-guard|为 Agent 框架设计加密信任与审计层|访问请求、设备证明和策略|权限判断、信任校验与审计记录
maya8237/MEOW|基于 Claude Code 的轻量任务执行框架|一个开发任务|经验证的代码分支
dancxjo/conduit|跨设备运行带规划与恢复能力的软件任务|任务、执行环境和规划配置|执行结果、证据和恢复记录
rsyyd/larecode|终端中的开源 AI 编程 Agent|代码项目和开发指令|代码改动和执行反馈
joshualeestone/kosmos|管理自己的电脑上运行的 Agent|Agent、任务和已有 AI 订阅|Agent 管理界面与任务状态
12345773/claude-minder|管理 Claude 上下文记忆的工具|会话记忆及同步或回退请求|整理、同步或恢复后的记忆
exactml/marginal|结合整个代码库上下文审查 PR|代码仓库和 PR 差异|代码审查意见
wss-m-nagata/public-skills|用于发布公开 Agent 技能的仓库|需要查找的技能|公开的技能文件
m4bwav/cinewright|指导 AI 进行影片制作与视频导演的技能|影片构思、素材和制作要求|影片规划与视频制作成果
gurveers/learnings|使用 Claude Code 开发 Android 的实践资料|Android 项目及开发任务|开发测试流程、经验和操作指引
ottuck/diagram-polish|把简单图表整理成一致清晰的架构图|JSON 图定义或待整理的图|SVG 或 PNG 架构图
veawho/via54SocialROI|分析社交媒体投放与电商搜索之间的效果|社交平台、电商和营销数据|ROI 与传播效果分析
arm-pz/skills-site|为技能目录生成可搜索的静态网站|SKILL.md 技能文件和发布配置|技能页面、目录索引及静态网站
full-aigc-plugins/pdfcraft-plugin|使用本机工具检查、编辑和识别 PDF|PDF 文件和处理要求|检查结果、编辑后的文件或 OCR 文本
m4bwav/everlast|保留跨模型、跨会话的编程经验知识层|项目事实和会话经验|可捕获、恢复和查询的长期知识
rezzminator/sub-agent-compact|按阈值压缩 Claude Code 子 Agent 上下文|子 Agent 会话和压缩设置|压缩后的上下文
TanishkKamra/claude-skills-kit|为 Claude Code 提供访谈与技能编排命令|需求、访谈回答或工作目标|需求简报和技能编排结果
telmoni/skills|教编程 Agent 使用 Telmoni 的技能集|Telmoni 相关开发任务|按技能流程完成的任务结果
kolezka/self-improvement-loop|从会话反思中提炼需人工审核的规则与技能|工作会话和反复出现的经验|待审核的技能、钩子或规则
duchamp-app/duchamp|为落地页与动效创作提供设计配方和素材|页面风格、内容及创作需求|设计配方、图像提示和动效方案
YouToco/llm-relay-audit|审计 AI API 转售服务是否与原厂接口一致|转售接口、原厂接口和测试请求|对比证据及审计报告
m4bwav/chartwright|选择并制作合适的数据图表|数据、表达目标和渲染选项|所选图表及渲染结果
kamenkurtev/ui-consistency|让新页面沿用项目现有的界面风格|现有页面和新增界面需求|与现有设计一致的界面改动
m4bwav/everscout|为指定主题寻找社区与信息源并持续观察|主题和扫描设置|经过核查的信息源、笔记与观察报告
m4bwav/package-modernize|帮助更新旧软件包并按检查流程发布|旧软件包、现代化要求及发布配置|更新后的包和检查结果
m4bwav/obsidian-notes|整理适合 Obsidian 与 GitHub 阅读的笔记|Markdown 笔记和知识库|检查、链接和索引后的笔记
noahkiss/quadcam|把 FPV 飞行眼镜录像整理成本机视频库|DVR 视频片段|按日期整理并校验的视频库
Ashon/pacenote|在 Slack 中接收并转交本机编程助手任务|Slack 消息、任务历史和本机 Agent|聊天回复及委派任务结果
tourclaim/tourclaim-cli|辅助处理信用卡旅行保险索赔的实验工具|合成模式中的索赔材料和请求|模拟审查结果
AmbroseX/aiguanchao|汇总 AI 新闻、日报和模型排行榜|新闻来源和更新数据|中文新闻摘要、日报和订阅内容
Perception-Dynamics-Inc/a11y-computer-use|让 Agent 通过无障碍元素操作电脑|任务与无障碍界面树|界面操作结果及状态快照
marsaplatform/erx-mcp|查询埃及公共事务相关资料|研究问题和查询条件|带来源的研究资料
marsaplatform/malja-mcp|通过 MCP 查询人道主义公开数据|地区、主题和数据查询|来自联合国等机构的公开数据
aarbchen/signaltender-scraper|查询美国政府 IT 采购招标与中标信息|地区、采购关键词或接口查询|招标、中标及承包信息
shmindmaster/subtext-scan|检查文档中肉眼不容易发现的隐藏指令|PDF、DOCX 或 HTML 文件|隐藏文字和可疑指令检测结果
benkrasin/ats-jobs-mcp|查询多家企业招聘系统中的职位|公司招聘页或职位关键词|匹配的职位列表
YuanyuanMa03/apple-notes-agent-skill|让本机 Agent 操作 Apple 备忘录|备忘录任务和相应访问权限|备忘录内容或操作结果
zhanglunet/livepowers|按探索留证据、固化能力的方式组织 Agent 工作|目标、领域信息和工作上下文|工作证据、能力记录及验收结果
mohammad-abbasi-sh/bidi-skills|检查并修复波斯语等从右往左文本的格式|含双向文字的文本|修正方向、字符和数字格式后的文本
meganemura/nukadoko|用机器可读契约验证场景执行步骤|Gherkin 或 Markdown 场景及契约|执行步骤记录和契约检查结果
akshayDev17/ai-explainer-video|把课程笔记制作成有旁白的动画讲解|课程笔记目录|系列动画讲解视频
Findskills/skillpi|为编程助手发现经过筛选的技能|技能需求和搜索条件|推荐的技能条目
longkum/trending-agent-skills|每天整理 GitHub 热门技能与 AI 仓库|GitHub 热门项目数据|双语摘要和每日变化记录
everyinfra/.github|介绍 EveryInfra 的开发者 API 和工具|希望了解的开发能力|工具、服务与集成入口
Punpun1643/agents-skills|面向文档和工作流的 Agent 技能集|文档或流程任务|对应技能处理后的成果
TeeratP/next-steps-plus|让 Claude Code 用户批量选择下一步提示|候选后续任务和选择|整理成编号列表的一组提示
Soffritto-Technologies/chefs-table|把 AI 正在构建的应用用户路径可视化|应用页面及用户流程|可缩放的用户旅程地图
alimohammadiamirhossein/deputy|让主模型把部分任务交给较便宜的模型|任务与模型分工配置|子模型任务结果和主模型汇总
SurendharVr/sitemend|检查代码改动是否破坏网站抓取与索引|网站仓库或 PR|带具体位置的 SEO 回归测试结果
partme-ai/full-aigc-plugins|面向多种 Agent 的多模态创作插件市场|图像、视频、音频等创作需求|可选插件和相应创作成果
abmorrill4/gh-refs|为 Claude Code 回复中的 GitHub 引用加悬浮信息卡|回复中的 Issue 或 PR 引用|对应 GitHub 信息的悬浮卡片
AlbertKellner/claude-code-mod-task-tree|在 Claude Code 中展示当前会话任务树|会话任务及执行关系|任务树面板
rodrigobuko/gatekeeper-ai|在提交 AI 代码前检查开发者是否理解改动|AI 生成的代码和理解检查|理解确认与交付检查结果
TanbirRamim/vibereel|把编程助手工作会话制作成可分享短片|Claude Code 或 Codex 会话|已去除密钥的约 30 秒短片
m284743/shaniu|与 BNB 智能链社区代币相关的 MCP 服务|项目支持的链上查询或请求|相关链上数据，具体操作见文档
hui-xu-ai/wensu|为 Agent 检索中文文献|中文文献主题和检索条件|文献条目与来源信息，不下载全文
rezearcher/x402-data-api|通过按次付费接口提供链上与安全数据|数据查询和接口所需支付|加密资产、链上或安全分析数据
jincheng3870682453-hash/dsh-doctor|排查和修复 DeepSeek Harness 桌面运行故障|安装环境、启动故障和日志|诊断、修复记录及恢复结果
agenttrust-ai/agenttrust|在调用 Agent 服务前检查其可信性|Agent 服务地址和检查请求|端点验证、可靠性和信誉信息
noruzzamans/gslider-blocks|为 WordPress 编辑器提供轮播与滑块组件|图片、内容及轮播设置|网站中的滑块或轮播区块
suyiiyii/alldayrec|在自己的服务器保存全天录音并整理内容|穿戴式设备音频|转写、说话人识别及录音摘要
giantswarm/search-mcp|查询 Giant Swarm 的文档、手册和内部资料|搜索问题和可访问的资料源|匹配的文档内容
immutex/hvlab-mcp|通过 CLI 和 MCP 控制 Hyper-V 实验环境|虚拟机、环境配置和操作请求|虚拟机操作结果及调试信息
dotfrankruan/workforce-orchestrator-mcp|让 Codex 编排带依赖关系的多个开发任务|任务图、预算、角色和仓库|隔离工作区中的成果及验收记录
api-evangelist/bluerock-security|由第三方整理的 BlueRock Security API 资料|希望了解的 API 或平台能力|第三方整理的接口与平台说明
whereissam/learn-agent-engineering-from-production|通过真实产品代码学习 Agent 工程机制|学习主题及示例代码|逐步拆解、重建和测试的学习材料
jamescrowley321/codecite|在本地索引代码和规格并返回引用依据|代码与规格目录、查询问题|附来源引用的检索结果
armanalabsai/arlcoin.io|按用量结算 AI 与计算服务的协议项目|服务调用及结算信息|协议约定的用量与链上结算结果
imtechboss/imtechboss|个人技术、AI 与网络安全介绍仓库|无需任务输入|作者介绍与相关技术入口
passioncode-ai/fabric-agent-adapter|让 Agent 接入 Fabric 兼容协议|Agent 实现、适配配置和测试|适配层与兼容性测试结果
saphan-ai/quake-watch-ios|演示地震预警应用的 iOS 客户端|地震服务数据和用户设置|iOS 地震信息与提醒界面
saphan-ai/quake-watch-android|演示地震预警应用的 Android 客户端|地震服务数据和用户设置|Android 地震信息与提醒界面
saphan-ai/quake-watch-server|演示地震预警应用的服务端|地震事件数据和通知配置|客户端可读取的事件与预警
callsign-im/callsign-server|供 AI Agent 互发消息的开放通信网络|Agent 身份、消息和通信许可|消息投递与可核验的记录
api-evangelist/bluenote|由第三方整理的 Bluenote 生命科学 AI 平台资料|希望了解的 API 和平台能力|第三方整理的接口与平台说明
intigraph/shantytown|轻量组织多个编程 Agent 执行工单|开发工单、代码和 Agent|工单执行结果
TechMitten/app-blips|自托管的自然语言应用生成器|用文字描述的应用想法|可运行的应用与实时预览
farijarifriyanto-debug/bccli|终端中的 AI 编程助手|项目代码和开发任务|代码改动及任务反馈
Flo5k5/neuron-times|生成多语种 AI 新闻日报与周报|AI 新闻素材和更新内容|多语种日报和每周回顾
whizey/InvoiceIQ|分析应收账款并预测逾期风险的业务工具|发票、回款与业务流水|对账面板、逾期预测及催收流程
rdavid/prompt|指导模型保持代码改动一致且精简的提示文件|提示文件、项目规则及开发任务|受提示约束的模型回答与改动
izzyfrm/cat-news|聚合开发者关注的 AI 新闻|GitHub、模型平台和实验室博客内容|整理后的 AI 新闻流
Ynewtime/markitai|支持模型增强的 Markdown 转换工具|原始文档和转换选项|转换后的 Markdown 内容
`;
const discovered=`
react/react|用组件构建网页和原生应用的用户界面库|组件代码、数据和用户操作|动态用户界面|web
codecrafters-io/build-your-own-x|通过从零重写常用技术学习编程的教程集|选定的技术方向和练习代码|自制技术原型及学习过程|learning
sindresorhus/awesome|汇集各领域精选资源目录的总索引|想了解的主题|对应主题的资源目录链接|learning
public-apis/public-apis|免费公共 API 的分类目录|想接入的数据或服务需求|对应 API 的名称、地址和说明|devtools
openclaw/openclaw|可在多种平台执行任务的个人 AI 助手|自然语言任务、工具和平台连接|助手回答与实际任务结果|ai
donnemartin/system-design-primer|学习大型系统设计及准备面试的资料集|系统设计主题或面试问题|设计知识、示例解答和复习卡片|learning
nilbuild/developer-roadmap|按开发岗位组织的互动学习路线图|职业方向和当前知识水平|学习路线、指南和相关资料|learning
jwasham/coding-interview-university|面向软件工程师的计算机基础与面试学习计划|学习目标和练习进度|知识清单、练习与复习安排|learning
vinta/awesome-python|按用途整理 Python 库、框架和工具|想用 Python 完成的任务|适合该任务的项目链接|learning
awesome-selfhosted/awesome-selfhosted|可以部署在自己服务器上的应用目录|所需应用功能|对应自托管软件和部署入口|systems
obra/superpowers|组织 AI 软件开发流程的技能框架|产品想法、开发任务和代码|按技能流程完成的方案、代码与检查结果|ai
practical-tutorials/project-based-learning|通过实际项目学习编程的教程目录|编程语言和想做的项目|循序完成项目的教程链接|learning
affaan-m/ECC|优化编程 Agent 的技能、记忆与开发流程|Agent 环境、开发任务和优化配置|优化后的运行配置与任务结果|ai
deepseek-ai/deepseek-harness|以插件扩展能力的 DeepSeek Agent 执行环境|任务、模型和插件配置|Agent 任务成果及执行记录|ai
multica-ai/andrej-karpathy-skills|用一份规则文件改善 Claude Code 编程行为|代码项目、任务和规则文件|受规则约束的代码改动|ai
ultraworkers/claw-code|由 Agent 维护、以 Rust 构建的代码项目|仓库简介未列明应用输入，需查看文档|仓库简介未列明具体成果格式|devtools
DietrichGebert/ponytail|指导编程 Agent 减少不必要实现的技能|开发需求和代码上下文|尽量精简的实现与建议|ai
garrytan/gstack|覆盖规划、设计、开发和质检的 Claude Code 工具集|产品需求、设计或开发任务|对应角色的方案、代码及检查结果|ai
Graphify-Labs/graphify|把代码库和文档变成可查询知识图谱|代码、文档、数据库结构等文件|可追溯关系来源的知识图谱|ai
VoltAgent/awesome-design-md|整理品牌设计系统的 DESIGN.md 参考文件|选定设计风格和项目需求|可用于生成匹配界面的设计规范|web
JuliusBrussee/caveman|通过简短表达减少编程 Agent 输出的技能与代理|模型会话和简洁表达要求|更短的模型回答|ai
addyosmani/agent-skills|面向工程实践的 AI 编程技能集|开发需求和项目上下文|按技能执行的代码与工程成果|ai
paperclipai/paperclip|管理工作中多个 Agent 的开源应用|Agent、任务和工作配置|Agent 分工、进度和工作成果|ai
nexu-io/open-design|人与 AI 一起制作设计和内容的本地协作工作区|设计需求、素材和团队反馈|原型、网站、演示或其他创作成果|ai
storytold/photocraft|使用 Rust 编写的开源照片编辑器|照片和编辑操作|编辑后的照片|media
Gathin23/cleanyourtv|通过无线 ADB 整理 Android 或 Google TV 的工具|电视设备连接和整理选项|清理后的应用环境及新桌面|systems
deepseek-ai/DeepInfer|用于大规模运行 DeepSeek 模型的推理框架|模型、部署资源和推理请求|模型推理结果|ai
wheresryan22/anatomy|用图形解释机器和复杂系统的 Agent 技能|待解释的机器、系统与画面要求|交互等距 SVG 插图及可选三维效果|ai
google-research/harness2|仓库暂无公开简介，具体功能待阅读文档核实|暂未确认|暂未确认|other
storytold/pdfcraft|使用 Rust 编写的 PDF 阅读与编辑器|PDF 文件和阅读、修改操作|阅读界面及修改后的 PDF|productivity
storytold/filmcraft|使用 Rust 编写的非线性视频编辑器|视频、音频和剪辑操作|剪辑后的影片|media
storytold/wordcraft|使用 Rust 重新实现的文字处理应用|文档内容和排版操作|编辑、排版后的文档|productivity
openai/math|仓库暂无公开简介，具体功能待阅读文档核实|暂未确认|暂未确认|other
storytold/lightcraft|使用 Rust 编写的非破坏式照片编辑器|照片原片和调整参数|保留原片的照片编辑成果|media
storytold/vectorcraft|使用 Rust 编写的矢量绘图工具|图形、路径和绘图操作|可编辑的矢量作品|media
tangency-labs/solidcraft|开源参数化三维 CAD 设计应用|尺寸、约束和建模操作|参数化三维模型|media
rehan-remade/universal-modder|协助 Agent 修改用户拥有的 PC 游戏的技能工具包|游戏、修改目标及创作素材|游戏 Mod、测试与展示材料|ai
storytold/effectcraft|使用 Rust 编写的动态图形与合成工具|图形、视频图层和合成操作|动态图形及合成画面|media
storytold/cadcraft|使用 Rust 编写的 CAD 制图应用|尺寸、几何对象和制图操作|工程图及设计文件|media
pengchujin/aerial-tv|面向国产 Android 电视的简洁桌面|电视应用和桌面操作|无广告的电视主屏界面|systems
simbasjungles/free-my-tv|为多种电视系统提供无广告主屏的工具|支持的电视设备及桌面配置|简洁电视主屏，可按项目说明撤销|systems
xiaoyang111222/cn-math-taxonomy|整理中小学学科知识点、先修关系与练习题|年级、学科和练习作答|知识关系、题目与前置知识诊断|learning
JoasASantos/REA-Prompts|辅助使用 REA 分析软件的提示词合集|软件分析目标及对应提示|供 Agent 使用的逆向分析任务指令|ai
EthanArbuckle/fairplay-decrypt|研究离线处理 FairPlay 加密 IPA 的工具|适用的 IPA 文件和项目要求的密钥材料|解密处理结果，能力与条件以文档为准|devtools
ikow/php2shell-poc|PHP 漏洞研究与检测规则仓库|受授权的测试环境或待检查流量|研究验证结果及检测规则|devtools
alchaincyf/huashu-motion|让 Agent 根据画面反馈制作产品宣传片|产品内容、画面要求及修改意见|带配乐的产品宣传视频|ai
humblemuzzu/dumbtv|通过 ADB 整理 Fire TV 的广告与桌面环境|Fire TV 连接及所选设置|整理后的环境和开源桌面|systems
Ansub/tv-detox|为旧 Android 电视提供轻量桌面与整理提示|电视设备和整理任务|轻量无广告桌面及配置结果|systems
9bie/php2shell-bypass-aslr-exp|PHP 漏洞利用条件的研究验证项目|受授权的实验环境|研究验证结果|devtools
openai/php2shell-checker|仓库暂无公开简介，具体检测能力待核实|暂未确认|暂未确认|other
wesbos/3d-model-anything|用手机扫描资料重建可编辑的房间模型|iPhone 激光雷达数据和照片|可在浏览器查看的 Three.js 房间模型|media
xevrion/hatchzip|边释放压缩包占用空间边解压的大文件工具|ZIP、7z、tar 或分卷压缩文件|解压后的文件及减少的临时空间占用|productivity
oosexgang/hackios-xnu-kernel|仓库暂无公开简介，具体功能待核实|暂未确认|暂未确认|other
colinhacks/reylo|把 SQL 文件直接导入 TypeScript 并推断类型|SQL 文件与 TypeScript 项目|带完整类型推断的 SQL 调用接口|devtools
appariciojunior/video-editor-skills|教 Claude Code 在达芬奇中完成初剪的技能|视频素材、转写与剪辑要求|初剪、字幕、动效和导出视频|ai
EgorBo/BlazingFastDotnet|整理 .NET 程序性能优化技巧|待优化的代码和性能问题|优化思路、诊断和基准相关建议|learning
dex-tool-best/.github|自述为去中心化交易跟单机器人的介绍仓库|公开简介未说明|公开简介未说明|other
aotoycffyxns/delta|自述为 PC 执行器的项目，功能信息不足|公开简介未说明|公开简介未说明|other
df-tools-bn/.github|自述为 DeFi 套利机器人的介绍仓库|公开简介未说明|公开简介未说明|other
tytpaskanvdc/cross-exchange-arbitrage-bot-pc-desktop|自述为跨交易所套利机器人的项目|公开简介未说明|公开简介未说明|other
onchain-trading-bot/.github|自述为链上交易机器人的介绍仓库|公开简介未说明|公开简介未说明|other
xynbspqmochf/.github|自述为链上资金追踪工具的介绍仓库|公开简介未说明|公开简介未说明|other
akhiranandan-04/neverlose|简介只列出发布日期，具体功能待核实|暂未确认|暂未确认|other
onchain-whale-tracker-pc-desktop/.github|自述为链上大额资金追踪工具的介绍仓库|公开简介未说明|公开简介未说明|other
ravensclawx/HBLauncher|SmileBASIC 自制程序启动器及 GPU 应用开发资料|自制程序和开发配置|程序启动结果及 SDK 示例|games
ivarvong/lantern|把代码执行过程做成可逐步播放的动画讲解|TypeScript 代码和讲解内容|可逐步演示的 SVG 动画|devtools
verity-mods/verity-enhanced|Minecraft Verity 模组的非官方增强版|支持版本的游戏及模组配置|新增剧情场景与游戏体验|games
hiyfoeorihly/ram-purge|用于 Windows 内存占用管理的工具|清理指令或设定阈值|内存管理操作及状态变化|systems
jchumcrfbluw/roblox-solara-executor-pc-desktop|自述为 Roblox 脚本执行器的项目|公开简介未说明|公开简介未说明|games
`;
export const editorial=Object.fromEntries((rows+discovered).trim().split('\n').filter(Boolean).map(line=>{const [name,summary,input,output,domain]=line.split('|');return [name.toLowerCase(),{summary,input,output,...(domain?{domain}:{}),source:'https://github.com/'+name,basis:'仓库公开简介，输入输出为典型使用方式',...(/暂未确认|公开简介未说明|简介未列明|待阅读项目文档确认/.test(input)?{pending:true}:{})}]}));
