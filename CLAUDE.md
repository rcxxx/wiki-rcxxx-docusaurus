# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供指导。

## 项目概述

这是一个基于 Docusaurus v3 的静态 wiki 站点（`wiki-rcxxx`），语言为中文（`zh-Hans`），包管理器使用 `yarn`。

## 常用命令

- `yarn start` — 启动本地开发服务器
- `yarn build` — 构建静态输出到 `build/` 目录
- `yarn serve` — 本地预览已构建的 `build/` 目录
- `yarn deploy` — 部署到 GitHub Pages（推送到 `gh-pages` 分支）。根据认证方式使用 `USE_SSH=true yarn deploy` 或 `GIT_USER=<username> yarn deploy`
- `yarn clear` — 清除 Docusaurus 缓存

本项目没有测试或 lint 脚本。使用 `yarn build` 验证改动是否能正确编译。

## 架构

### 内容来源

`docusaurus.config.js` 通过 classic preset 和额外插件配置了三个内容来源：

1. **默认文档** (`docs/`) — 路径 `/docs/`，侧边栏 `sidebars/sidebars.js`。目前只包含 `docs/README.md`。

2. **Stack 文档** (`stack/`) — 路径 `/stack/`，侧边栏 `sidebars/sidebars_stack.js`。这是 wiki 的主要内容。侧边栏定义了三个独立导航区域：`👀 CV`、`🤖 Robot`、`⌨️ Software`。仅此实例启用了 `remark-math` 和 `rehype-katex`（默认文档未启用）。

3. **博客** — 路径 `/blog/`，内置于 classic preset。

### 在 `stack/` 下添加新内容

添加新的 markdown 文件时，必须做**两件事**：

1. **添加 frontmatter**，包含 `id`、`title` 和 `sidebar_label`。所有现有文件都遵循此约定：
   ```yaml
   ---
   id: path_planning_grid_map
   title: 二维栅格地图
   sidebar_label: Grid Map
   ---
   ```

2. **在 `sidebars/sidebars_stack.js` 中注册**，使用 frontmatter 中的 `id`（而非文件路径）。如果 `id` 与文件路径不同，侧边栏必须使用 `id`。构建失败并提示 "Couldn't find a valid sidebar item" 时，通常是因为侧边栏引用了路径而非文件中定义的 `id`。

**ID 命名风格**：统一使用连字符（如 `path-planning-grid-map`、`cc-classes-and-objects`）。

**未注册目录：** `stack/ai/` 和 `stack/system/` 已存在于磁盘但尚未注册到 `sidebars_stack.js`，其中的文件不会出现在导航中。

### 导航栏链接

导航栏下拉菜单 `🗃️ Wiki` 链接到分类索引页（`/stack/category/algorithm`、`/stack/category/perception`、`/stack/category/PID`）。这些路径硬编码在 `docusaurus.config.js` 中。如果重构 `sidebars_stack.js` 中的分类结构，需要验证这些路径仍然有效 — 因为 `onBrokenLinks: 'throw'`，无效链接会导致构建失败。

### 插件与功能

- **数学公式 (KaTeX)：** `remark-math` + `rehype-katex`，仅对 `stack` 文档启用。KaTeX CSS 通过 CDN 全局加载。
- **Mermaid 图表：** `@docusaurus/theme-mermaid`，主题：`light: 'neutral'`、`dark: 'forest'`。
- **Sass：** `docusaurus-plugin-sass`。
- **自定义组件：** `src/components/` 包含 `BrowserWindow` 和 `HomepageFeatures`/`HomepageInfo`。首页为 `src/pages/index.js`，样式在 `src/css/custom.css`。

### GitHub Pages 配置

`docusaurus.config.js` 中的 `organizationName`（'facebook'）和 `projectName`（'docusaurus'）为占位值，仅影响 `yarn deploy` 行为。

## Markdown 格式规范

编写或修改 `stack/` 下的文档时，遵循以下规则：

- **Frontmatter**：必须包含 `id`（连字符风格）、`title`、`sidebar_label`
- **空格**：中文与英文/数字之间加空格；特殊字符（链接、加粗等）前后加空格；数字与单位之间不加
- **标点**：中英文混排用中文全角标点；整句英文用英文半角标点；中文引号用直角引号「」
- **段落**：首行不缩进，段与段之间空一行
- **列表**：使用无序列表代替有序列表
- **`$$` 公式**：前后各空一行，与正文分隔；多行对齐公式使用 `\begin{aligned}` 环境

详细规范可运行 `/docusaurus-markdown-formatting`。

## Git Commit 规范

使用 Gitmoji 前缀区分提交类型，格式为 `<emoji> [日期]: 简要描述`。

常用 emoji：

| Emoji | 含义 |
|---|---|
| ✨ | 新功能/新内容 |
| 📝 | 文档更新 |
| 🐛 | 修复 bug |
| 💄 | UI/样式调整 |
| ♻️ | 重构 |
| ⬆️ | 升级依赖 |
| ➕ | 添加依赖 |
| 🔧 | 配置修改 |
| 🗑️ | 删除文件/代码 |
| 🚀 | 部署 |

示例：`📝 [2026-04-27]: update plugins documentation`
