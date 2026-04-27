---
name: git-commit-convention
description: When creating git commits, follow the project commit convention with emoji prefix and type tag
---

# Git Commit 规范

## 格式

```
<emoji> <type>: 简要描述
```

## 类型对照表

| Emoji | Type | 含义 |
|---|---|---|
| ✨ | feat | 新功能/新内容 |
| 📝 | docs | 文档更新 |
| 🐛 | fix | 修复 bug |
| 💄 | style | UI/样式调整 |
| ♻️ | refactor | 重构 |
| ⬆️ | upgrade | 升级依赖 |
| ➕ | deps | 添加依赖 |
| 🔧 | config | 配置修改 |
| 🗑️ | remove | 删除文件/代码 |
| 🚀 | deploy | 部署 |

## 规则

- 一次提交选择**一个**最匹配的类型
- 描述简洁明了，说明「做了什么」而非「改了哪个文件」
- 多条改动在 body 中用 `- ` 列出

## 示例

```
📝 docs: update plugins documentation

- Complete plugins doc with usage guides
- Add OpenClaw gateway config section
```

```
🐛 fix: resolve KaTeX rendering warnings

- Remove zero-width spaces in pid-optimization.md
- Wrap multi-line equations in aligned environment
```

```
✨ feat: add local search plugin and AI Agent sidebar
```
