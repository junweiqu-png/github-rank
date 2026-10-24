// Verified by reading these repositories' public README files on 2026-10-24.
const rows=`
chenxi2015/aiworkstation|本地优先的个人知识工作台，结合网页采集、笔记与 AI 创作|网页内容、图片、文件和研究问题|本地资料库、笔记、研究报告或创作内容|ai
ultraworkers/claw-code|由 Agent 维护的 Rust 命令行 Agent 执行环境展示项目|开发任务和模型、执行环境配置|命令行 Agent 的执行过程与成果|ai
google-research/harness2|在不改变模型权重的情况下迭代改进 Agent 执行环境的研究框架|任务、基础模型、工具及执行配置|改进后的执行配置与实验评估结果|ai
openai/math|发布内部模型生成的数学论文与证明材料的研究资料库|读者选择的数学主题或论文|可查阅的论文、证明材料及部分形式化验证文件|learning
openai/php2shell-checker|根据网站头信息或本机 PHP 版本判断补丁状态|网站地址或本机 PHP 版本|版本是否满足补丁要求的判断，不执行漏洞探测|devtools
oosexgang/hackios-xnu-kernel|研究在指定 Android 硬件或模拟器运行 XNU 内核的项目|支持的硬件或 QEMU、内核与系统配置|实验系统启动结果，支持范围以 README 为准|systems
dex-tool-best/.github|README 自述为链上交易跟单工具的介绍与下载页|README 所称的钱包、交易与策略配置|README 所称的跟单交易和通知；未实际验证|other
aotoycffyxns/delta|README 自述为运行 Roblox 脚本的执行器|游戏环境和 Lua 脚本|README 所称的游戏内脚本执行结果；未实际验证|games
df-tools-bn/.github|README 自述为扫描去中心化交易所价差的工具介绍页|行情、交易配置和策略参数|README 所称的价差扫描与交易结果；未实际验证|other
tytpaskanvdc/cross-exchange-arbitrage-bot-pc-desktop|README 自述为跨交易所价差扫描与执行工具|交易所行情和交易配置|README 所称的价差及交易记录；未实际验证|other
onchain-trading-bot/.github|README 自述为集成多种链上交易策略的工具介绍页|钱包、行情和策略配置|README 所称的交易记录及通知；未实际验证|other
xynbspqmochf/.github|README 自述为筛选和追踪链上钱包的工具介绍页|链上钱包数据与筛选条件|README 所称的钱包评分、持仓和提醒；未实际验证|other
akhiranandan-04/neverlose|关于 CS:GO 第三方工具的非官方社区说明站，仓库不含程序源码|读者选择的配置与使用问题|社区说明、界面概念和外部分发链接|games
onchain-whale-tracker-pc-desktop/.github|README 自述为链上交易工具介绍页，内容与仓库名不完全对应|README 所称的钱包、行情和策略配置|README 所称的交易与通知；实际功能未验证|other
jchumcrfbluw/roblox-solara-executor-pc-desktop|README 自述为 Roblox Lua 脚本执行器的介绍与下载页|游戏环境和 Lua 脚本|README 所称的游戏内执行结果；未实际验证|games
`;
export const readmeEditorial=Object.fromEntries(rows.trim().split('\n').map(line=>{const [name,summary,input,output,domain]=line.split('|');return [name.toLowerCase(),{summary,input,output,domain,source:'https://github.com/'+name+'#readme',basis:'根据仓库 README 整理，输入输出为典型使用方式；未运行项目'}]}));
