"""
API 配置模型
"""
from pydantic import BaseModel
from typing import Optional, List, Literal


class LLMConfig(BaseModel):
    """LLM API 配置"""
    api_base: str = "https://x666.me/v1"
    api_key: str = "sk-F8oPcW8b5pgRtrmnR0ymh6yxCG6yCW3Gft7H3x792r3kn4Fi"
    model: str = "gemini-flash-latest"
    # remove.bg 配置
    removebg_api_key: str = "mcigdPJZy9oU6c2SMiEwj9VA"
    bg_removal_method: Literal["local", "removebg"] = "removebg"  # 本地 rembg 或 remove.bg API
    # 默认天气城市（用于首页与推荐页）
    weather_location: str = "上海, 上海市, 中国"
    # 用户星座配置（用于首页运势）
    zodiac_sign: str = ""
    
    
class LLMConfigUpdate(BaseModel):
    """更新 LLM 配置的请求体"""
    api_base: Optional[str] = None
    api_key: Optional[str] = None
    model: Optional[str] = None
    removebg_api_key: Optional[str] = None
    bg_removal_method: Optional[Literal["local", "removebg"]] = None
    weather_location: Optional[str] = None
    zodiac_sign: Optional[str] = None


class AvailableModel(BaseModel):
    """可用模型"""
    id: str
    name: str
    

class ModelListResponse(BaseModel):
    """模型列表响应"""
    models: List[AvailableModel]
