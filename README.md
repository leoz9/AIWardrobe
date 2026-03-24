# 👕 AI Smart Wardrobe

**Your Personal AI Stylist & Wardrobe Manager**

基于 AI 的个人智能衣柜管理系统。上传衣服照片，自动去背景、识别分类，并根据当地天气提供每日穿搭建议。





---

## 📖 简介 (Introduction)

**AI Smart Wardrobe** 是一个现代化的智能衣柜解决方案。它结合了计算机视觉和大型语言模型（LLM）的力量，为您提供无缝的衣物管理和个性化的穿搭建议。无论是在匆忙的早晨，还是为特殊场合做准备，AI Wardrobe 都能助您一臂之力。

## ✨ 核心特性 (Features)


| 特性              | 描述                                                               |
| --------------- | ---------------------------------------------------------------- |
| 📸 **智能上传**     | 上传衣服照片，利用 **rembg** 自动移除背景，并使用 **Gemini Vision** 智能识别服装类别、颜色和风格。 |
| 🌤️ **天气穿搭**    | 集成 **和风天气 (QWeather) API**，实时获取当地天气数据，为您推荐最舒适、最时尚的穿搭组合。          |
| 👗 **虚拟衣柜**     | 数字化您的衣橱，随时随地浏览、搜索和管理您的所有衣物。                                      |
| 🧠 **AI 推荐大模型** | 内置 **Gemini / OpenAI** 支持，生成符合时尚美学的搭配建议，像私人造型师一样懂您。              |
| 📱 **多端适配**     | 采用响应式设计，在桌面端、平板和手机上都能获得极致体验。                                     |


## 👀 运行演示 (Demo)

> ✨ **全新 UI 升级**：已全面集成 Tailwind CSS 重构前端界面，提供现代化、响应式且丝滑沉浸式的全新用户体验！

|                             |                       |                         |
| --------------------------- | --------------------- | ----------------------- |
| **📸 录入新衣** 支持拍照和图库上传       | **👗 我的衣橱** 智能分类与快速搜索 | **🤖 AI 推荐引导** 一键开启时尚之旅 |
| **🌤️ 智能穿搭建议** 结合天气与美学的完美推荐 | **✨ 穿搭详情** 高清细节展示     |                         |


## 🛠️ 技术栈 (Tech Stack)

### 🎨 Frontend

- **React** 
- **Vite**
- **Tailwind CSS** (全新 UI 引擎)

### ⚙️ Backend & AI

- **FastAPI** (Python)
- **SQLite**
- **Google Gemini / OpenAI**

## 🚀 快速开始 (Getting Started)

### 前置要求 (Prerequisites)

- **Node.js**: v18+
- **Python**: v3.10+
- **API Keys**:
  - [Google Gemini API Key](https://aistudio.google.com/app/apikey) 或 OpenAI Key
  - [和风天气 API Key](https://console.qweather.com)

### 1. 克隆项目

```bash
git clone https://github.com/leoz9/AIWardrobe.git
cd AIWardrobe
```

### 2. 环境配置

在项目根目录执行：

```bash
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入您的 API Key 和其他配置
```

### 3. 首次安装依赖（必须先做）

`start.sh` / `start.bat` 会直接使用 `backend/venv` 和 `frontend/node_modules`，所以首次需要先安装。

**后端 (Backend)**

```bash
cd backend
python -m venv venv

# Mac / Linux
source venv/bin/activate

# Windows
# venv\Scripts\activate

pip install -r requirements.txt
cd ..
```

**前端 (Frontend)**

```bash
cd frontend
npm install
cd ..
```

### 4. 启动项目（当前推荐方式）

在根目录使用启动脚本：

**Mac / Linux**

```bash
chmod +x start.sh
./start.sh
```

**Windows**

```cmd
start.bat
```

启动后访问：

- 🏠 **前端页面**: [http://localhost:5173](http://localhost:5173)
- 🔌 **后端 API**: [http://localhost:8000](http://localhost:8000)
- 📄 **后端文档**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 5. 可选：手动启动（不使用脚本）

如果你想分别控制前后端，可开两个终端：

```bash
# 终端 1：后端
cd backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --reload --port 8000
```

```bash
# 终端 2：前端
cd frontend
npm run dev
```

## 🐳 Docker 一键部署 (Docker Deployment)

使用预构建的 Docker 镜像，无需本地编译，一分钟完成部署！

### ⚡ Quick Start

```bash
# 拉取镜像
docker pull ghcr.io/leoz9/aiwardrobe:latest

# 运行容器 (需要先配置 .env 文件)
docker run -d -p 8000:8000 \
  --env-file backend/.env \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  -v $(pwd)/backend/data:/app/backend/data \
  ghcr.io/leoz9/aiwardrobe:latest
```

### 📦 使用 Docker Compose (推荐)

#### 前置要求

- 安装 [Docker](https://www.docker.com/) 和 Docker Compose

#### 部署步骤

1. **克隆项目并配置环境变量**
  ```bash
    git clone https://github.com/leoz9/AIWardrobe.git
    cd AIWardrobe
    cd backend && cp .env.example .env
    # 编辑 .env 填入您的 API Key
  ```
2. **一键启动** ✨
  ```bash
    cd .. && docker-compose up -d
  ```
  > 💡 现在直接从 GitHub Container Registry 拉取预构建镜像，无需本地 build！
3. **访问项目**
  - 🏠 **Web 应用**: [http://localhost:8000](http://localhost:8000)
  - 📄 **API 文档**: [http://localhost:8000/docs](http://localhost:8000/docs)
  > ⚠️ **注意**: 数据（数据库和上传图片）将持久化保存在 `backend/data` 和 `backend/uploads` 目录中。

## 📈 Star History

[Star History Chart](https://www.star-history.com/#leoz9/AIWardrobe&type=date&legend=top-left)

## 🤝 贡献 (Contributing)

非常欢迎您的贡献！如果您有好的建议或发现了 Bug，请随时提交 Issue 或 Pull Request。

## 📄 License

[MIT](LICENSE)
