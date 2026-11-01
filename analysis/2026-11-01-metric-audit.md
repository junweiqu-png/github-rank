# Skill 安装量与 GitHub 仓库 Star 对账

本次核查的问题是“为何用户的 AI Skills TOP10 未逐项出现，且数字不同”。这是指标和粒度核查，不是同指标的数值比较。

- 线上数据版本：`2026-10-31T17:18:15.011Z`（北京时间 2026-11-01）。共 373 个唯一仓库记录。
- 采集程序原来每个创建周期仅取 15 个 GitHub 搜索结果，再保留已知仓库；它不是全量 GitHub 索引。
- 实际显示绑定为 `r.stars`，源于 GitHub API 的 `stargazers_count`；粒度是 repository。
- 数据已包含 `mattpocock/skills`（308114 Star）、`vercel-labs/skills`（37404 Star）和 `anthropics/skills`（185776 Star）。7 个用户列出的 Matt 技能共用一个仓库，不应复制这份仓库 Star 作为 7 个技能各自的热度。
- `vercel-labs/agent-browser` 未在核查版本中出现，属于实际仓库收录缺口。
- 用户提供的百万级数字与 skills.sh 的安装量指标对应。该站按单个 Skill 统计 CLI 遥测中去重后的安装次数，不是独立使用人数、调用次数或 GitHub Star。
- 用户旧列表未附日期和原始网址，不能断言它直接来自 skills.sh，也不将旧数值标为当前值。

一手来源：

- https://www.skills.sh/docs/faq
- https://www.skills.sh/docs/api
- https://www.skills.sh/vercel-labs/skills/find-skills
- https://www.skills.sh/mattpocock/skills/grill-me
- https://www.skills.sh/mattpocock/skills
- https://www.skills.sh/vercel-labs/agent-browser/agent-browser
- https://www.skills.sh/anthropics/skills/frontend-design

核查时详情页分别显示 Installs 与 GitHub Stars。find-skills 页面安装量约 4.1M、仓库 Star 约 37.3K，grill-me 页面安装量约 1.5M、仓库 Star 约 308.3K；这些是当次读取的页面近似值，存在页面缓存及观测时间差，不用于站内硬编码。

最小修复：

1. 主榜明确写“已收录仓库 Star 榜”和“仓库总 Star”，首屏标注非全量、安装次数不能与仓库 Star 直接比较。
2. 补录用户列出的十项单个 Skill 为可搜索目录，保留所属仓库、中文用途、输入输出和官方详情链接；目录不冒充安装量 TOP10。
3. 提供官方安装榜入口。官方 API 要求 Vercel OIDC，在未具备支持的接入方式前不匿名试探接口，不编造安装数字。
4. 显式追踪这十项技能的四个父仓库；搜索发现单次上限增至 100，继续保留非全量限定。
5. 保留用户要求的三天更新间隔，历史仓库快照不追改为技能安装历史。

验证：`node --test` 检查十项映射、技能检索和不将仓库 Star 赋给单个 Skill。该核查未声称整个 GitHub 已被收录，也未对任意技能运行效果作保证。
