"""
天气服务 - Open-Meteo 免费全球天气接口（无需 API Key）
文档: https://open-meteo.com/
"""
import re
from typing import Optional, List

import httpx
from pydantic import BaseModel


class CityInfo(BaseModel):
    """城市信息"""
    name: str
    id: str
    adm1: str
    adm2: str
    country: str
    lat: str
    lon: str


class WeatherNow(BaseModel):
    """实时天气数据（兼容旧响应结构）"""
    obsTime: str
    temp: str
    feelsLike: str
    icon: str
    text: str
    wind360: str
    windDir: str
    windScale: str
    windSpeed: str
    humidity: str
    precip: str
    pressure: str
    vis: str
    cloud: Optional[str] = None
    dew: Optional[str] = None


class WeatherResponse(BaseModel):
    """天气 API 原始响应（兼容旧响应结构）"""
    code: str
    updateTime: str
    fxLink: str
    now: WeatherNow


class WeatherInfo(BaseModel):
    """简化的天气信息（用于应用）"""
    temperature: float
    feelsLike: float
    condition: str
    icon: str
    humidity: float
    windDir: str
    windScale: str
    location: str
    obsTime: str


# 兼容老版本 LocationID 输入，并作为地理编码失败时的兜底城市列表
COMMON_CITIES = [
    {"name": "北京", "adm1": "北京市", "country": "中国", "legacy_id": "101010100", "lat": "39.9042", "lon": "116.4074", "keywords": ["beijing", "北京", "bj"]},
    {"name": "上海", "adm1": "上海市", "country": "中国", "legacy_id": "101020100", "lat": "31.2304", "lon": "121.4737", "keywords": ["shanghai", "上海", "sh"]},
    {"name": "广州", "adm1": "广东省", "country": "中国", "legacy_id": "101280101", "lat": "23.1291", "lon": "113.2644", "keywords": ["guangzhou", "广州", "gz"]},
    {"name": "深圳", "adm1": "广东省", "country": "中国", "legacy_id": "101280601", "lat": "22.5431", "lon": "114.0579", "keywords": ["shenzhen", "深圳", "sz"]},
    {"name": "杭州", "adm1": "浙江省", "country": "中国", "legacy_id": "101210101", "lat": "30.2741", "lon": "120.1551", "keywords": ["hangzhou", "杭州", "hz"]},
    {"name": "成都", "adm1": "四川省", "country": "中国", "legacy_id": "101270101", "lat": "30.5728", "lon": "104.0668", "keywords": ["chengdu", "成都", "cd"]},
    {"name": "重庆", "adm1": "重庆市", "country": "中国", "legacy_id": "101040100", "lat": "29.5630", "lon": "106.5516", "keywords": ["chongqing", "重庆", "cq"]},
    {"name": "武汉", "adm1": "湖北省", "country": "中国", "legacy_id": "101200101", "lat": "30.5928", "lon": "114.3055", "keywords": ["wuhan", "武汉", "wh"]},
    {"name": "西安", "adm1": "陕西省", "country": "中国", "legacy_id": "101110101", "lat": "34.3416", "lon": "108.9398", "keywords": ["xian", "西安", "xa"]},
    {"name": "南京", "adm1": "江苏省", "country": "中国", "legacy_id": "101190101", "lat": "32.0603", "lon": "118.7969", "keywords": ["nanjing", "南京", "nj"]},
]

LEGACY_CITY_BY_ID = {city["legacy_id"]: city for city in COMMON_CITIES}

LOCATION_SUFFIXES = (
    "特别行政区", "自治区", "自治州", "地区", "盟", "省", "市", "区", "县"
)
LOCATION_PART_SEPARATOR_REGEX = re.compile(r"[，,]+")
DEFAULT_LOCATION_QUERY = "上海, 上海市, 中国"


def normalize_location_query(query: str) -> str:
    """归一化地区输入，提升匹配率。"""
    normalized = (query or "").strip().lower()
    normalized = re.sub(r"[\s,，/·\-]+", "", normalized)

    for suffix in LOCATION_SUFFIXES:
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)]

    return normalized


def is_complete_text_location(location: str) -> bool:
    """
    判断文本地点是否足够完整（如：南京, 江苏, 中国）。
    """
    parts = [
        part.strip()
        for part in LOCATION_PART_SEPARATOR_REGEX.split((location or "").strip())
        if part.strip()
    ]
    return len(parts) >= 3


def validate_location_input(location: str) -> Optional[str]:
    """
    校验地点输入。返回 None 表示合法，否则返回错误文案。
    """
    raw_location = (location or "").strip()
    if not raw_location:
        return None

    if is_location_id(raw_location) or is_coordinate_location(raw_location):
        return None

    if not is_complete_text_location(raw_location):
        return "地点格式不完整，请使用“城市, 省/州, 国家”格式，例如：南京, 江苏, 中国"

    return None


def normalize_location_request(
    location: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    country: Optional[str] = None,
) -> tuple[str, Optional[str]]:
    """
    统一处理地点请求：
    - 优先使用分字段 city/state/country 组装查询
    - 否则回退到 location 文本
    返回 (normalized_location, validation_error)
    """
    raw_location = (location or "").strip()
    city_value = (city or "").strip()
    state_value = (state or "").strip()
    country_value = (country or "").strip()

    has_structured_parts = any([city_value, state_value, country_value])
    if has_structured_parts:
        if not city_value or not state_value or not country_value:
            return "", "使用分字段查询时，请同时提供 city、state、country。"

        structured_location = ", ".join(
            part for part in (city_value, state_value, country_value) if part
        )
        return structured_location, validate_location_input(structured_location)

    if not raw_location:
        return DEFAULT_LOCATION_QUERY, None

    return raw_location, validate_location_input(raw_location)


def is_location_id(location: str) -> bool:
    return bool(re.fullmatch(r"\d{9}", (location or "").strip()))


def is_coordinate_location(location: str) -> bool:
    return bool(re.fullmatch(r"\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*", (location or "").strip()))


def parse_coordinate_location(location: str) -> Optional[tuple[float, float]]:
    """
    解析输入坐标为 (纬度, 经度)。
    兼容 "纬度,经度" 和老输入格式 "经度,纬度"。
    """
    if not is_coordinate_location(location):
        return None

    first_raw, second_raw = [part.strip() for part in location.split(",", maxsplit=1)]
    first = float(first_raw)
    second = float(second_raw)

    # 优先按纬度,经度解析
    if -90 <= first <= 90 and -180 <= second <= 180:
        return first, second

    # 兼容历史格式: 经度,纬度
    if -180 <= first <= 180 and -90 <= second <= 90:
        return second, first

    return None


def format_coordinate_id(latitude: float, longitude: float) -> str:
    return f"{longitude:.4f},{latitude:.4f}"


def format_city_display_name(city: CityInfo) -> str:
    parts = []
    if city.name:
        parts.append(city.name)

    for value in (city.adm2, city.adm1):
        if value and value not in parts:
            parts.append(value)

    if city.country and city.country not in parts:
        parts.append(city.country)

    return " · ".join(parts)


def city_match_score(city: CityInfo, query: str) -> int:
    normalized_query = normalize_location_query(query)
    if not normalized_query:
        return 0

    candidates = [
        city.name,
        city.adm1,
        city.adm2,
        city.country,
        f"{city.adm1}{city.name}",
        f"{city.adm2}{city.name}",
        f"{city.country}{city.adm1}{city.name}",
    ]

    best_score = 0
    for candidate in candidates:
        normalized_candidate = normalize_location_query(candidate or "")
        if not normalized_candidate:
            continue

        if normalized_query == normalized_candidate:
            best_score = max(best_score, 100)
        elif normalized_query in normalized_candidate:
            best_score = max(best_score, 70)
        elif normalized_candidate in normalized_query:
            best_score = max(best_score, 55)

    if normalize_location_query(city.name) and normalize_location_query(city.name) in normalized_query:
        best_score += 20
    if normalize_location_query(city.adm2) and normalize_location_query(city.adm2) in normalized_query:
        best_score += 10
    if normalize_location_query(city.adm1) and normalize_location_query(city.adm1) in normalized_query:
        best_score += 5

    return best_score


def city_matches_query(city: CityInfo, query: str) -> bool:
    return city_match_score(city, query) > 0


def _city_from_common(city_data: dict) -> CityInfo:
    return CityInfo(
        name=city_data["name"],
        id=format_coordinate_id(float(city_data["lat"]), float(city_data["lon"])),
        adm1=city_data["adm1"],
        adm2=city_data["name"],
        country=city_data["country"],
        lat=str(city_data["lat"]),
        lon=str(city_data["lon"]),
    )


async def search_city(query: str, limit: int = 10) -> List[CityInfo]:
    """
    搜索城市（支持模糊查询）
    优先使用 Open-Meteo 地理编码 API，失败则回退到内置城市列表。
    """
    normalized_query = normalize_location_query(query)
    if not normalized_query:
        return []

    # 兼容老版 LocationID 输入
    if is_location_id(query):
        legacy_city = LEGACY_CITY_BY_ID.get(query.strip())
        if legacy_city:
            return [_city_from_common(legacy_city)]

    # 坐标输入直接返回一个虚拟城市项，便于前端复用现有流程
    parsed_coordinate = parse_coordinate_location(query)
    if parsed_coordinate:
        latitude, longitude = parsed_coordinate
        return [
            CityInfo(
                name="坐标定位",
                id=format_coordinate_id(latitude, longitude),
                adm1="",
                adm2="",
                country="",
                lat=f"{latitude}",
                lon=f"{longitude}",
            )
        ]

    # Open-Meteo Geocoding
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://geocoding-api.open-meteo.com/v1/search",
                params={
                    "name": query.strip(),
                    "count": min(max(limit, 1), 20),
                    "language": "zh",
                    "format": "json",
                },
                timeout=10.0,
            )
            response.raise_for_status()
            payload = response.json()

        cities: List[CityInfo] = []
        for row in payload.get("results", []):
            latitude = row.get("latitude")
            longitude = row.get("longitude")
            if latitude is None or longitude is None:
                continue

            city = CityInfo(
                name=str(row.get("name") or "未知地区"),
                id=format_coordinate_id(float(latitude), float(longitude)),
                adm1=str(row.get("admin1") or ""),
                adm2=str(row.get("admin2") or ""),
                country=str(row.get("country") or ""),
                lat=str(latitude),
                lon=str(longitude),
            )

            if city_matches_query(city, query):
                cities.append(city)

        if cities:
            cities.sort(key=lambda city: city_match_score(city, query), reverse=True)
            return cities[:limit]
    except Exception as e:
        print(f"⚠️  Geocoding 查询失败，使用内置城市兜底: {e}")

    # 回退方案：内置城市模糊匹配
    matched_cities: List[CityInfo] = []
    for city_data in COMMON_CITIES:
        keyword_matched = any(
            normalized_query in normalize_location_query(keyword)
            or normalize_location_query(keyword) in normalized_query
            for keyword in city_data["keywords"]
        )
        region_matched = any(
            normalized_query in normalize_location_query(city_data.get(field, ""))
            or normalize_location_query(city_data.get(field, "")) in normalized_query
            for field in ("name", "adm1")
            if city_data.get(field)
        )

        if keyword_matched or region_matched:
            matched_cities.append(_city_from_common(city_data))

    matched_cities.sort(key=lambda city: city_match_score(city, query), reverse=True)
    return matched_cities[:limit]


async def resolve_location(location: str) -> tuple[str, str]:
    """
    解析用户输入为 "经度,纬度" 的坐标字符串，并返回展示用地区名。
    """
    raw_location = (location or "").strip()
    if not raw_location:
        shanghai = LEGACY_CITY_BY_ID["101020100"]
        shanghai_city = _city_from_common(shanghai)
        return format_coordinate_id(float(shanghai["lat"]), float(shanghai["lon"])), format_city_display_name(shanghai_city)

    validation_error = validate_location_input(raw_location)
    if validation_error:
        raise ValueError(validation_error)

    if is_location_id(raw_location):
        city_data = LEGACY_CITY_BY_ID.get(raw_location)
        if city_data:
            city = _city_from_common(city_data)
            return (
                format_coordinate_id(float(city_data["lat"]), float(city_data["lon"])),
                format_city_display_name(city),
            )
        return raw_location, raw_location

    parsed_coordinate = parse_coordinate_location(raw_location)
    if parsed_coordinate:
        latitude, longitude = parsed_coordinate
        return format_coordinate_id(latitude, longitude), raw_location

    cities = await search_city(raw_location, limit=1)
    if cities:
        city = cities[0]
        return city.id, format_city_display_name(city)

    return raw_location, raw_location


def wind_direction_text(degrees: float) -> str:
    labels = ["北风", "东北风", "东风", "东南风", "南风", "西南风", "西风", "西北风"]
    index = int(((degrees % 360) + 22.5) // 45) % 8
    return labels[index]


def wind_speed_to_beaufort(speed_kmh: float) -> int:
    # Beaufort 风级阈值（km/h）
    thresholds = [1, 6, 12, 20, 29, 39, 50, 62, 75, 89, 103, 118]
    for level, threshold in enumerate(thresholds):
        if speed_kmh < threshold:
            return level
    return 12


def map_weather_code(code: int, is_day: int) -> tuple[str, str]:
    # 复用前端既有的 QWeather 图标编码映射，避免改 UI。
    if code == 0:
        return ("晴", "100" if is_day else "150")
    if code == 1:
        return ("晴间多云", "101" if is_day else "150")
    if code == 2:
        return ("多云", "102")
    if code == 3:
        return ("阴", "104")
    if code in (45, 48):
        return ("雾", "501")
    if code in (51, 53, 55):
        return ("毛毛雨", "305")
    if code in (56, 57):
        return ("冻雨", "314")
    if code in (61, 63, 65, 66, 67):
        return ("雨", "306")
    if code in (71, 73, 75, 77):
        return ("降雪", "400")
    if code in (80, 81, 82):
        return ("阵雨", "309")
    if code in (85, 86):
        return ("阵雪", "404")
    if code in (95, 96, 99):
        return ("雷暴", "302")
    return ("未知", "999")


async def _fetch_open_meteo_now(latitude: float, longitude: float) -> Optional[WeatherResponse]:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "timezone": "auto",
        "current": (
            "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,is_day,"
            "wind_speed_10m,wind_direction_10m,precipitation,pressure_msl,cloud_cover,dew_point_2m"
        ),
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params=params,
                timeout=10.0,
            )
            response.raise_for_status()
            payload = response.json()

        current = payload.get("current") or {}

        temperature = float(current.get("temperature_2m", 20.0))
        feels_like = float(current.get("apparent_temperature", temperature))
        humidity = float(current.get("relative_humidity_2m", 60.0))
        wind_speed = float(current.get("wind_speed_10m", 8.0))
        wind_degrees = float(current.get("wind_direction_10m", 180.0))
        precip = float(current.get("precipitation", 0.0))
        pressure = float(current.get("pressure_msl", 1013.0))
        cloud = current.get("cloud_cover")
        dew = current.get("dew_point_2m")
        obs_time = str(current.get("time") or "")

        weather_code = int(current.get("weather_code", 0))
        is_day = int(current.get("is_day", 1))
        condition_text, icon_code = map_weather_code(weather_code, is_day)

        wind_dir_text = wind_direction_text(wind_degrees)
        wind_scale = str(wind_speed_to_beaufort(wind_speed))

        now = WeatherNow(
            obsTime=obs_time,
            temp=str(round(temperature, 1)),
            feelsLike=str(round(feels_like, 1)),
            icon=icon_code,
            text=condition_text,
            wind360=str(round(wind_degrees, 1)),
            windDir=wind_dir_text,
            windScale=wind_scale,
            windSpeed=str(round(wind_speed, 1)),
            humidity=str(round(humidity, 1)),
            precip=str(round(precip, 2)),
            pressure=str(round(pressure, 1)),
            vis="10",
            cloud=str(cloud) if cloud is not None else None,
            dew=str(round(float(dew), 1)) if dew is not None else None,
        )

        return WeatherResponse(
            code="200",
            updateTime=obs_time,
            fxLink="https://open-meteo.com/",
            now=now,
        )
    except Exception as e:
        print(f"❌ 获取 Open-Meteo 天气信息失败: {e}")
        return None


async def get_qweather_now(location: str) -> Optional[WeatherResponse]:
    """
    兼容旧函数名：实际改为调用 Open-Meteo 免费天气接口。
    """
    resolved_location, _ = await resolve_location(location)
    coordinate = parse_coordinate_location(resolved_location)
    if not coordinate:
        return None

    latitude, longitude = coordinate
    return await _fetch_open_meteo_now(latitude, longitude)


async def get_weather(location: str = DEFAULT_LOCATION_QUERY) -> Optional[WeatherInfo]:
    """
    获取天气信息（简化版）

    Args:
        location: 城市名 / 经纬度坐标 / 历史 LocationID

    Returns:
        WeatherInfo 或 None
    """
    resolved_location, display_location = await resolve_location(location)
    weather_response = await get_qweather_now(resolved_location)

    if not weather_response:
        print("⚠️  使用模拟天气数据")
        return WeatherInfo(
            temperature=20.0,
            feelsLike=22.0,
            condition="晴",
            icon="100",
            humidity=60.0,
            windDir="南风",
            windScale="2",
            location=display_location,
            obsTime="2026-01-01T12:00",
        )

    now = weather_response.now
    return WeatherInfo(
        temperature=float(now.temp),
        feelsLike=float(now.feelsLike),
        condition=now.text,
        icon=now.icon,
        humidity=float(now.humidity),
        windDir=now.windDir,
        windScale=now.windScale,
        location=display_location,
        obsTime=now.obsTime,
    )


def get_season_from_weather(weather: WeatherInfo) -> list[str]:
    """根据天气推断适合的季节标签。"""
    temp = weather.temperature

    if temp < 10:
        return ["冬"]
    if temp < 20:
        return ["春", "秋"]
    return ["夏"]


def get_clothing_suggestion(weather: WeatherInfo) -> str:
    """根据天气推荐穿搭建议。"""
    feels_like = weather.feelsLike
    condition = weather.condition

    if feels_like < 0:
        suggestion = "🧥 建议穿厚羽绒服、棉衣等保暖衣物"
    elif feels_like < 10:
        suggestion = "🧥 建议穿风衣、大衣、夹克等外套"
    elif feels_like < 20:
        suggestion = "👔 建议穿薄外套、长袖衬衫、卫衣"
    elif feels_like < 28:
        suggestion = "👕 建议穿短袖、薄长袖等轻便衣物"
    else:
        suggestion = "👕 建议穿短袖、短裤等夏季清凉衣物"

    if "雨" in condition:
        suggestion += "，记得带伞☂️"
    elif "雪" in condition:
        suggestion += "，注意防滑保暖❄️"
    elif "晴" in condition and feels_like > 25:
        suggestion += "，注意防晒☀️"

    return suggestion
