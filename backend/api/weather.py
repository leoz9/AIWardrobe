"""
天气 API 路由
提供天气查询和穿搭建议接口
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from services.weather import (
    get_weather,
    get_qweather_now,
    get_season_from_weather,
    get_clothing_suggestion,
    search_city,
    WeatherInfo,
    WeatherResponse,
    CityInfo
)

router = APIRouter()


@router.get("/weather", response_model=WeatherInfo)
async def get_current_weather(
    location: str = Query(
        default="101020100",
        description="LocationID 或 经纬度坐标(如 '116.41,39.92')"
    )
):
    """
    获取当前天气信息
    
    参数:
        location: LocationID（如 101010100=北京）或 经纬度坐标（如 116.41,39.92）
        
    返回:
        简化的天气信息
        
    常用城市 LocationID:
        - 101010100: 北京
        - 101020100: 上海
        - 101280101: 广州
        - 101280601: 深圳
        - 101210101: 杭州
        
    更多城市 ID 可通过和风天气 GeoAPI 查询:
    https://dev.qweather.com/docs/api/geoapi/
    """
    weather = await get_weather(location)
    
    if not weather:
        raise HTTPException(status_code=500, detail="获取天气信息失败")
    
    return weather


@router.get("/weather/raw", response_model=WeatherResponse)
async def get_raw_weather(
    location: str = Query(
        default="101020100",
        description="LocationID 或 经纬度坐标"
    )
):
    """
    获取和风天气原始数据
    
    参数:
        location: LocationID 或 经纬度坐标
        
    返回:
        完整的和风天气 API 响应数据
    """
    weather = await get_qweather_now(location)
    
    if not weather:
        raise HTTPException(status_code=500, detail="获取天气信息失败")
    
    return weather


@router.get("/weather/suggestion")
async def get_weather_suggestion(
    location: str = Query(
        default="101020100",
        description="LocationID 或 经纬度坐标"
    )
):
    """
    获取基于天气的穿搭建议
    
    参数:
        location: LocationID 或 经纬度坐标
        
    返回:
        天气信息 + 穿搭建议 + 适合季节
    """
    weather = await get_weather(location)
    
    if not weather:
        raise HTTPException(status_code=500, detail="获取天气信息失败")
    
    # 获取穿搭建议
    suggestion = get_clothing_suggestion(weather)
    
    # 获取适合季节
    seasons = get_season_from_weather(weather)
    
    return {
        "weather": weather,
        "suggestion": suggestion,
        "seasons": seasons,
        "message": f"当前{weather.condition}，温度{weather.temperature}°C (体感{weather.feelsLike}°C)"
    }


@router.get("/cities", response_model=List[CityInfo])
async def search_cities(
    query: str = Query(
        description="城市名称关键词，支持中文、拼音"
    ),
    limit: int = Query(
        default=10,
        ge=1,
        le=20,
        description="返回结果数量"
    )
):
    """
    搜索城市（支持模糊查询）
    
    参数:
        query: 城市名称关键词（支持中文、拼音）
        limit: 返回结果数量（默认10，最多20）
        
    返回:
        城市信息列表，包含城市名称、LocationID等
        
    示例:
        - /api/cities?query=北京
        - /api/cities?query=shang
        - /api/cities?query=广州
    """
    cities = await search_city(query, limit)
    
    if not cities:
        raise HTTPException(status_code=404, detail="未找到匹配的城市")
    
    return cities
