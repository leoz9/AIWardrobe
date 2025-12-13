"""
配置管理 API
"""
from fastapi import APIRouter, HTTPException
from domain.config import LLMConfigUpdate, AvailableModel, ModelListResponse
from storage.config_store import load_config, update_config, get_masked_config
from services.openai_compatible import fetch_available_models

router = APIRouter()


@router.get("/config")
async def get_config():
    """获取当前 LLM 配置（API Key 脱敏）"""
    return get_masked_config()


@router.post("/config")
async def set_config(config_update: LLMConfigUpdate):
    """更新 LLM 配置"""
    try:
        config = update_config(
            api_base=config_update.api_base,
            api_key=config_update.api_key,
            model=config_update.model,
            removebg_api_key=config_update.removebg_api_key,
            bg_removal_method=config_update.bg_removal_method,
            qweather_api_key=config_update.qweather_api_key,
            qweather_api_host=config_update.qweather_api_host
        )
        return {
            "success": True,
            "message": "配置已更新",
            "config": get_masked_config()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models", response_model=ModelListResponse)
async def list_models():
    """获取可用模型列表"""
    try:
        models = await fetch_available_models()
        return ModelListResponse(
            models=[AvailableModel(id=m["id"], name=m["name"]) for m in models]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test-connection")
async def test_connection():
    """测试 API 连接"""
    config = load_config()
    
    if not config.api_key:
        return {
            "success": False,
            "message": "请先配置 API Key"
        }
    
    try:
        models = await fetch_available_models()
        if models:
            return {
                "success": True,
                "message": f"连接成功，发现 {len(models)} 个可用模型",
                "model_count": len(models)
            }
        else:
            return {
                "success": False,
                "message": "连接成功但未获取到模型列表，请检查 API Base URL"
            }
    except Exception as e:
        return {
            "success": False,
            "message": f"连接失败: {str(e)}"
        }
