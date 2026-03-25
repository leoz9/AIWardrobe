"""
星座运势 API
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.horoscope import get_daily_horoscope
from services.weather import get_weather, normalize_location_request, DEFAULT_LOCATION_QUERY

router = APIRouter()


class HoroscopeResponse(BaseModel):
    """今日星座运势响应"""
    date: str
    zodiac_sign: str
    zodiac_name: str
    is_configured: bool
    summary: str
    mood: str
    lucky_color: str
    lucky_number: int
    suggestion: str
    source_provider: str
    llm_status: str
    llm_reasoning: str


@router.get("/horoscope/daily", response_model=HoroscopeResponse)
async def get_today_horoscope(
    location: str = Query(
        default=DEFAULT_LOCATION_QUERY,
        description="城市名 或 经纬度坐标"
    ),
    city: Optional[str] = Query(default=None, description="城市（结构化查询参数）"),
    state: Optional[str] = Query(default=None, description="省/州（结构化查询参数）"),
    country: Optional[str] = Query(default=None, description="国家（结构化查询参数）"),
    zodiac_sign: Optional[str] = Query(
        default=None,
        description="可选，若传入会覆盖设置中的星座"
    ),
    include_inference: bool = Query(
        default=True,
        description="是否执行并返回 LLM 推理结果。false 时仅返回并缓存基础运势。"
    ),
):
    """
    获取今日星座运势
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

    return await get_daily_horoscope(
        weather=weather,
        zodiac_sign=zodiac_sign,
        include_inference=include_inference,
    )
