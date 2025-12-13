"""
AI穿搭推荐服务
基于天气和衣橱数据生成个性化推荐
"""
import httpx
from typing import Optional
from storage.config_store import load_config
from services.weather import WeatherInfo, get_season_from_weather
from storage.db import get_all_clothes


async def get_ai_recommendation(weather: WeatherInfo) -> dict:
    """
    根据天气获取AI穿搭推荐
    
    Args:
        weather: 天气信息
        
    Returns:
        推荐信息（包含文本和推荐的衣物）
    """
    # 获取适合的季节
    seasons = get_season_from_weather(weather)
    
    # 从数据库获取所有衣物
    all_clothes_items = await get_all_clothes()
    
    # 转换为字典格式
    all_clothes = [
        {
            "id": item.id,
            "category": item.category,
            "item": item.item,
            "style_semantics": item.style_semantics,
            "season_semantics": item.season_semantics,
            "usage_semantics": item.usage_semantics,
            "color_semantics": item.color_semantics,
            "description": item.description,
            "image_url": item.image_url
        }
        for item in all_clothes_items
    ]
    
    # 过滤出适合当前季节的衣物
    suitable_tops = [
        c for c in all_clothes 
        if c.get("category") == "上衣" and any(s in c.get("season_semantics", []) for s in seasons)
    ]
    suitable_bottoms = [
        c for c in all_clothes 
        if c.get("category") == "裤子" and any(s in c.get("season_semantics", []) for s in seasons)
    ]
    
    # 如果没有合适的衣物，就从全部中选择
    if not suitable_tops:
        suitable_tops = [c for c in all_clothes if c.get("category") == "上衣"]
    if not suitable_bottoms:
        suitable_bottoms = [c for c in all_clothes if c.get("category") == "裤子"]
    
    # 向LLM请求推荐文本
    recommendation_text = await get_llm_recommendation(weather, seasons, suitable_tops, suitable_bottoms)
    
    # 随机选择一件上衣和裤子
    import random
    suggested_top = random.choice(suitable_tops) if suitable_tops else None
    suggested_bottom = random.choice(suitable_bottoms) if suitable_bottoms else None
    
    return {
        "weather": {
            "temperature": weather.temperature,
            "feelsLike": weather.feelsLike,
            "condition": weather.condition,
            "icon": weather.icon,
            "humidity": weather.humidity,
            "windDir": weather.windDir,
            "windScale": weather.windScale,
            "obsTime": weather.obsTime
        },
        "recommendation_text": recommendation_text,
        "suggested_top": suggested_top,
        "suggested_bottom": suggested_bottom
    }


async def get_llm_recommendation(
    weather: WeatherInfo, 
    seasons: list[str],
    tops: list[dict],
    bottoms: list[dict]
) -> str:
    """
    使用LLM生成个性化推荐文本
    
    Args:
        weather: 天气信息
        seasons: 适合的季节
        tops: 可用的上衣列表
        bottoms: 可用的裤子列表
        
    Returns:
        推荐文本
    """
    config = load_config()
    
    if not config.api_key:
        # 如果没有配置API，返回基础推荐
        return generate_basic_recommendation(weather, seasons)
    
    # 构建提示词
    prompt = f"""
你是一位专业的时尚穿搭顾问。请根据以下天气信息，为用户提供穿搭建议：

当前天气：
- 温度：{weather.temperature}°C
- 体感温度：{weather.feelsLike}°C
- 天气状况：{weather.condition}
- 湿度：{weather.humidity}%
- 风向风力：{weather.windDir} {weather.windScale}级

适合的季节：{', '.join(seasons)}

用户衣橱中有 {len(tops)} 件上衣和 {len(bottoms)} 件裤子可供选择。


请生成一段友好、实用的穿搭推荐（150词左右），使用 Markdown 格式以便于阅读：
1. **针对当前天气的穿搭建议**（使用粗体强调重点衣物）
2. **需要注意的事项**（如防晒、保暖、防雨等）
3. **穿搭风格建议**

请直接输出 Markdown 格式的文本，不要包含代码块标记（如 ```markdown）。
"""
    
    try:
        # 确保 api_base 格式正确
        api_base = config.api_base.rstrip("/")
        if not api_base.endswith("/v1"):
            api_base = api_base + "/v1"
        
        url = f"{api_base}/chat/completions"
        
        payload = {
            "model": config.model,
            "messages": [
                {"role": "system", "content": "你是一位专业的时尚穿搭顾问，擅长根据天气提供实用的穿搭建议。"},
                {"role": "user", "content": prompt}
            ],
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json"
                },
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"].strip()
            else:
                print(f"LLM API请求失败: {response.status_code}")
                return generate_basic_recommendation(weather, seasons)
                
    except Exception as e:
        print(f"调用LLM失败: {e}")
        return generate_basic_recommendation(weather, seasons)


def generate_basic_recommendation(weather: WeatherInfo, seasons: list[str]) -> str:
    """
    生成基础推荐（不使用LLM）
    
    Args:
        weather: 天气信息
        seasons: 适合的季节
        
    Returns:
        基础推荐文本
    """
    temp = weather.feelsLike
    condition = weather.condition
    
    # 基于温度的建议
    if temp < 0:
        base_text = "🧥 今天非常寒冷，建议穿厚羽绒服、棉衣、毛衣等保暖衣物，搭配厚裤子和保暖鞋。"
    elif temp < 10:
        base_text = "🧥 今天比较冷，建议穿风衣、大衣、夹克等外套，内搭长袖衬衫或卫衣，搭配长裤。"
    elif temp < 20:
        base_text = "👔 今天温度适中，建议穿薄外套、长袖衬衫、卫衣等，可以采用叠穿搭配，方便调节。"
    elif temp < 28:
        base_text = "👕 今天天气舒适，建议穿短袖、薄长袖等轻便衣物，搭配休闲裤或牛仔裤。"
    else:
        base_text = "👕 今天天气炎热，建议穿短袖、短裤等夏季清凉衣物，选择透气吸汗的面料。"
    
    # 根据天气状况补充建议
    if "雨" in condition:
        base_text += " 今天有雨，记得带伞，避免穿浅色衣物，选择防水鞋。☂️"
    elif "雪" in condition:
        base_text += " 今天有雪，注意防滑保暖，选择防水防滑的鞋子。❄️"
    elif "晴" in condition and temp > 25:
        base_text += " 今天阳光充足，外出注意防晒，可以搭配太阳镜和遮阳帽。☀️"
    elif "阴" in condition or "云" in condition:
        base_text += " 今天多云，建议准备一件薄外套以备不时之需。☁️"
    
    return base_text
