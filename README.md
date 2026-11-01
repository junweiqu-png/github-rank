# GitHub 开源榜

## 数据口径与收录范围

主榜按 **整个 GitHub 仓库的 Star** 排名，不是单个 Skill 的安装量榜，尚未覆盖 GitHub 全站。发现策略是种子仓库加各创建周期最多 100 个搜索结果。

“单个 Skill 目录”现在通过 GitHub 文件树自动发现根目录及任意嵌套路径的合法 `SKILL.md`，读取 YAML 名称与描述后生成 `dist/data/skills.json`。它不再有固定十项名单，新仓库、新技能会按同一流程进入目录。以仓库 ID + 文件路径标识技能，同名或同仓多项不合并。

项目榜的类型名为 **Skill 相关仓库**：每项仍是一个仓库，可为单项 Skill、Skill 合集或相关工具。最新项目榜按仓库 ID 关联技能目录，已发现 Skill 的仓库自动纳入此筛选，同时保留原来的应用、插件等主类型。点击“展开 N 项 Skill”只看该仓库内已收录的技能；Skill 中的所属仓库按钮可以返回仓库详情。未展开不代表没有 Skill。历史项目快照保留当时分类，不使用当前扫描结果回填；单项 Skill 目录始终展示最新扫描数据。分类关联修复见 [两种清单核查](analysis/2026-11-01-skill-view-consistency.md)。

安装量维度明确标为 **skills.sh 安装量**，不叫 GitHub 安装次数。GitHub 没有通用仓库安装统计；当前未接入受支持的 skills.sh 认证源，值保持 null 并显示“未接入”，排序入口禁用，不拿 Star、下载或克隆次数填充。

仓库源配置在 `scripts/skill-sources.json`，并通过 Topic、仓库名、描述和历史发现进入候选。每轮最多处理 80 个候选、700 个需要重读的正文，按扫描时间轮转；完整扫描前优先处理初始主源。文件内容 hash 不变时不重读。截断会遍历子树，失败保留旧记录，只有完整成功才能确认删除。页面公开候选/本轮完成数量和旧记录状态，不宣称全站完整。

`scripts/skill-copy.json` 只提供部分已核对的中文说明，不参与发现；未整理的描述显示原文及文档入口，不编造输入输出。根因与回归证据见 [技能发现修复](analysis/2026-11-01-discovery-root-cause.md)。

官方安装数据 API 需要受支持的身份认证，当前没有将它作为匿名接口接入，也没有硬编码旧截图数字。详细对账见 [指标核查记录](analysis/2026-11-01-metric-audit.md)。

跨领域的 GitHub 公开项目排行榜，覆盖 AI、开发工具、网站与前端、数据库、系统运维、办公效率、影音创作、游戏和学习资料。AI 与其他领域可分别浏览；Skills、插件、MCP 为另一维度的类型筛选。

## 运行

需要 Node.js 22+。YAML 解析采用锁定依赖，静态页面仍可独立运行。

```sh
npm ci --ignore-scripts
npm run collect
npm test
npm start
```

访问 http://localhost:4173。所有页面资源与数据使用相对路径，可托管在 GitHub Pages 的项目子路径。

## 排名与中文说明

- 按仓库创建时间筛选累计、年、季度、月、周、日；所有榜单按当前数据版本中的总 Star 排名，同分按仓库名排序。
- 使用北京时间，周一开周，自然年与自然季度。
- 当前是已收录仓库排名，尚不是 GitHub 全站的完整索引。发现查询不限制 AI 主题。
- 每条展示中文用途、典型输入和典型输出。根据公开简介或 README 整理，保留原文和来源；不将项目自述视作已运行验证。
- 信息不足的项目明确标注待核实，不根据名字猜测能力。新发现项目在完成中文编辑前显示说明待整理。
- `scripts/editorial.mjs`、`general-projects.mjs` 与 `readme-editorial.mjs` 保存中文说明；采集时输出 `dist/data/editorial.json`。
- `dist/data/latest.json` 为最新观测数据；每日北京时间第一次成功采集生成不可覆盖的 `dist/data/history/YYYY-MM-DD.json`。
- 请求失败保留旧记录及原始采集时间；完全没有新数据时退出失败，不覆盖最新版本。

## 独立公开部署

当前地址：https://junweiqu-png.github.io/github-rank/ 。

网站运行不需要 GPT、OpenAI API 或访客登录。将本目录放到专用公开 GitHub 仓库的 main 分支，在仓库 Settings → Pages 中将 Source 设为 GitHub Actions。

`.github/workflows/pages.yml` 已准备好：首次推送、手动执行和每隔至少三天采集，测试后将快照保存到 Git，再部署 dist 到 GitHub Pages。使用该仓库自动提供的 GITHUB_TOKEN，无需另建 Token。每天北京时间 20:17 检查距上次采集是否满 72 小时，未满则跳过采集与发布；因此按三天间隔更新，不受跨月影响。推送代码或手动执行仍会立即更新。GitHub 调度可能延迟。

工作流仅写入自身仓库的数据文件和 Pages，不包含 GPT 依赖。首次启用需仓库管理员允许 Actions 写入、选择 Pages 的 Actions 发布源。发布后要确认第一次 Actions 任务成功和 Pages 地址可访问，之后才能声称自动更新已启用。

纯页面修改可在提交信息使用 `[skip collect]`：跳过该次推送的重新采集，仍执行全部测试并发布现有数据；定时与手动更新不受此标记影响。

参考：[GitHub Pages 官方自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 数据来源与验证限制

Star、日期和英文原始介绍来自 GitHub 公开 API；中文说明对应的源码链接在详情中。没有把 Star 视为质量、安全或实际效果的认证。自动采集不会下载或运行榜单项目。

