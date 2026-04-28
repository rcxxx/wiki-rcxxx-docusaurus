---
name: docusaurus-markdown-formatting
description: When creating or editing Markdown or MDX documents in this project
---

# Docusaurus Markdown / MDX 格式规范

当创建或修改本项目中的 Markdown 或 MDX 文档时，严格遵循以下规范。

## Frontmatter

每个文档必须以以下格式开头：

```yaml
---
id: xxx-xxx
title: 文档标题
sidebar_label: 侧边栏标签
---
```

- `id` 统一使用连字符风格

## 段落

- 首行无需空格缩进
- 段与段之间空一行
- `$$` 公式块前后各空一行

## 空格规则

**需要添加空格：**
- 中文与英文、数字之间：`使用 Docusaurus 框架` 而非 `使用Docusaurus框架`
- 普通文本与特殊字符（链接、加粗、斜体等）之间
- 英文半角标点之后

**不添加空格：**
- 数字与单位之间：`10px` 而非 `10 px`

## 文本样式

- 中英文混排时，使用中文全角标点
- 中英文混排中，如果出现整句英文，则此句内使用英文半角标点
- 使用无序列表代替有序列表

## 标点符号

- 中文使用直角引号「」、『』
- 不重复使用标点符号

## 数学公式

- 行内公式使用 `$...$`
- 独立公式使用 `$$...$$`，前后各空一行
- 多行对齐公式使用 `\begin{aligned}...\end{aligned}` 环境，用 `&=` 对齐等号
- 避免在公式中插入零宽空格等不可见 Unicode 字符

## MDX 注意事项

Docusaurus v3 默认使用 MDX 引擎解析所有 `.md` 和 `.mdx` 文件，以下规则对两者均适用。

**花括号转义：**
- `{` 和 `}` 在 MDX 中是 JSX 表达式边界
- 正文中的字面花括号需要转义为 `{'{'}`、`{'}'}`
- 代码块（`` ``` ``）内的花括号无需转义

**注释：**
- 不使用 HTML 注释 `<!-- -->`，改用 JSX 注释 `{/* 注释内容 */}`

**JSX 语法：**
- 组件属性使用 `className` 而非 `class`
- 布尔属性写法：`<Component disabled />` 或 `<Component disabled={true} />`
- 自闭合标签必须写 `/>`：`<br />` 而非 `<br>`

**import / export：**
- `import` 和 `export` 语句必须在顶层（不缩进、不在列表或引用块内）
- 放在 frontmatter 之后、正文之前

**尖括号：**
- 正文中的 `<` 可能被解析为 JSX 标签开头
- 非标签用途时用 `&lt;` 替代，或包裹在行内代码中

**组件使用：**
- 项目中可用的自定义组件：`BrowserWindow`（`@site/src/components/BrowserWindow`）
- 使用前必须 `import`，不能直接写标签
