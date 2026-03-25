"""
星座运势服务
1) 先拉取并存储 aztro 原始数据
2) 再按需执行 LLM 推理
"""
import os
from datetime import datetime
from typing import Optional

import httpx

from storage.config_store import load_config
from storage.db import (
    get_horoscope_record,
    upsert_horoscope_source,
    update_horoscope_inference,
)
from services.weather import WeatherInfo

AZTRO_API_URL = os.getenv("AZTRO_API_URL", "https://aztro.sameerkumar.website").rstrip("/")

ZODIAC_NAMES = {
    "aries": "白羊座",
    "taurus": "金牛座",
    "gemini": "双子座",
    "cancer": "巨蟹座",
    "leo": "狮子座",
    "virgo": "处女座",
    "libra": "天秤座",
    "scorpio": "天蝎座",
    "sagittarius": "射手座",
    "capricorn": "摩羯座",
    "aquarius": "水瓶座",
    "pisces": "双鱼座"
}

ZODIAC_ALIASES = {
    "白羊": "aries",
    "白羊座": "aries",
    "aries": "aries",
    "金牛": "taurus",
    "金牛座": "taurus",
    "taurus": "taurus",
    "双子": "gemini",
    "双子座": "gemini",
    "gemini": "gemini",
    "巨蟹": "cancer",
    "巨蟹座": "cancer",
    "cancer": "cancer",
    "狮子": "leo",
    "狮子座": "leo",
    "leo": "leo",
    "处女": "virgo",
    "处女座": "virgo",
    "virgo": "virgo",
    "天秤": "libra",
    "天秤座": "libra",
    "libra": "libra",
    "天蝎": "scorpio",
    "天蝎座": "scorpio",
    "scorpio": "scorpio",
    "射手": "sagittarius",
    "射手座": "sagittarius",
    "sagittarius": "sagittarius",
    "摩羯": "capricorn",
    "摩羯座": "capricorn",
    "capricorn": "capricorn",
    "水瓶": "aquarius",
    "水瓶座": "aquarius",
    "aquarius": "aquarius",
    "双鱼": "pisces",
    "双鱼座": "pisces",
    "pisces": "pisces"
}

ZODIAC_TRAITS = {
    "aries": "行动力",
    "taurus": "稳定感",
    "gemini": "沟通力",
    "cancer": "共情力",
    "leo": "表现力",
    "virgo": "细节力",
    "libra": "平衡感",
    "scorpio": "洞察力",
    "sagittarius": "探索欲",
    "capricorn": "执行力",
    "aquarius": "创造力",
    "pisces": "想象力"
}

DEFAULT_COLORS = {
    "aries": "珊瑚红",
    "taurus": "苔藓绿",
    "gemini": "柠檬黄",
    "cancer": "珍珠白",
    "leo": "琥珀金",
    "virgo": "雾霾蓝",
    "libra": "樱花粉",
    "scorpio": "深酒红",
    "sagittarius": "靛青蓝",
    "capricorn": "岩石灰",
    "aquarius": "电光蓝",
    "pisces": "海盐蓝"
}


def normalize_zodiac_sign(sign: Optional[str]) -> Optional[str]:
    """将用户输入的星座归一化为内部 key。"""
    if not sign:
        return None

    normalized = sign.strip().lower().replace(" ", "")
    if not normalized:
        return None

    return ZODIAC_ALIASES.get(normalized)


def build_weather_tip(weather: WeatherInfo) -> str:
    """生成与天气相关的实用建议。"""
    condition = weather.condition or ""
    feels_like = weather.feelsLike

    if "雨" in condition:
        return "今天可能有雨，建议准备轻便雨具并选择防滑鞋。"
    if "雪" in condition:
        return "今天偏冷且可能有雪，优先保暖并注意鞋底防滑。"
    if feels_like >= 30:
        return "体感偏热，建议选择透气面料并及时补水。"
    if feels_like <= 8:
        return "体感偏冷，建议叠穿并注意颈部和脚踝保暖。"
    if "晴" in condition:
        return "阳光较好，外出可搭配防晒配件提升舒适度。"

    return "整体体感平稳，穿搭上可兼顾舒适与层次感。"


def _to_lucky_number(raw_value: object, default: int = 7) -> int:
    try:
        lucky_number = int(raw_value)
    except Exception:
        lucky_number = default
    return min(max(lucky_number, 1), 99)


def fallback_horoscope_source(sign_key: str, weather: WeatherInfo, today: str) -> dict:
    """aztro 不可用时的兜底源数据。"""
    day_seed = datetime.now().toordinal()
    sign_index = list(ZODIAC_NAMES.keys()).index(sign_key)
    lucky_number = ((day_seed + sign_index * 7) % 89) + 11
    trait = ZODIAC_TRAITS.get(sign_key, "节奏感")

    return {
        "current_date": today,
        "date_range": "",
        "description": f"今天你的关键词是{trait}，把精力集中在一件最重要的事上，会有更稳定的收获。",
        "mood": "稳中有进",
        "color": DEFAULT_COLORS.get(sign_key, "浅蓝色"),
        "lucky_number": lucky_number,
        "lucky_time": "",
        "compatibility": "",
        "weather_tip": build_weather_tip(weather),
    }


def sanitize_aztro_payload(payload: dict, sign_key: str, today: str, weather: WeatherInfo) -> dict:
    """清洗 aztro 输出，保证字段完整可用。"""
    description = str(payload.get("description", "")).strip() or "今天整体节奏平稳，适合把注意力放在核心目标。"
    mood = str(payload.get("mood", "")).strip() or "平稳"
    color = str(payload.get("color", "")).strip() or DEFAULT_COLORS.get(sign_key, "浅蓝色")
    lucky_time = str(payload.get("lucky_time", "")).strip()
    compatibility = str(payload.get("compatibility", "")).strip()
    date_range = str(payload.get("date_range", "")).strip()
    current_date = str(payload.get("current_date", "")).strip() or today

    return {
        "current_date": current_date,
        "date_range": date_range,
        "description": description,
        "mood": mood,
        "color": color,
        "lucky_number": _to_lucky_number(payload.get("lucky_number", 7)),
        "lucky_time": lucky_time,
        "compatibility": compatibility,
        "weather_tip": build_weather_tip(weather),
    }


async def fetch_aztro_horoscope(sign_key: str, today: str, weather: WeatherInfo) -> Optional[dict]:
    """获取 aztro 今日运势。"""
    url = f"{AZTRO_API_URL}/?sign={sign_key}&day=today"
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers={"Accept": "application/json"})
            if response.status_code in (404, 405):
                response = await client.get(url, headers={"Accept": "application/json"})

        if response.status_code != 200:
            print(f"aztro 请求失败: {response.status_code} {response.text[:200]}")
            return None

        data = response.json()
        if not isinstance(data, dict):
            print("aztro 返回格式异常")
            return None

        return sanitize_aztro_payload(data, sign_key=sign_key, today=today, weather=weather)
    except Exception as exc:
        print(f"aztro 调用异常: {exc}")
        return None


async def generate_llm_reasoning(
    sign_key: str,
    zodiac_name: str,
    weather: WeatherInfo,
    source_payload: dict,
) -> tuple[Optional[str], str, str]:
    """
    基于已存储的原始运势数据做 LLM 推理。
    Returns:
        (推理文本, 状态, 错误信息)
    """
    config = load_config()
    if not config.api_key:
        return None, "skipped", "未配置 LLM API Key"

    api_base = config.api_base.rstrip("/")
    if not api_base.endswith("/v1"):
        api_base = f"{api_base}/v1"

    prompt = f"""
你是一名理性、可执行导向的运势分析助手。请基于以下星座原始数据给出穿搭场景推理。

星座：{zodiac_name}（{sign_key}）
aztro 原始数据：
- 日期：{source_payload.get('current_date', '')}
- 描述：{source_payload.get('description', '')}
- 心情：{source_payload.get('mood', '')}
- 幸运色：{source_payload.get('color', '')}
- 幸运数字：{source_payload.get('lucky_number', '')}
- 幸运时段：{source_payload.get('lucky_time', '')}
- 契合星座：{source_payload.get('compatibility', '')}

天气：
- {weather.condition}，温度 {weather.temperature}°C，体感 {weather.feelsLike}°C，湿度 {weather.humidity}%

输出要求：
1. 输出 2-3 句中文
2. 给出可执行的穿搭/配色建议
3. 不要绝对化、不要神秘化
4. 不要代码块，不要 JSON
"""

    payload = {
        "model": config.model,
        "messages": [
            {
                "role": "system",
                "content": "你做简洁、务实的推理，避免夸张表达。"
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.6
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                f"{api_base}/chat/completions",
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.status_code != 200:
            err = f"LLM 星座推理请求失败: {response.status_code}"
            print(err)
            return None, "failed", err

        content = (
            response.json()
            .get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        if not content:
            return None, "failed", "LLM 返回空内容"

        return content, "done", ""
    except Exception as exc:
        err = f"LLM 星座推理异常: {exc}"
        print(err)
        return None, "failed", err


def build_suggestion(weather: WeatherInfo, source_payload: dict) -> str:
    weather_tip = str(source_payload.get("weather_tip", "")).strip() or build_weather_tip(weather)
    lucky_time = str(source_payload.get("lucky_time", "")).strip()
    if lucky_time:
        return f"幸运时段：{lucky_time}。{weather_tip}"
    return weather_tip


def build_horoscope_response(
    *,
    today: str,
    sign_key: str,
    source_provider: str,
    source_payload: dict,
    weather: WeatherInfo,
    llm_status: str,
    llm_reasoning: str,
) -> dict:
    zodiac_name = ZODIAC_NAMES.get(sign_key, sign_key)
    summary = str(source_payload.get("description", "")).strip() or "今天整体节奏平稳，建议聚焦最重要的一件事。"
    mood = str(source_payload.get("mood", "")).strip() or "平稳"
    lucky_color = str(source_payload.get("color", "")).strip() or DEFAULT_COLORS.get(sign_key, "浅蓝色")
    lucky_number = _to_lucky_number(source_payload.get("lucky_number", 7))

    return {
        "date": today,
        "zodiac_sign": sign_key,
        "zodiac_name": zodiac_name,
        "is_configured": True,
        "summary": summary,
        "mood": mood,
        "lucky_color": lucky_color,
        "lucky_number": lucky_number,
        "suggestion": build_suggestion(weather, source_payload),
        "source_provider": source_provider,
        "llm_status": llm_status,
        "llm_reasoning": llm_reasoning or "",
    }


async def get_daily_horoscope(
    weather: WeatherInfo,
    zodiac_sign: Optional[str] = None,
    include_inference: bool = True,
) -> dict:
    """获取今日星座运势（先源数据，后可选推理）。"""
    today = datetime.now().strftime("%Y-%m-%d")
    config = load_config()

    sign_key = normalize_zodiac_sign(zodiac_sign) or normalize_zodiac_sign(config.zodiac_sign)
    if not sign_key:
        return {
            "date": today,
            "zodiac_sign": "",
            "zodiac_name": "未设置",
            "is_configured": False,
            "summary": "你还没有设置星座，先去设置里选择后即可获得专属今日运势。",
            "mood": "待设置",
            "lucky_color": "云白色",
            "lucky_number": 6,
            "suggestion": build_weather_tip(weather),
            "source_provider": "none",
            "llm_status": "skipped",
            "llm_reasoning": "",
        }

    zodiac_name = ZODIAC_NAMES.get(sign_key, sign_key)

    cached = await get_horoscope_record(record_date=today, zodiac_sign=sign_key)
    if cached:
        source_payload = cached.get("source_payload") or {}
        source_provider = cached.get("source_provider", "cached")
        llm_status = cached.get("llm_status", "pending")
        llm_reasoning = cached.get("llm_reasoning", "")
        record_id = int(cached["id"])
    else:
        source_payload = await fetch_aztro_horoscope(sign_key=sign_key, today=today, weather=weather)
        source_provider = "aztro"
        if not source_payload:
            source_payload = fallback_horoscope_source(sign_key=sign_key, weather=weather, today=today)
            source_provider = "fallback"

        record_id = await upsert_horoscope_source(
            record_date=today,
            zodiac_sign=sign_key,
            zodiac_name=zodiac_name,
            source_provider=source_provider,
            source_payload=source_payload,
        )
        llm_status = "pending"
        llm_reasoning = ""

    # 每天只推理一次：只有当天首次记录的 pending 状态才执行推理
    if include_inference and llm_status == "pending":
        reasoning, status, err = await generate_llm_reasoning(
            sign_key=sign_key,
            zodiac_name=zodiac_name,
            weather=weather,
            source_payload=source_payload,
        )
        if reasoning:
            llm_reasoning = reasoning
        llm_status = status

        await update_horoscope_inference(
            record_id=record_id,
            llm_status=llm_status,
            llm_reasoning=llm_reasoning,
            llm_error=err,
        )

    return build_horoscope_response(
        today=today,
        sign_key=sign_key,
        source_provider=source_provider,
        source_payload=source_payload,
        weather=weather,
        llm_status=llm_status,
        llm_reasoning=llm_reasoning,
    )
