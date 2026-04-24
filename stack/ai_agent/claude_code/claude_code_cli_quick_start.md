---
id: claude-code-cli-quick-start
title: 安装 Claude Code 命令行工具
sidebar_label: Qucik Start
---

## About
> Claude Code 是一个代理编码工具，可以读取你的代码库、编辑文件、运行命令，并与你的开发工具集成。可在终端、IDE、桌面应用和浏览器中使用

## 准备工作
- 本文所使用的系统为 Ubuntu 20.04.6 LTS

### API Key
安装 claude 之前需要先准备好其支持的 API Key，如 `Anthropic`、 `Kimi`、 `Gemini` 等

- 获取 API Key 之后将其配置进环境变量

``` bash
# 填入你的 key
echo 'export ANTHROPIC_API_KEY="your-key-here"' >> ~/.bashrc
# 如果你使用了第三方代理/网关而非 Anthropic 官方 API
echo 'ANTHROPIC_BASE_URL=""' >> ~/.bashrc
echo 'export CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1' >> ~/.bashrc

```

### Nodejs
- 安装 node
``` bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

- 假设你已经安装了 node，但是版本不满足
``` bash
# 安装 nvm（Node 版本管理器）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# 安装并使用 Node.js 20（LTS）
nvm install 20
nvm use 20
nvm alias default 20

# 验证
node -v  # 应显示 v20.x.x
```

## 安装 claude
``` bash
npm install -g @anthropic-ai/claude-code
```

## 使用 claude
- 启动，直接进入某项目的目录内

``` bash
claude

### 即可启动

# claude 
╭─── Claude Code v2.1.107 ─────────────────────────────────────────────────────╮
│                                                    │ Tips for getting        │
│                    Welcome back!                   │ started                 │
│                                                    │ Run /init to create a … │
│                       ▐▛███▜▌                    │ ─────────────────────── │
│                      ▝▜█████▛▘                  │ Recent activity         │
│                        ▘▘ ▝▝                    │ No recent activity      │
│                                                    │                         │
│ Opus 4.6 (1M context) with hi… · API Usage Billing │                         │
│                                                    │                         │
╰──────────────────────────────────────────────────────────────────────────────╯

────────────────────────────────────────────────────────────────────────────────
❯  
────────────────────────────────────────────────────────────────────────────────
  [Opus 4.6 (1M context)] ░░░░░░░░░░ 0%                                       
```

详细的使用教程可以参考
- [Claude Code Docs](https://code.claude.com/docs/zh-CN/overview)

## 参考
- **[Claude Code Docs](https://code.claude.com/docs/zh-CN/overview)**