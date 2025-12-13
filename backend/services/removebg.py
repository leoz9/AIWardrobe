"""
remove.bg API 背景移除服务
"""
import httpx
from typing import Optional


async def remove_background_api(
    image_bytes: bytes,
    api_key: str,
    size: str = "auto"
) -> bytes:
    """
    使用 remove.bg API 移除图片背景
    
    Args:
        image_bytes: 原始图片的字节数据
        api_key: remove.bg API Key
        size: 输出尺寸 (auto, preview, full, hd, 4k)
        
    Returns:
        去除背景后的 PNG 图片字节数据
        
    Raises:
        ValueError: API 调用失败时抛出
    """
    if not api_key:
        raise ValueError("未配置 remove.bg API Key")
    
    url = "https://api.remove.bg/v1.0/removebg"
    
    headers = {
        "X-API-Key": api_key
    }
    
    files = {
        "image_file": ("image.jpg", image_bytes, "image/jpeg")
    }
    
    data = {
        "size": size
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            url,
            headers=headers,
            files=files,
            data=data
        )
        
        if response.status_code == 200:
            return response.content
        elif response.status_code == 402:
            raise ValueError("remove.bg API 余额不足，请充值或切换到本地处理")
        elif response.status_code == 403:
            raise ValueError("remove.bg API Key 无效")
        elif response.status_code == 400:
            error_msg = response.json().get("errors", [{}])[0].get("title", "请求无效")
            raise ValueError(f"remove.bg 错误: {error_msg}")
        else:
            raise ValueError(f"remove.bg API 调用失败: HTTP {response.status_code}")


def get_remaining_credits(api_key: str) -> Optional[int]:
    """
    获取 remove.bg API 剩余使用次数
    
    Note: 这个信息在响应头中返回，这里提供一个同步版本用于检查
    """
    import requests
    
    url = "https://api.remove.bg/v1.0/account"
    headers = {"X-API-Key": api_key}
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code == 200:
            data = response.json()
            return data.get("data", {}).get("attributes", {}).get("credits", {}).get("free", 0)
    except Exception:
        pass
    return None
