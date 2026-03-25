<div align="center">

# 👕 AI スマートワードローブ

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://ghcr.io/leoz9/aiwardrobe)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://python.org)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

**あなた専属の AI スタイリスト & ワードローブマネージャー**

衣類の写真をアップロードし、背景を自動除去、AI ビジョンでカテゴリを分類、天気やスタイルの好みに合わせたコーディネートを提案 — すべてひとつのアプリで。

[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja.md)

---

<img src="docs/images/screenshot_landing.jpg" width="720" alt="AI スマートワードローブ スクリーンショット" />

</div>

## ✨ 主な機能

| 機能 | 説明 |
| :--- | :--- |
| **スマートアップロード** | 衣類の写真をアップロードすると `rembg` で背景を自動除去し、AI ビジョンモデルでカテゴリ・色・スタイルを分析 |
| **天気連動スタイリング** | Open-Meteo の無料グローバル天気 API を利用し、リアルタイム天気に基づいたコーディネートを提案 |
| **デジタルワードローブ** | 構造化されたビューで衣類を閲覧・検索・管理 |
| **AI レコメンデーション** | Gemini や OpenAI 互換プロバイダーによるパーソナライズされたコーディネート生成 |
| **レスポンシブ UI** | Tailwind CSS によるモダンなインターフェースで、デスクトップ・タブレット・モバイルに対応 |

## 📸 スクリーンショット

<div align="center">
<table>
<tr>
<td align="center"><img src="docs/images/screenshot_input.jpg" width="200" /><br /><b>アイテム登録</b></td>
<td align="center"><img src="docs/images/screenshot_wardrobe.jpg" width="200" /><br /><b>ワードローブ</b></td>
<td align="center"><img src="docs/images/screenshot_recommendation.jpg" width="200" /><br /><b>AI レコメンド</b></td>
<td align="center"><img src="docs/images/screenshot_detail.jpg" width="200" /><br /><b>コーデ詳細</b></td>
</tr>
</table>
</div>

## 🏗️ 技術スタック

<table>
<tr><td><b>フロントエンド</b></td><td>React + Vite + Tailwind CSS</td></tr>
<tr><td><b>バックエンド</b></td><td>FastAPI + SQLite</td></tr>
<tr><td><b>AI</b></td><td>Google Gemini / OpenAI 互換 API + rembg</td></tr>
<tr><td><b>デプロイ</b></td><td>Docker / Docker Compose（amd64 & arm64）</td></tr>
</table>

## 🚀 はじめに

### 前提条件

- **Node.js** `v20+` &nbsp;|&nbsp; **Python** `v3.10+`
- [Google Gemini API Key](https://aistudio.google.com/app/apikey) または OpenAI 互換 API キー

### 1. クローンと設定

```bash
git clone https://github.com/leoz9/AIWardrobe.git
cd AIWardrobe
cp backend/.env.example backend/.env
# backend/.env を編集し、API キーを入力してください
```

### 2. 依存関係のインストール

```bash
# バックエンド
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# フロントエンド
cd frontend && npm install && cd ..
```

### 3. 起動

```bash
# ワンコマンド起動（macOS/Linux）
chmod +x start.sh && ./start.sh

# Windows
start.bat
```

起動後のアクセス先：
- **フロントエンド:** http://localhost:5173
- **バックエンド API:** http://localhost:8000
- **API ドキュメント:** http://localhost:8000/docs

<details>
<summary><b>手動起動（ターミナルを2つ使用）</b></summary>

```bash
# ターミナル 1：バックエンド
cd backend && source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --reload --port 8000

# ターミナル 2：フロントエンド
cd frontend && npm run dev
```

</details>

## 🐳 Docker デプロイ

### クイックスタート（ローカルビルド）

```bash
cp backend/.env.example backend/.env
docker build -t aiwardrobe:local .
docker run -d --name ai_wardrobe -p 8000:8000 \
  --env-file backend/.env \
  -v $(pwd)/backend/uploads:/app/backend/uploads \
  -v $(pwd)/backend/data:/app/backend/data \
  aiwardrobe:local
```

### ビルド済みイメージを使用

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
cp backend/.env.example backend/.env  # .env を編集し、API キーを入力
docker compose up --build -d
```

http://localhost:8000 でアクセス &nbsp;|&nbsp; API ドキュメント http://localhost:8000/docs

データは `backend/data` と `backend/uploads` に永続化されます。

## ⭐ Star History

<a href="https://www.star-history.com/#leoz9/AIWardrobe&type=date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=leoz9/AIWardrobe&type=Date&theme=dark" />
    <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=leoz9/AIWardrobe&type=Date" />
    <img alt="Star History Chart" src="https://api.star-history.com/svg?repos=leoz9/AIWardrobe&type=Date" />
  </picture>
</a>

## 🤝 コントリビュート

[Issue](https://github.com/leoz9/AIWardrobe/issues) や [Pull Request](https://github.com/leoz9/AIWardrobe/pulls) の提出を歓迎します。

## 📄 ライセンス

[MIT](LICENSE) © 2024 leoz9
