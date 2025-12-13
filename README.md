# 👕 AI Smart Wardrobe (AI 智能衣柜)

一个基于 AI 的个人智能衣柜管理系统。上传衣服照片，自动去背景、识别分类，并根据当地天气提供每日穿搭建议。

## ✨ 特性 (Features)

- 📸 **智能上传**: 上传衣服照片，自动移除背景（使用 rembg）并使用 Gemini Vision 识别服装类别和特征。
- 🌤️ **天气穿搭**: 集成和风天气 API，根据实时天气温度推荐合适的穿搭组合。
- 👗 **虚拟衣柜**: 浏览和管理你的所有衣物。
- 🧠 **AI 推荐**: 使用 LLM (Gemini/OpenAI) 生成时尚搭配建议。
- 📱 **响应式设计**: 适配桌面和移动端浏览。

## 🛠️ 技术栈 (Tech Stack)

- **Frontend**: React (Vite), Native CSS, Lucide Icons
- **Backend**: FastAPI (Python), SQLite, rembg (Background Removal), Google Gemini / OpenAI API

## 🚀 快速开始 (Getting Started)

### 前置要求 (Prerequisites)

- Node.js (v18+)
- Python (v3.10+)
- 申请 [Google Gemini API Key](https://aistudio.google.com/app/apikey) 或 OpenAI Key
- 申请 [和风天气 API Key](https://console.qweather.com)

### 1. 克隆项目 (Clone)

```bash
git clone https://github.com/yourusername/AIWardrobe.git
cd AIWardrobe
```

### 2. 环境配置 (Configuration)

在 `backend` 目录下创建 `.env` 文件：

```bash
cd backend
cp .env.example .env
# 编辑 .env 填入你的 API Key
```

### 3. 安装依赖 (Install Dependencies)

#### 后端 (Backend)

```bash
cd backend
python -m venv venv

# Mac/Linux
source venv/bin/activate

# Windows
venv\Scripts\activate

pip install -r requirements.txt
```

#### 前端 (Frontend)

```bash
cd ../frontend
npm install
```

### 4. 启动项目 (Run)

#### Mac / Linux
在根目录下运行：
```bash
./start.sh
```

#### Windows
在根目录下双击运行 `start.bat`，或者在终端运行：
```cmd
start.bat
```

项目启动后访问：
- 前端: http://localhost:5173
- 后端文档: http://localhost:8000/docs

## 🤝 贡献 (Contributing)

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT
