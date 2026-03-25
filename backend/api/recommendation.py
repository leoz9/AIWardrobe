"""
AI穿搭推荐 API 路由
基于天气的智能穿搭推荐
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.weather import get_weather, normalize_location_request, DEFAULT_LOCATION_QUERY
from services.recommendation import get_ai_recommendation
from pydantic import BaseModel, Field

router = APIRouter()


class RecommendationResponse(BaseModel):
    """推荐响应"""
    weather: dict
    horoscope: Optional[dict] = None
    temperature_rule: Optional[dict] = None
    recommendation_text: str
    outfit_summary: Optional[str] = None
    selection_reasons: Optional[dict] = None
    suggested_top: Optional[dict] = None
    suggested_bottom: Optional[dict] = None
    suggested_shoes: Optional[dict] = None
    suggested_accessories: list[dict] = Field(default_factory=list)
    purchase_suggestions: list[dict] = Field(default_factory=list)


@router.get("/recommendation", response_model=RecommendationResponse)
async def get_outfit_recommendation(
    location: str = Query(
        default=DEFAULT_LOCATION_QUERY,
        description="城市名 或 经纬度坐标(如 '31.23,121.47' 或 '121.47,31.23')"
    ),
    city: Optional[str] = Query(default=None, description="城市（结构化查询参数）"),
    state: Optional[str] = Query(default=None, description="省/州（结构化查询参数）"),
    country: Optional[str] = Query(default=None, description="国家（结构化查询参数）"),
    zodiac_sign: Optional[str] = Query(
        default=None,
        description="可选，临时指定星座（会覆盖设置中的星座）"
    ),
):
    """
    获取AI穿搭推荐
    
    参数:
        location: 城市名（如 上海、Tokyo）或 经纬度坐标（如 31.23,121.47）
    返回:
        天气信息 + AI推荐文本 + 推荐的衣服和裤子
    """
    normalized_location, validation_error = normalize_location_request(
        location=location,
        city=city,
        state=state,
        country=country,
    )
    if validation_error:
        raise HTTPException(status_code=422, detail=validation_error)

    # 获取天气信息
    weather = await get_weather(normalized_location)
    
    if not weather:
        raise HTTPException(status_code=500, detail="获取天气信息失败")
    
    # 获取AI推荐
    recommendation = await get_ai_recommendation(weather, zodiac_sign=zodiac_sign)
    
    return recommendation
