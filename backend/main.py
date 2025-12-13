"""
AI 智能衣柜 - FastAPI 后端入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from api.upload import router as upload_router
from api.wardrobe import router as wardrobe_router
from api.config import router as config_router
from api.weather import router as weather_router
from api.recommendation import router as recommendation_router
from storage.db import init_db

# 上传目录
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时初始化数据库
    await init_db()
    print("✅ 数据库初始化完成")
    yield
    # 关闭时的清理工作（如需要）
    print("👋 应用关闭")


app = FastAPI(
    title="AI 智能衣柜",
    description="个人 AI 智能衣柜系统 - 上传照片、语义识别、智能穿搭",
    version="1.0.0",
    lifespan=lifespan
)

# CORS 配置 - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 静态文件 - 用于访问上传的图片
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# 注册路由
app.include_router(upload_router, prefix="/api", tags=["上传"])
app.include_router(wardrobe_router, prefix="/api", tags=["衣柜"])
app.include_router(config_router, prefix="/api", tags=["配置"])
app.include_router(weather_router, prefix="/api", tags=["天气"])
app.include_router(recommendation_router, prefix="/api", tags=["AI推荐"])


@app.get("/")
async def root():
    """API 根路径"""
    return {
        "message": "👕 AI 智能衣柜 API",
        "docs": "/docs",
        "endpoints": {
            "upload": "POST /api/upload",
            "wardrobe": "GET /api/wardrobe",
            "wardrobe_by_category": "GET /api/wardrobe/{category}",
            "clothes_detail": "GET /api/clothes/{id}",
            "delete_clothes": "DELETE /api/clothes/{id}",
            "weather": "GET /api/weather",
            "weather_suggestion": "GET /api/weather/suggestion",
            "ai_recommendation": "GET /api/recommendation"
        }
    }


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy"}
