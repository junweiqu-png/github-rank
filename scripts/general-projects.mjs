const rows=`
microsoft/vscode|devtools|代码编辑器，可通过扩展支持多种语言|代码文件、项目和编辑操作|编辑后的代码及调试结果
neovim/neovim|devtools|可定制的终端代码编辑器|文本、代码和编辑命令|编辑后的文件
git/git|devtools|管理代码版本与多人协作的版本控制系统|文件改动和版本管理命令|提交历史、分支和合并结果
astral-sh/uv|devtools|快速管理 Python 包、依赖和运行环境|Python 项目和依赖配置|可复现的环境、依赖及运行结果
oven-sh/bun|devtools|集成运行、打包和测试的 JavaScript 工具链|JavaScript 或 TypeScript 代码|程序运行、打包或测试结果
rust-lang/rust|devtools|强调性能和内存安全的编程语言|Rust 源代码和编译配置|编译后的程序及诊断信息
golang/go|devtools|用于开发服务和工具的 Go 编程语言|Go 源代码|编译后的程序和运行结果
facebook/react|web|用组件构建网页和应用界面的开发库|组件代码、数据和用户操作|动态用户界面
vuejs/core|web|渐进式的网页用户界面开发框架|页面组件、数据和交互逻辑|可交互的网页界面
vercel/next.js|web|基于 React 构建完整网站的框架|页面组件、路由和服务端逻辑|可部署的网站与接口
vitejs/vite|web|前端开发服务器和构建工具|前端源代码和构建配置|开发预览及生产静态文件
tailwindlabs/tailwindcss|web|用实用样式类快速设计页面的 CSS 框架|页面标记、样式类和设计配置|页面所需的 CSS 样式
postgres/postgres|data|开源关系数据库|表结构、数据和 SQL 查询|存储的数据与查询结果
redis/redis|data|用于缓存、队列等场景的内存数据存储|键值数据和读写命令|快速读取的数据与操作结果
duckdb/duckdb|data|可嵌入程序的分析型数据库|CSV、Parquet 等数据和 SQL|数据分析查询结果
ClickHouse/ClickHouse|data|面向大规模数据分析的列式数据库|事件数据、表结构和 SQL|聚合统计与分析查询结果
pandas-dev/pandas|data|Python 中清洗和分析表格数据的工具库|表格数据和处理代码|清洗、汇总或转换后的数据表
kubernetes/kubernetes|systems|部署和管理容器应用的编排平台|容器镜像、集群及部署配置|运行中的服务和集群状态
docker/compose|systems|用一份配置启动多个容器服务|Compose 配置与容器镜像|互相连接的容器应用环境
caddyserver/caddy|systems|支持自动 HTTPS 的网站与反向代理服务器|域名、网站文件或上游服务配置|可访问的网站与代理入口
prometheus/prometheus|systems|收集和查询系统、应用监控指标|指标端点和采集规则|时序指标查询与告警信息
grafana/grafana|systems|把监控和业务数据展示成仪表盘|数据源、查询与面板配置|可交互的数据看板
syncthing/syncthing|productivity|在自己的多台设备间同步文件|需要同步的目录和设备配置|各设备中同步后的文件
AppFlowy-IO/AppFlowy|productivity|开源的文档、任务与知识管理工作区|笔记、文档和项目资料|可整理与协作的个人或团队工作区
immich-app/immich|media|在自己服务器上管理照片和视频|手机或电脑中的照片、视频|可浏览、检索和备份的媒体库
yt-dlp/yt-dlp|media|下载多个视频网站上的公开或获授权媒体|媒体网页地址和下载选项|下载的视频、音频或字幕文件
ffmpeg/ffmpeg|media|转换和处理音视频的命令行工具集|音视频文件及处理参数|转换、剪辑或编码后的媒体文件
godotengine/godot|games|开发二维和三维游戏的开源引擎|游戏场景、脚本与美术资源|可运行或导出的游戏
freeCodeCamp/freeCodeCamp|learning|通过课程与实践学习编程的开源平台|学习选择和练习代码|练习反馈及课程学习进度
EbookFoundation/free-programming-books|learning|整理免费编程书籍和课程资源的目录|学习主题或编程语言|相关书籍和课程链接
`;
export const general=rows.trim().split('\n').map(line=>{const [name,domain,summary,input,output]=line.split('|');return {name,domain,summary,input,output}});
