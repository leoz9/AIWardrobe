"""
星座运势 API
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.horoscope import get_daily_horoscope
from services.weather import get_weather

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


@router.get("/horoscope/daily", response_model=HoroscopeResponse)
async def get_today_horoscope(
    location: str = Query(
        default="101020100",
        description="LocationID 或 经纬度坐标"
    ),
    zodiac_sign: Optional[str] = Query(
        default=None,
        description="可选，若传入会覆盖设置中的星座"
    )
):
    """
    获取今日星座运势
    """
    weather = await get_weather(location)
    if not weather:
        raise HTTPException(status_code=500, detail="获取天气信息失败")

    return await get_daily_horoscope(weather=weather, zodiac_sign=zodiac_sign)
