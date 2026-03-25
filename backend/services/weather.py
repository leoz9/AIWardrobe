"""
天气服务 - 和风天气 API 集成
文档: https://dev.qweather.com/docs/api/weather/weather-now/
GeoAPI: https://dev.qweather.com/docs/api/geoapi/city-lookup/
"""
import httpx
import os
import re
from typing import Optional, List
from pydantic import BaseModel


class CityInfo(BaseModel):
    """城市信息"""
    name: str  # 城市名称
    id: str  # LocationID
    adm1: str  # 省份
    adm2: str  # 市
    country: str  # 国家
    lat: str  # 纬度
    lon: str  # 经度


class WeatherNow(BaseModel):
    """实时天气数据"""
    obsTime: str  # 数据观测时间
    temp: str  # 温度，默认单位：摄氏度
    feelsLike: str  # 体感温度
    icon: str  # 天气状况图标代码
    text: str  # 天气状况的文字描述
    wind360: str  # 风向360角度
    windDir: str  # 风向
    windScale: str  # 风力等级
    windSpeed: str  # 风速，公里/小时
    humidity: str  # 相对湿度，百分比数值
    precip: str  # 过去1小时降水量，默认单位：毫米
    pressure: str  # 大气压强，默认单位：百帕
    vis: str  # 能见度，默认单位：公里
    cloud: Optional[str] = None  # 云量，百分比数值
    dew: Optional[str] = None  # 露点温度


class WeatherResponse(BaseModel):
    """和风天气 API 响应"""
    code: str  # 状态码
    updateTime: str  # API最近更新时间
    fxLink: str  # 响应式页面链接
    now: WeatherNow  # 实时天气数据


class WeatherInfo(BaseModel):
    """简化的天气信息（用于应用）"""
    temperature: float  # 温度
    feelsLike: float  # 体感温度
    condition: str  # 天气状况文字
    icon: str  # 天气图标代码
    humidity: float  # 湿度
    windDir: str  # 风向
    windScale: str  # 风力等级
    location: str  # 位置
    obsTime: str  # 观测时间


# 常用城市列表（免费API降级方案）
COMMON_CITIES = [
    {"name": "北京", "adm1": "北京市", "country": "中国", "id": "101010100", "keywords": ["beijing", "北京", "bj"]},
    {"name": "上海", "adm1": "上海市", "country": "中国", "id": "101020100", "keywords": ["shanghai", "上海", "sh"]},
    {"name": "广州", "adm1": "广东省", "country": "中国", "id": "101280101", "keywords": ["guangzhou", "广州", "gz"]},
    {"name": "深圳", "adm1": "广东省", "country": "中国", "id": "101280601", "keywords": ["shenzhen", "深圳", "sz"]},
    {"name": "杭州", "adm1": "浙江省", "country": "中国", "id": "101210101", "keywords": ["hangzhou", "杭州", "hz"]},
    {"name": "成都", "adm1": "四川省", "country": "中国", "id": "101270101", "keywords": ["chengdu", "成都", "cd"]},
    {"name": "重庆", "adm1": "重庆市", "country": "中国", "id": "101040100", "keywords": ["chongqing", "重庆", "cq"]},
    {"name": "武汉", "adm1": "湖北省", "country": "中国", "id": "101200101", "keywords": ["wuhan", "武汉", "wh"]},
    {"name": "西安", "adm1": "陕西省", "country": "中国", "id": "101110101", "keywords": ["xian", "西安", "xa"]},
    {"name": "南京", "adm1": "江苏省", "country": "中国", "id": "101190101", "keywords": ["nanjing", "南京", "nj"]},
    {"name": "天津", "adm1": "天津市", "country": "中国", "id": "101030100", "keywords": ["tianjin", "天津", "tj"]},
    {"name": "苏州", "adm1": "江苏省", "country": "中国", "id": "101190401", "keywords": ["suzhou", "苏州", "su"]},
    {"name": "长沙", "adm1": "湖南省", "country": "中国", "id": "101250101", "keywords": ["changsha", "长沙", "cs"]},
    {"name": "郑州", "adm1": "河南省", "country": "中国", "id": "101180101", "keywords": ["zhengzhou", "郑州", "zz"]},
    {"name": "济南", "adm1": "山东省", "country": "中国", "id": "101120101", "keywords": ["jinan", "济南", "jn"]},
    {"name": "青岛", "adm1": "山东省", "country": "中国", "id": "101120201", "keywords": ["qingdao", "青岛", "qd"]},
    {"name": "厦门", "adm1": "福建省", "country": "中国", "id": "101230201", "keywords": ["xiamen", "厦门", "xm"]},
    {"name": "大连", "adm1": "辽宁省", "country": "中国", "id": "101070201", "keywords": ["dalian", "大连", "dl"]},
    {"name": "沈阳", "adm1": "辽宁省", "country": "中国", "id": "101070101", "keywords": ["shenyang", "沈阳", "sy"]},
    {"name": "哈尔滨", "adm1": "黑龙江", "country": "中国", "id": "101050101", "keywords": ["haerbin", "哈尔滨", "heb"]},
]

LOCATION_SUFFIXES = (
    "特别行政区", "自治区", "自治州", "地区", "盟", "省", "市", "区", "县"
)


def normalize_location_query(query: str) -> str:
    """归一化地区输入，提升省市区县等写法的匹配率。"""
    normalized = (query or "").strip().lower()
    normalized = re.sub(r"[\s,，/·\-]+", "", normalized)

    for suffix in LOCATION_SUFFIXES:
        if normalized.endswith(suffix):
            normalized = normalized[: -len(suffix)]

    return normalized


def is_location_id(location: str) -> bool:
    return bool(re.fullmatch(r"\d{9}", location.strip()))


def is_coordinate_location(location: str) -> bool:
    return bool(re.fullmatch(r"\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*", location.strip()))


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


def city_matches_query(city: CityInfo, query: str) -> bool:
    return city_match_score(city, query) > 0


def city_match_score(city: CityInfo, query: str) -> int:
    normalized_query = normalize_location_query(query)
    candidates = [
        city.name,
        city.adm1,
        city.adm2,
        f"{city.adm1}{city.name}",
        f"{city.adm2}{city.name}",
        f"{city.adm1}{city.adm2}{city.name}",
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


async def search_city(query: str, limit: int = 10) -> List[CityInfo]:
    """
    搜索城市（支持模糊查询）
    优先使用和风天气GeoAPI，如果失败则使用预定义城市列表
    
    Args:
        query: 城市名称关键词（支持中文、拼音）
        limit: 返回结果数量限制
        
    Returns:
        城市信息列表
    """
    normalized_query = normalize_location_query(query)
    if not normalized_query:
        return []

    # 优先从配置系统读取 API Key
    try:
        from storage.config_store import load_config
        config = load_config()
        api_key = config.qweather_api_key
        api_host = config.qweather_api_host
    except Exception:
        api_key = os.getenv("QWEATHER_API_KEY")
        api_host = os.getenv("QWEATHER_API_HOST", "devapi.qweather.com")
    
    # 如果有API Key，尝试使用GeoAPI
    if api_key and api_key != "your_qweather_api_key_here":
        try:
            url = f"https://{api_host}/geo/v2/city/lookup"
            params = {
                "location": query.strip(),
                "number": limit,
                "lang": "zh",
                "key": api_key
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, timeout=10.0)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("code") == "200" and data.get("location"):
                        cities = []
                        for location in data.get("location", []):
                            city = CityInfo(
                                name=location.get("name"),
                                id=location.get("id"),
                                adm1=location.get("adm1"),
                                adm2=location.get("adm2"),
                                country=location.get("country"),
                                lat=location.get("lat"),
                                lon=location.get("lon")
                            )
                            if city_matches_query(city, query):
                                cities.append(city)

                        if cities:
                            cities.sort(key=lambda city: city_match_score(city, query), reverse=True)
                            return cities[:limit]

                        # GeoAPI 返回为空或排序不理想时，退回原始结果
                        cities = []
                        for location in data.get("location", []):
                            cities.append(CityInfo(
                                name=location.get("name"),
                                id=location.get("id"),
                                adm1=location.get("adm1"),
                                adm2=location.get("adm2"),
                                country=location.get("country"),
                                lat=location.get("lat"),
                                lon=location.get("lon")
                            ))
                        return cities
        except Exception as e:
            print(f"⚠️  GeoAPI调用失败，使用预定义城市列表: {e}")
    
    # 降级方案：使用预定义城市列表进行模糊搜索
    matched_cities = []
    
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
            matched_cities.append(CityInfo(
                name=city_data["name"],
                id=city_data["id"],
                adm1=city_data["adm1"],
                adm2=city_data["name"],
                country=city_data["country"],
                lat="0",  # 预定义列表不包含坐标
                lon="0"
            ))

    matched_cities.sort(key=lambda city: city_match_score(city, query), reverse=True)
    return matched_cities[:limit]


async def resolve_location(location: str) -> tuple[str, str]:
    """
    将用户输入解析为和风天气可识别的 location 参数，并返回显示名称。
    """
    raw_location = (location or "").strip()
    if not raw_location:
        return "101020100", "上海"

    if is_location_id(raw_location) or is_coordinate_location(raw_location):
        return raw_location, raw_location

    cities = await search_city(raw_location, limit=1)
    if cities:
        city = cities[0]
        return city.id, format_city_display_name(city)

    return raw_location, raw_location


async def get_qweather_now(location: str) -> Optional[WeatherResponse]:
    """
    调用和风天气 API 获取实时天气
    
    Args:
        location: LocationID 或 经纬度坐标(逗号分隔，如 "116.41,39.92")
        
    Returns:
        WeatherResponse 或 None（失败时）
    
    示例:
        - location="101010100" (北京的LocationID)
        - location="116.41,39.92" (经纬度坐标)
    """
    # 优先从配置系统读取 API Key
    try:
        from storage.config_store import load_config
        config = load_config()
        api_key = config.qweather_api_key
        api_host = config.qweather_api_host
    except Exception:
        # 回退到环境变量
        api_key = os.getenv("QWEATHER_API_KEY")
        api_host = os.getenv("QWEATHER_API_HOST", "devapi.qweather.com")
    
    if not api_key or api_key == "your_qweather_api_key_here":
        print("⚠️  和风天气 API Key 未配置，请在前端设置界面或 .env 文件中配置")
        return None
    
    url = f"https://{api_host}/v7/weather/now"
    params = {
        "location": location,
        "key": api_key
    }
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            if data.get("code") != "200":
                print(f"❌ 和风天气 API 错误: code={data.get('code')}")
                return None
            
            return WeatherResponse(**data)
    
    except Exception as e:
        print(f"❌ 获取天气信息失败: {e}")
        return None


async def get_weather(location: str = "101020100") -> Optional[WeatherInfo]:
    """
    获取天气信息（简化版）
    
    Args:
        location: LocationID 或 经纬度坐标
                 默认: 101020100 (上海)
                 
    Returns:
        WeatherInfo 或 None
    """
    resolved_location, display_location = await resolve_location(location)
    weather_response = await get_qweather_now(resolved_location)
    
    if not weather_response:
        # 返回模拟数据作为降级方案
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
            obsTime="2024-01-01T12:00+08:00"
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
        obsTime=now.obsTime
    )


def get_season_from_weather(weather: WeatherInfo) -> list[str]:
    """
    根据天气推断适合的季节标签
    
    Args:
        weather: 天气信息
        
    Returns:
        季节标签列表
    """
    temp = weather.temperature
    
    if temp < 10:
        return ["冬"]
    elif temp < 20:
        return ["春", "秋"]
    else:
        return ["夏"]


def get_clothing_suggestion(weather: WeatherInfo) -> str:
    """
    根据天气推荐穿搭建议
    
    Args:
        weather: 天气信息
        
    Returns:
        穿搭建议文字
    """
    temp = weather.temperature
    feels_like = weather.feelsLike
    condition = weather.condition
    
    # 基于温度的建议
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
    
    # 根据天气状况补充建议
    if "雨" in condition:
        suggestion += "，记得带伞☂️"
    elif "雪" in condition:
        suggestion += "，注意防滑保暖❄️"
    elif "晴" in condition and feels_like > 25:
        suggestion += "，注意防晒☀️"
    
    return suggestion
