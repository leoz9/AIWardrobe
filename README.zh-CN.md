<div align="center">

# 👕 AI 智能衣柜

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://ghcr.io/leoz9/aiwardrobe)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

**你的个人 AI 穿搭顾问与衣橱管理助手**

上传衣物照片、自动去除背景、AI 识别服装类别，并结合天气与风格偏好生成穿搭建议 — 全部集成在一个应用中。

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

---

<img src="docs/images/screenshot_landing.jpg" width="720" alt="AI 智能衣柜截图" />

</div>

## ✨ 核心特性

| 特性 | 描述 |
| :--- | :--- |
| **智能上传** | 上传衣服照片后，使用 `rembg` 自动去背景，并通过视觉模型识别类别、颜色和风格 |
| **天气穿搭** | 集成 Open-Meteo 免费全球天气接口，根据实时天气生成更合适的穿搭建议 |
| **虚拟衣柜** | 以结构化方式浏览、搜索和管理所有衣物 |
| **AI 推荐** | 支持 Gemini 和 OpenAI 风格接口，用于生成个性化穿搭方案 |
| **响应式界面** | 基于 Tailwind CSS，适配桌面、平板和手机 |

## 📸 界面截图

<div align="center">
<table>
<tr>
<td align="center"><img src="docs/images/screenshot_input.jpg" width="200" /><br /><b>录入新衣</b></td>
<td align="center"><img src="docs/images/screenshot_wardrobe.jpg" width="200" /><br /><b>我的衣橱</b></td>
<td align="center"><img src="docs/images/screenshot_recommendation.jpg" width="200" /><br /><b>AI 推荐</b></td>
<td align="center"><img src="docs/images/screenshot_detail.jpg" width="200" /><br /><b>穿搭详情</b></td>
</tr>
</table>
</div>

## 🏗️ 技术栈

<table>
<tr><td><b>前端</b></td><td>React + Vite + Tailwind CSS</td></tr>
<tr><td><b>后端</b></td><td>FastAPI + SQLite</td></tr>
<tr><td><b>AI</b></td><td>Google Gemini / OpenAI 兼容接口 + rembg</td></tr>
<tr><td><b>部署</b></td><td>Docker / Docker Compose（amd64 & arm64）</td></tr>
</table>

## 🚀 快速开始

### 前置要求

- **Node.js** `v20+` &nbsp;|&nbsp; **Python** `v3.10+`
- [Google Gemini API Key](https://aistudio.google.com/app/apikey) 或 OpenAI 兼容接口 Key

### 1. 克隆与配置

```bash
git clone https://github.com/leoz9/AIWardrobe.git
cd AIWardrobe
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入你的 API Key
```

### 2. 安装依赖

```bash
# 后端
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 前端
cd frontend && npm install && cd ..
```

### 3. 启动

```bash
# 一键启动（macOS/Linux）
chmod +x start.sh && ./start.sh

# Windows
start.bat
```

启动后访问：
- **前端页面:** http://localhost:5173
- **后端 API:** http://localhost:8000
- **API 文档:** http://localhost:8000/docs

<details>
<summary><b>手动启动（分别在两个终端）</b></summary>

```bash
# 终端 1：后端
cd backend && source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --reload --port 8000

# 终端 2：前端
cd frontend && npm run dev
```

</details>

## 🐳 Docker 部署

### 快速开始（本地构建）

```bash
cp backend/.env.example backend/.env
docker build -t aiwardrobe:local .
docker run -d --name ai_wardrobe -p 8000:8000 \
  --env-file backend/.env \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  -v $(pwd)/backend/data:/app/backend/data \
  aiwardrobe:local
```

### 使用预构建镜像

```bash
docker pull ghcr.io/leoz9/aiwardrobe:latest
docker run -d --name ai_wardrobe -p 8000:8000 \
  --env-file backend/.env \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  -v $(pwd)/backend/data:/app/backend/data \
  ghcr.io/leoz9/aiwardrobe:latest
```

### Docker Compose

```bash
git clone https://github.com/leoz9/AIWardrobe.git && cd AIWardrobe
cp backend/.env.example backend/.env  # 编辑 .env，填入你的 API Key
docker compose up --build -d
```

访问 http://localhost:8000 &nbsp;|&nbsp; API 文档 http://localhost:8000/docs

数据会持久化保存在 `backend/data` 和 `backend/uploads` 目录中。

## ⭐ Star History

<a href="https://www.star-history.com/#leoz9/AIWardrobe&type=date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=leoz9/AIWardrobe&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=leoz9/AIWardrobe&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=leoz9/AIWardrobe&type=Date" />
  </picture>
</a>

## 🤝 贡献

欢迎提交 [Issue](https://github.com/leoz9/AIWardrobe/issues) 或 [Pull Request](https://github.com/leoz9/AIWardrobe/pulls) 来帮助改进这个项目。

## 📄 许可证

[MIT](LICENSE) © 2024 leoz9
