# 单个 Skill 漏收录：根因与修复

用户指出固定补十项不能解决新技能继续漏收录的问题。首次实现有三个相互叠加的缺陷：

1. 仓库采集只保存 repository 元数据，没有读取文件树和 SKILL.md，实体只有 repository。
2. 单个 Skill 页面使用封闭的十项数组，搜索和仓库关联也只读取该数组。
3. 通用仓库榜搜索不是技能仓库发现器；增大搜索条数无法完成一仓多技能拆分。

可执行复现：`node --test test/skills-dynamic.test.mjs`。修复前，传入包含全新技能的动态目录仍返回 undefined，新仓库的两个技能返回 0。修复后读取生成目录，两个断言通过。

## 修复数据流

GitHub 通用仓库搜索 + 技能 Topic 搜索 + 可配置仓库源 → 候选仓库 → 固定提交 revision → Git Tree → 每个合法 SKILL.md 的 YAML name/description → `dist/data/skills.json` → 页面搜索、排序、所属仓库关联。

- 技能身份为 repository ID + 文件路径，不以名称去重。一仓多项、同名不同路径均独立保留。
- 支持根目录和任意深度；递归 Git Tree 截断时逐子树遍历。只读取普通文件，不执行仓库代码。
- 使用 yaml 解析器，校验根字段和预算；无效文件不根据目录名伪造名称。
- 固定 revision；同 blob SHA 且旧元数据有效时复用已解析内容。
- 不完整或失败保留旧记录并标记 stale，完整扫描才确认删除；API 预算耗尽不把未扫描仓库标为已检查。
- 按扫描时间轮转候选，新仓库分批进入；初始主要来源在完成首次扫描前优先。覆盖数和扫描状态公开展示，不宣称全站完整。
- `scripts/skill-copy.json` 仅保存已整理的中文用途，不参与发现和筛选。删除全部中文条目不应减少发现的技能数量。

## 指标

GitHub 没有通用仓库安装次数。skills.sh installs 为其技能 CLI 统计，不是 Star、Release 附件下载次数、clone traffic 或 GitHub App 授权数。

单个技能安装维度包含 source/status/value/observed_at，当前 value=null、status=not_connected。未取得受支持的安装数据接入方式前，显示“未接入”，不把未知记0，不按父仓库Star排序。已知项目可链接官方平台条目，其他条目不猜测平台映射。

来源：https://agentskills.io/specification 、https://docs.github.com/en/rest/git/trees 、https://www.skills.sh/docs/api 、https://docs.github.com/en/rest/releases/assets 、https://docs.github.com/en/rest/metrics/traffic 。
