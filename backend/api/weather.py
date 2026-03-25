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
    normalize_location_request,
    DEFAULT_LOCATION_QUERY,
    WeatherInfo,
    WeatherResponse,
    CityInfo
)

router = APIRouter()


@router.get("/weather", response_model=WeatherInfo)
async def get_current_weather(
    location: str = Query(
        default=DEFAULT_LOCATION_QUERY,
        description="城市名 或 经纬度坐标(如 '31.23,121.47' 或 '121.47,31.23')"
    ),
    city: Optional[str] = Query(default=None, description="城市（结构化查询参数）"),
    state: Optional[str] = Query(default=None, description="省/州（结构化查询参数）"),
    country: Optional[str] = Query(default=None, description="国家（结构化查询参数）"),
):
    """
    获取当前天气信息
    
    参数:
        location: 城市名（如 上海、Tokyo）或 经纬度坐标（如 31.23,121.47）
        
    返回:
        简化的天气信息
        
    说明:
        - 天气数据使用 Open-Meteo 免费全球接口
        - 无需配置天气 API Key
    """
    normalized_location, validation_error = normalize_location_request(
        location=location,
        city=city,
        state=state,
        country=country,
    )
    if validation_error:
        raise HTTPException(status_code=422, detail=validation_error)

    weather = await get_weather(normalized_location)
    
    if not weather:
        raise HTTPException(status_code=500, detail="获取天气信息失败")
    
    return weather


@router.get("/weather/raw", response_model=WeatherResponse)
async def get_raw_weather(
    location: str = Query(
        default=DEFAULT_LOCATION_QUERY,
        description="城市名 或 经纬度坐标"
    ),
    city: Optional[str] = Query(default=None, description="城市（结构化查询参数）"),
    state: Optional[str] = Query(default=None, description="省/州（结构化查询参数）"),
    country: Optional[str] = Query(default=None, description="国家（结构化查询参数）"),
):
    """
    获取天气原始数据（兼容旧响应结构）
    
    参数:
        location: 城市名 或 经纬度坐标
        
    返回:
        兼容 WeatherResponse 的原始数据
    """
    normalized_location, validation_error = normalize_location_request(
        location=location,
        city=city,
        state=state,
        country=country,
    )
    if validation_error:
        raise HTTPException(status_code=422, detail=validation_error)

    weather = await get_qweather_now(normalized_location)
    
    if not weather:
        raise HTTPException(status_code=500, detail="获取天气信息失败")
    
    return weather


@router.get("/weather/suggestion")
async def get_weather_suggestion(
    location: str = Query(
        default=DEFAULT_LOCATION_QUERY,
        description="城市名 或 经纬度坐标"
    ),
    city: Optional[str] = Query(default=None, description="城市（结构化查询参数）"),
    state: Optional[str] = Query(default=None, description="省/州（结构化查询参数）"),
    country: Optional[str] = Query(default=None, description="国家（结构化查询参数）"),
):
    """
    获取基于天气的穿搭建议
    
    参数:
        location: 城市名 或 经纬度坐标
        
    返回:
        天气信息 + 穿搭建议 + 适合季节
    """
    normalized_location, validation_error = normalize_location_request(
        location=location,
        city=city,
        state=state,
        country=country,
    )
    if validation_error:
        raise HTTPException(status_code=422, detail=validation_error)

    weather = await get_weather(normalized_location)
    
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
        城市信息列表，包含城市名称和坐标 ID（经度,纬度）
        
    示例:
        - /api/cities?query=北京
        - /api/cities?query=shang
        - /api/cities?query=广州
    """
    cities = await search_city(query, limit)
    
    if not cities:
        raise HTTPException(status_code=404, detail="未找到匹配的城市")
    
    return cities
