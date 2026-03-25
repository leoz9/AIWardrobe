"""
测试 Open-Meteo 天气 API 集成
"""
import asyncio
from services.weather import (
    get_weather,
    get_qweather_now,
    get_clothing_suggestion,
    get_season_from_weather
)


async def test_weather():
    """测试天气服务"""
    print("=" * 50)
    print("🌤️  测试 Open-Meteo 天气 API 集成")
    print("=" * 50)
    
    # 测试不同城市
    cities = [
        ("101010100", "北京"),
        ("101020100", "上海"),
        ("101280101", "广州"),
        ("101280601", "深圳"),
        # ("116.41,39.92", "北京(经纬度)"),  # 使用经纬度
    ]
    
    for location, city_name in cities:
        print(f"\n📍 正在获取 {city_name} 的天气信息...")
        print(f"   Location: {location}")
        print("-" * 50)
        
        # 获取简化天气信息
        weather = await get_weather(location)
        
        if weather:
            print(f"✅ 成功获取天气信息:")
            print(f"   🌡️  温度: {weather.temperature}°C (体感 {weather.feelsLike}°C)")
            print(f"   ☁️  天气: {weather.condition}")
            print(f"   💧 湿度: {weather.humidity}%")
            print(f"   🌬️  风向: {weather.windDir} {weather.windScale}级")
            print(f"   📅 观测时间: {weather.obsTime}")
            
            # 获取穿搭建议
            suggestion = get_clothing_suggestion(weather)
            print(f"\n   👔 穿搭建议: {suggestion}")
            
            # 获取适合季节
            seasons = get_season_from_weather(weather)
            print(f"   🍂 适合季节: {', '.join(seasons)}")
        else:
            print(f"❌ 获取 {city_name} 天气信息失败")
    
    print("\n" + "=" * 50)
    print("🔍 测试天气原始数据（兼容结构）")
    print("=" * 50)
    
    # 测试原始数据
    raw_weather = await get_qweather_now("101010100")
    if raw_weather:
        print(f"✅ 原始数据获取成功:")
        print(f"   状态码: {raw_weather.code}")
        print(f"   更新时间: {raw_weather.updateTime}")
        print(f"   响应链接: {raw_weather.fxLink}")
        print(f"   观测时间: {raw_weather.now.obsTime}")
        print(f"   温度: {raw_weather.now.temp}°C")
        print(f"   天气状况: {raw_weather.now.text}")
        print(f"   图标代码: {raw_weather.now.icon}")
        print(f"   风速: {raw_weather.now.windSpeed} km/h")
        print(f"   降水量: {raw_weather.now.precip} mm")
        print(f"   气压: {raw_weather.now.pressure} hPa")
        print(f"   能见度: {raw_weather.now.vis} km")
        if raw_weather.now.cloud:
            print(f"   云量: {raw_weather.now.cloud}%")
        if raw_weather.now.dew:
            print(f"   露点: {raw_weather.now.dew}°C")
    else:
        print("❌ 获取原始数据失败")
    
    print("\n" + "=" * 50)
    print("✨ 测试完成!")
    print("=" * 50)


if __name__ == "__main__":
    asyncio.run(test_weather())
