@echo off
chcp 65001 >nul
echo 🚀 启动 AI 智能衣柜...

REM 检查 backend/.env 是否存在
if not exist "backend\.env" (
    echo ⚠️  请先配置 backend\.env 文件（参考 backend\.env.example）
    echo    即把 backend\.env.example 复制为 backend\.env 并填入 API Key
    pause
    exit /b
)

REM 启动后端
echo 📦 正在启动后端服务 (FastAPI)...
start "AI Wardrobe Backend" cmd /k "cd backend && call venv\Scripts\activate && uvicorn main:app --host 0.0.0.0 --reload --port 8000"

REM 等待几秒
timeout /t 3 /nobreak >nul

REM 启动前端
echo 🎨 正在启动前端服务 (React)...
start "AI Wardrobe Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✅ 服务已在很多新窗口中启动：
echo    - 后端 API: http://localhost:8000
echo    - 前端界面: http://localhost:5173
echo.
