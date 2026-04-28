---
id: claude-code-cli-plugins
title: Claude Code 实用插件
sidebar_label: plugins
---

## 插件管理

```bash
# 添加插件市场
/plugin marketplace add <user/repo>
# 安装插件
/plugin install <plugin-name>@<marketplace>
# 卸载插件
/plugin uninstall <plugin-name>@<marketplace>
# 重新加载
/reload-plugins
```

---

## 插件推荐

### superpowers

- [obra/superpowers](https://github.com/obra/superpowers)

Claude Code 的核心工作流增强插件，提供了一套结构化的开发方法论。安装后会自动在合适的场景触发对应 skill。

包含的 skills：

| Skill | 用途 |
|---|---|
| `brainstorming` | 在实现功能前进行需求探索和方案设计，生成设计文档 |
| `writing-plans` | 将需求或设计文档转化为分步实施计划 |
| `executing-plans` | 按检查点执行实施计划 |
| `test-driven-development` | TDD 流程，先写测试再写实现 |
| `systematic-debugging` | 系统化调试，排查 bug 和异常行为 |
| `requesting-code-review` | 完成功能后请求代码审查 |
| `receiving-code-review` | 收到 review 反馈后的严谨处理流程 |
| `verification-before-completion` | 完成任务前运行验证命令确认结果 |
| `using-git-worktrees` | 在独立 worktree 中进行特性开发 |
| `finishing-a-development-branch` | 开发分支完成后的集成选项（merge / PR / cleanup） |
| `dispatching-parallel-agents` | 并行派发多个独立子任务 |
| `subagent-driven-development` | 用子 agent 执行实施计划中的独立任务 |
| `writing-skills` | 创建和编辑自定义 skills |

### claude-hud

- [jarrodwatts/claude-hud](https://github.com/jarrodwatts/claude-hud)

在状态栏实时显示上下文窗口使用率、token 消耗、任务状态等信息。

```bash
/plugin marketplace add jarrodwatts/claude-hud
/plugin install claude-hud@claude-hud
# 配置
/claude-hud:setup
/claude-hud:configure
```

### planning-with-files

- [OthmanAdi/planning-with-files](https://github.com/OthmanAdi/planning-with-files)

Manus 风格的文件规划系统，将复杂任务拆解为结构化计划。会创建三个文件：

- `task_plan.md` — 任务计划和步骤
- `findings.md` — 调研发现
- `progress.md` — 进度追踪

```bash
# 开始规划
/planning-with-files:plan
# 中文版
/planning-with-files:plan-zh
# 查看进度
/planning-with-files:status
```

支持 `/clear` 后自动恢复会话。

### code-simplifier

- 来源：`claude-plugins-official`

审查已修改的代码，检查是否有重复、冗余或低效的部分并自动修复。

```bash
/simplify
```

### skill-creator

- 来源：`claude-plugins-official`

创建、修改和优化自定义 skills，支持性能评估和触发准确度优化。

```bash
/skill-creator:skill-creator
```

### ui-ux-pro-max

- [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)

UI/UX 设计辅助插件，包含 50+ 设计风格、161 套配色方案、57 组字体搭配。支持 React、Vue、Svelte、Tailwind、Flutter 等多种技术栈。

```bash
/ui-ux-pro-max:ui-ux-pro-max
```

### caveman

- [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman)

精简输出风格插件，去掉冗词、客套、废话，保留技术实质。支持多档位切换。

```bash
# 切换模式
/caveman lite    # 去冗词，保留完整句子
/caveman full    # 去冠词，片段句，经典穴居人
/caveman ultra   # 极致缩写，箭头表因果
```

输入 `stop caveman` 或 `normal mode` 恢复正常输出。

---

## 已添加的市场（未安装的可选插件）

### claude-plugins-official

- [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)

Anthropic 官方插件仓库，除已安装的外还包括：

| 插件 | 用途 |
|---|---|
| `commit-commands` | Git 提交、推送、创建 PR 的快捷命令 |
| `pr-review-toolkit` | PR 审查工具 |
| `code-review` | 代码审查 |
| `hookify` | 可视化管理 Claude Code hooks |
| `claude-md-management` | CLAUDE.md 文件维护和优化 |
| `feature-dev` | 特性开发全流程引导 |
| `frontend-design` | 前端设计和实现辅助 |
| `plugin-dev` | 插件开发工具 |
| `agent-sdk-dev` | Agent SDK 应用开发 |
| `mcp-server-dev` | MCP Server 开发 |
| `session-report` | 会话报告生成 |
| `ralph-loop` | 循环执行任务 |
| `security-guidance` | 安全最佳实践指导 |

### 其他已添加市场

| 市场 | 说明 |
|---|---|
| [obra/superpowers-marketplace](https://github.com/obra/superpowers-marketplace) | superpowers 相关扩展 |
| [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) | Karpathy 风格的 AI/ML 开发 skills |

---

## 非插件工具

### rtk（Rust Token Killer）

- [rtk-ai/rtk](https://github.com/rtk-ai/rtk)

Token 优化代理，通过 hook 自动拦截 CLI 命令（如 `git status`、`ls` 等），过滤冗余输出以节省 60-90% 的 token 消耗。不是 Claude Code 插件，而是独立安装的 CLI 工具。

```bash
# 安装
cargo install rtk
# 查看节省统计
rtk gain
```

### claude-context

- [zilliztech/claude-context](https://github.com/zilliztech/claude-context)

上下文管理工具。

### code-review-graph

- [tirth8205/code-review-graph](https://github.com/tirth8205/code-review-graph)

代码审查可视化工具。
