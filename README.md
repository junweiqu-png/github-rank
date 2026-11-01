# GitHub 开源榜

独立公开站点：https://junweiqu-png.github.io/github-rank/ 。无需GPT、OpenAI API或访客登录。

## 统一榜单

覆盖AI及其他领域的已收录GitHub公开项目。所有类型使用同一个项目榜，按仓库总Star排名。Skills类型统一包含已验证的单项Skill仓库和含多项Skill的仓库；具体技能嵌套在所属仓库行及详情下，不另设独立目录，不重复计算仓库Star。搜索单项技能名也能找到所属仓库。

累计、年、季度、月、周、日筛选的是仓库创建日期，排名指标始终为该数据版本的总Star。使用北京时间、周一开周和自然季度。历史快照只保存上线后的实际观测，不补造过去数据，也不注入未来扫描结果。

## 自动发现和扫描

Skills发现规则配置在`scripts/skill-sources.json`。Topic、仓库名、描述、README中的SKILL.md或规范链接均可产生候选；搜索自动分页，超过单次1000条限制时按创建时间分片。未完成的页码、分片与查询保存在`dist/data/discovery-state.json`。仓库种子仅用于启动，不是收录白名单，不存在单项Skill固定名单。

候选不等于已验证的Skill仓库。扫描根目录和任意嵌套路径的合法SKILL.md，解析严格YAML的name与description；有合法文件才确认Skills分类。完整扫描无有效文件与未扫描、失败分开记录。按仓库ID及路径标识技能，同名不同来源分别保留。

GraphQL批量核对仓库身份、固定提交和Star；REST读取文件树，正文来自固定提交的公开raw文件。树截断时遍历子树。文件树、子树队列、无效文件SHA及有效记录均可恢复；每个仓库获得公平读取额度，多轮处理大仓库，失败保留旧观测，不执行榜单项目中的代码或技能指令。

核心API额度不足会保存队列，已有文件清单仍可继续解析。每轮读取额度限制本轮工作，不永久截去后续文件。`skills.json`及页面公开候选、累计检查、累计完成、待处理和失败数。`collection-status.json`记录发现与扫描覆盖以及请求统计。

这些规则可以扩大自动收录，但不是GitHub全站索引。缺乏可检索信号的仓库仍可能漏收；API限额和待扫队列明确披露，不以一轮查询完成冒充全站完成。根因与修复见[统一Skills与重扫](analysis/2026-11-01-unified-skills-rescan.md)。

## 指标与说明

GitHub Star即仓库星标数。GitHub没有通用安装次数。skills.sh安装统计是独立来源，当前未接入受支持的认证源；缺失值为null，不填0，不用Star、下载量或克隆次数替代。官方安装数据链接保留在已核实技能下面。

部分项目和Skill已有中文用途、输入和输出说明。未整理内容明确显示原文或待核实，不根据名字编造能力。中文编辑不参与自动收录判断。详见[指标核查](analysis/2026-11-01-metric-audit.md)。

## 运行

需要Node.js 22+：

```sh
npm ci --ignore-scripts
npm test
npm run collect
npm start
```

本地访问http://localhost:4173。页面资源使用相对路径，可托管于GitHub Pages项目子目录。

## 自动发布

GitHub Pages Source设为GitHub Actions。工作流使用仓库提供的GITHUB_TOKEN，测试通过后保存生成数据并发布dist。每天北京时间20:17检查最新采集是否已满72小时，满足后自动更新；即每三天一次，调度可能延迟。

普通源码推送或手动执行会立即采集。纯页面修改可在提交信息加`[skip collect]`，跳过该次重新采集，仍执行测试和发布；定时与手动执行不受该标记影响。本次根因修复需要实际重扫，不使用跳过标记。
