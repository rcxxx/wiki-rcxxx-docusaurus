---
id: openclaw-quick-start
title: Ubuntu24.04 + Docker + Ollama + OpenClaw 部署流程
sidebar_label: Quick Start
---

### 准备工作
- Ubuntu24.04 LTS

### 安装 docker

- [在 Ubuntu 上安装 Docker Engine](https://docs.docker.com/engine/install/ubuntu/)
- 如果已安装过 docker，可跳转至 [ollama 配置](#本地配置-ollama--qwen25-coder15b)

```bash
sudo apt remove $(dpkg --get-selections docker.io docker-compose docker-compose-v2 docker-doc podman-docker containerd runc | cut -f1)
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
# 以下命令一次执行
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
# 查看状态
sudo systemctl status docker
# 测试安装
sudo docker run hello-world
```

- 建议修改一下用户组，避免后续运行 docker 时有权限问题

```bash
# 修改用户组，之后即可不使用超级权限启用 docker
sudo usermod -aG docker $USER
newgrp docker
docker run hello-world
```

### 本地配置 ollama + qwen2.5-coder:1.5b

```bash
docker volume create ollama_data
docker run -d --name ollama --restart always -p 11434:11434 -v ollama_data:/root/.ollama ollama/ollama
curl http://localhost:11434/api/tags
# 终端输出如下
    $ {"models":[]}
```

- 下载 qwen2.5-coder:1.5b 并验证

```bash
docker exec -it ollama ollama run qwen2.5-coder:1.5b
# 将正常进入交互对话
    verifying sha256 digest 
    writing manifest 
    success 
    >>> 你好
    你好！有什么我可以帮忙的吗？

# /exit 可退出交互，也可如下列方式验证
curl http://localhost:11434/api/generate -d '{"model": "qwen2.5-coder:1.5b", "prompt": "Why is the sky blue?", "stream": false }'
# 终端输出如下
    $ {"model":"qwen2.5-coder:1.5b","created_at":"...","response":"The sky appears blue due to the scattering of sunlight in the atmosphere. The particles in the air ..."...}
```

- 查询 ollama 端口

```bash
docker ps
# 终端输出如下
    CONTAINER ID   IMAGE                              COMMAND                  CREATED       STATUS                  PORTS                                             NAMES
    0cf6d7e89d1c   ollama/ollama                      "/bin/ollama serve"      5 weeks ago   Up 5 weeks              0.0.0.0:11434->11434/tcp, [::]:11434->11434/tcp   ollama
```

- 查询模型列表

```bash
docker exec -it ollama ollama list
# 终端输出如下
    NAME                  ID              SIZE      MODIFIED    
    qwen2.5-coder:1.5b    d7372fd82851    986 MB    5 weeks ago
```

### 安装 OpenClaw

```bash
# 创建本地目录进行持久化存储
mkdir -p ~/workspace/openclaw

# 获取当前宿主机的 docker 组 ID（用于容器内有权限调用宿主机的 Docker）
DOCKER_GID=$(stat -c '%g' /var/run/docker.sock 2>/dev/null || echo 999)

# 启动 OpenClaw 容器
docker run -d \
  --name openclaw \
  --group-add $DOCKER_GID \
  --memory 2g \
  --memory-swap 4g \
  --cpus 2 \
  --log-opt max-size=10g \
  --log-opt max-file=3 \
  -p 18789:18789 \
  -v ~/workspace/openclaw:/home/node/.openclaw \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart unless-stopped \
  ghcr.io/openclaw/openclaw:latest
```

- `--group-add $DOCKER_GID` 和 `-v /var/run/docker.sock...`：这是 DooD（Docker-out-of-Docker）的核心配置，允许 OpenClaw 内部可以启动或管理它自己的子容器
- `--memory` / `--cpus`：限制容器最大使用 2 核 CPU 和 2GB 内存（含 swap 最多 4GB），防止单实例占用过多宿主机资源
- `-p 18789:18789`：映射本地 18789 端口（你可以根据需要修改冒号前面的数字）
- `-v ~/workspace/openclaw...`：把刚刚创建的本地目录挂载进容器作为用户的根工作区。配置、聊天历史、文件都会保存在这里

### 配置 OpenClaw

#### 配置模型

```bash
docker exec -it openclaw openclaw configure

$ openclaw configure

🦞 OpenClaw 2026.4.21 (unknown) — Running on your hardware, reading your logs, judging nothing (mostly).

┌  OpenClaw configure
│
◇  Where will the Gateway run?
│  Local (this machine)
│
◇  Select sections to configure
│  Model
│
◇  Model/auth provider
│  Custom Provider
│
◇  API Base URL
│  http://127.0.0.1:11434/v1
│
◇  How do you want to provide this API key?
│  Paste API key now
│
◇  API Key (leave blank if not required)
│  sk-xxx
│
◇  Endpoint compatibility
│  OpenAI-compatible
│
◇  Model ID
│  qwen2.5-coder:1.5b
│
◇  Verification successful.
│
◇  Endpoint ID
│  ollama
│
◇  Model alias (optional)
│  ollama
│
```

#### 配置网关

再次运行 `openclaw configure`，在 `Select sections to configure` 中选择 **Gateway**

```bash
docker exec -it openclaw openclaw configure

◇  Where will the Gateway run?
│  Local (this machine)
│
◇  Select sections to configure
│  Gateway
│
◇  Gateway listen address
│  0.0.0.0
│
◇  Gateway listen port
│  18789
│
◇  Default endpoint
│  ollama
│
```

- **Gateway listen address**：`0.0.0.0` 表示监听所有网络接口，允许外部访问；如仅本机使用可填 `127.0.0.1`
- **Gateway listen port**：与 `docker run` 时映射的端口保持一致（默认 `18789`）
- **Default endpoint**：选择前面配置模型时设定的 endpoint ID（如 `ollama`）

配置完成后，浏览器访问 `http://localhost:18789` 即可进入 OpenClaw Web UI

- 在 `~/workspace/openclaw/openclaw.json` 中可以找到 Web UI 需要的 Token

#### openclaw tui

- 可以通过命令行 tui 直接与龙虾对话

```bash
docker exec -it openclaw openclaw tui
#

🦞 OpenClaw 2026.4.21 (unknown) — Running on your hardware, reading your logs, judging nothing

[?u openclaw tui - ws://127.0.0.1:18789 - agent main - session main                                                                                                                                      
 connecting | idle                                                                                                                                                                                    
 agent main | session main | unknown | tokens ?
 ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
                                                                                                                                                                                                      
──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
```

可以直接使用

## 参考

- **[一文教你 OpenClaw Docker 部署并调用本地 Qwen3.5 9B 模型](https://jishuzhan.net/article/2031904754910167042)**
