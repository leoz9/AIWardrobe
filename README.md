<div align="center">

# 👕 AI Smart Wardrobe

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://ghcr.io/leoz9/aiwardrobe)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

**Your Personal AI Stylist & Wardrobe Manager**

Upload clothing photos, remove backgrounds automatically, classify garments with AI vision, and get weather-aware outfit recommendations — all in one app.

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

---

<img src="docs/images/screenshot_landing.jpg" width="720" alt="AI Smart Wardrobe Screenshot" />

</div>

## ✨ Features

| Feature | Description |
| :--- | :--- |
| **Smart Upload** | Upload clothing photos, auto-remove backgrounds with `rembg`, analyze category, color, and style via AI vision models |
| **Weather-Based Styling** | Integrates free global weather data (Open-Meteo) to generate outfit suggestions based on real-time conditions |
| **Digital Wardrobe** | Browse, search, and manage your clothing in a structured wardrobe view |
| **AI Recommendations** | Supports Gemini and OpenAI-compatible providers for personalized outfit generation |
| **Responsive UI** | Optimized for desktop, tablet, and mobile with a modern Tailwind CSS interface |

## 📸 Screenshots

<div align="center">
<table>
<tr>
<td align="center"><img src="docs/images/screenshot_input.jpg" width="200" /><br /><b>New Item Entry</b></td>
<td align="center"><img src="docs/images/screenshot_wardrobe.jpg" width="200" /><br /><b>Wardrobe View</b></td>
<td align="center"><img src="docs/images/screenshot_recommendation.jpg" width="200" /><br /><b>AI Recommendation</b></td>
<td align="center"><img src="docs/images/screenshot_detail.jpg" width="200" /><br /><b>Outfit Detail</b></td>
</tr>
</table>
</div>

## 🏗️ Tech Stack

<table>
<tr><td><b>Frontend</b></td><td>React + Vite + Tailwind CSS</td></tr>
<tr><td><b>Backend</b></td><td>FastAPI + SQLite</td></tr>
<tr><td><b>AI</b></td><td>Google Gemini / OpenAI-compatible APIs + rembg</td></tr>
<tr><td><b>Deploy</b></td><td>Docker / Docker Compose (amd64 & arm64)</td></tr>
</table>

## 🚀 Getting Started

### Prerequisites

- **Node.js** `v20+` &nbsp;|&nbsp; **Python** `v3.10+`
- [Google Gemini API Key](https://aistudio.google.com/app/apikey) or an OpenAI-compatible API key

### 1. Clone & Configure

```bash
git clone https://github.com/leoz9/AIWardrobe.git
cd AIWardrobe
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your API keys
```

### 2. Install Dependencies

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 3. Start

```bash
# One-command start (macOS/Linux)
chmod +x start.sh && ./start.sh

# Windows
start.bat
```

After startup:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

<details>
<summary><b>Manual start (separate terminals)</b></summary>

```bash
# Terminal 1: Backend
cd backend && source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

</details>

## 🐳 Docker Deployment

### Quick Start (Local Build)

```bash
cp backend/.env.example backend/.env
docker build -t aiwardrobe:local .
docker run -d --name ai_wardrobe -p 8000:8000 \
  --env-file backend/.env \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  -v $(pwd)/backend/data:/app/backend/data \
  aiwardrobe:local
```

### Using Prebuilt Image

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
cp backend/.env.example backend/.env  # Edit .env with your API keys
docker compose up --build -d
```

Access at http://localhost:8000 &nbsp;|&nbsp; API docs at http://localhost:8000/docs

Data is persisted in `backend/data` and `backend/uploads`.

## ⭐ Star History

<a href="https://www.star-history.com/#leoz9/AIWardrobe&type=date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=leoz9/AIWardrobe&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=leoz9/AIWardrobe&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=leoz9/AIWardrobe&type=Date" />
  </picture>
</a>

## 🤝 Contributing

Contributions are welcome! Feel free to open an [Issue](https://github.com/leoz9/AIWardrobe/issues) or submit a [Pull Request](https://github.com/leoz9/AIWardrobe/pulls).

## 📄 License

[MIT](LICENSE) © 2024 leoz9
