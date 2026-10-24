# GitHub 开源榜

跨领域的 GitHub 公开项目排行榜，覆盖 AI、开发工具、网站与前端、数据库、系统运维、办公效率、影音创作、游戏和学习资料。AI 与其他领域可分别浏览；Skills、插件、MCP 为另一维度的类型筛选。

## 运行

需要 Node.js 22+，无第三方运行依赖。

```sh
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

## 独立公开部署（最终目标）

网站运行不需要 GPT、OpenAI API 或访客登录。将本目录放到专用公开 GitHub 仓库的 main 分支，在仓库 Settings → Pages 中将 Source 设为 GitHub Actions。

`.github/workflows/pages.yml` 已准备好：首次推送、手动执行和每六小时（UTC 的 00:17、06:17、12:17、18:17）采集，测试后将快照保存到 Git，再部署 dist 到 GitHub Pages。使用该仓库自动提供的 GITHUB_TOKEN，无需另建 Token。北京时间为 02:17、08:17、14:17、20:17；GitHub 调度可能延迟。

工作流仅写入自身仓库的数据文件和 Pages，不包含 GPT 依赖。首次启用需仓库管理员允许 Actions 写入、选择 Pages 的 Actions 发布源。发布后要确认第一次 Actions 任务成功和 Pages 地址可访问，之后才能声称自动更新已启用。

参考：[GitHub Pages 官方自定义工作流文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。

## 临时验收站

`.openai/hosting.json` 记录先前 Sites 验收站的身份，只用于更新原先已打开的验收地址。其私有访问不代表独立公开部署已经完成。不得为方便验收更改共享权限，独立部署也不覆盖无关的现有 GitHub 项目。

## 数据来源与验证限制

Star、日期和英文原始介绍来自 GitHub 公开 API；中文说明对应的源码链接在详情中。没有把 Star 视为质量、安全或实际效果的认证。自动采集不会下载或运行榜单项目。

