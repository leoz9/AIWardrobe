"""
星座运势服务
根据日期、天气和用户星座生成今日运势
"""
from datetime import datetime
from typing import Optional

import httpx

from storage.config_store import load_config
from services.openai_compatible import extract_json_from_response
from services.weather import WeatherInfo

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


def fallback_horoscope(sign_key: str, weather: WeatherInfo) -> dict:
    """在未配置 LLM 或调用失败时提供基础运势。"""
    today = datetime.now().strftime("%Y-%m-%d")
    day_seed = datetime.now().toordinal()
    sign_index = list(ZODIAC_NAMES.keys()).index(sign_key)

    lucky_number = ((day_seed + sign_index * 7) % 89) + 11
    trait = ZODIAC_TRAITS.get(sign_key, "节奏感")
    weather_tip = build_weather_tip(weather)

    return {
        "date": today,
        "summary": f"今天你的关键词是{trait}，把精力集中在一件最重要的事上，会有更稳定的收获。",
        "mood": "稳中有进",
        "lucky_color": DEFAULT_COLORS.get(sign_key, "浅蓝色"),
        "lucky_number": lucky_number,
        "suggestion": weather_tip
    }


def sanitize_horoscope_payload(payload: dict, weather_tip: str) -> dict:
    """清洗 LLM 输出，保证字段完整可用。"""
    summary = str(payload.get("summary", "")).strip() or "今天整体节奏平稳，适合把注意力放在核心目标。"
    mood = str(payload.get("mood", "")).strip() or "平稳"
    lucky_color = str(payload.get("lucky_color", "")).strip() or "浅蓝色"
    suggestion = str(payload.get("suggestion", "")).strip() or weather_tip

    raw_number = payload.get("lucky_number", 7)
    try:
        lucky_number = int(raw_number)
    except Exception:
        lucky_number = 7
    lucky_number = min(max(lucky_number, 1), 99)

    return {
        "summary": summary,
        "mood": mood,
        "lucky_color": lucky_color,
        "lucky_number": lucky_number,
        "suggestion": suggestion
    }


async def generate_llm_horoscope(sign_key: str, weather: WeatherInfo) -> Optional[dict]:
    """调用 OpenAI 兼容接口生成运势文本。"""
    config = load_config()
    if not config.api_key:
        return None

    api_base = config.api_base.rstrip("/")
    if not api_base.endswith("/v1"):
        api_base = f"{api_base}/v1"

    today = datetime.now().strftime("%Y-%m-%d")
    zodiac_name = ZODIAC_NAMES.get(sign_key, sign_key)
    weather_tip = build_weather_tip(weather)

    prompt = f"""
你是一个风格克制、实用导向的星座顾问。请为用户生成今日运势。

日期：{today}
星座：{zodiac_name}
天气：{weather.condition}，气温 {weather.temperature}°C，体感 {weather.feelsLike}°C，湿度 {weather.humidity}%

请输出 JSON，字段必须完整：
{{
  "summary": "40-80字，描述今日整体运势，避免绝对化和恐吓表述",
  "mood": "2-6字情绪关键词",
  "lucky_color": "1个颜色词",
  "lucky_number": 1-99 的整数,
  "suggestion": "结合天气和运势给出 1 条可执行建议（20-50字）"
}}

只返回 JSON，不要代码块，不要额外说明。
"""

    payload = {
        "model": config.model,
        "messages": [
            {
                "role": "system",
                "content": "你输出结构化 JSON，内容友好、理性、可执行。"
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.7
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            response = await client.post(
                f"{api_base}/chat/completions",
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json"
                },
                json=payload
            )

        if response.status_code != 200:
            print(f"LLM 星座运势请求失败: {response.status_code} {response.text[:200]}")
            return None

        content = response.json()["choices"][0]["message"]["content"]
        parsed = extract_json_from_response(content)
        return sanitize_horoscope_payload(parsed, weather_tip)
    except Exception as exc:
        print(f"LLM 星座运势调用异常: {exc}")
        return None


async def get_daily_horoscope(weather: WeatherInfo, zodiac_sign: Optional[str] = None) -> dict:
    """获取今日星座运势。"""
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
            "suggestion": build_weather_tip(weather)
        }

    llm_result = await generate_llm_horoscope(sign_key, weather)
    if not llm_result:
        llm_result = fallback_horoscope(sign_key, weather)

    return {
        "date": today,
        "zodiac_sign": sign_key,
        "zodiac_name": ZODIAC_NAMES.get(sign_key, sign_key),
        "is_configured": True,
        "summary": llm_result["summary"],
        "mood": llm_result["mood"],
        "lucky_color": llm_result["lucky_color"],
        "lucky_number": llm_result["lucky_number"],
        "suggestion": llm_result["suggestion"]
    }
