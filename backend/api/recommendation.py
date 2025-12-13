"""
AI穿搭推荐 API 路由
基于天气的智能穿搭推荐
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.weather import get_weather
from services.recommendation import get_ai_recommendation
from pydantic import BaseModel

router = APIRouter()


class RecommendationResponse(BaseModel):
    """推荐响应"""
    weather: dict
    recommendation_text: str
    suggested_top: Optional[dict] = None
    suggested_bottom: Optional[dict] = None


@router.get("/recommendation", response_model=RecommendationResponse)
async def get_outfit_recommendation(
    location: str = Query(
        default="101020100",
        description="LocationID 或 经纬度坐标(如 '116.41,39.92')"
    )
):
    """
    获取AI穿搭推荐
    
    参数:
        location: LocationID（如 101010100=北京）或 经纬度坐标（如 116.41,39.92）
        
    返回:
        天气信息 + AI推荐文本 + 推荐的衣服和裤子
        
    常用城市 LocationID:
        - 101010100: 北京
        - 101020100: 上海
        - 101280101: 广州
        - 101280601: 深圳
        - 101210101: 杭州
    """
    # 获取天气信息
    weather = await get_weather(location)
    
    if not weather:
        raise HTTPException(status_code=500, detail="获取天气信息失败")
    
    # 获取AI推荐
    recommendation = await get_ai_recommendation(weather)
    
    return recommendation
