"""
OpenAI 兼容 API 服务
支持任何 OpenAI 风格的 API 接口
"""
import httpx
import base64
import json
import re
from typing import List, Optional
from storage.config_store import load_config
from domain.prompts import CLOTHES_SEMANTIC_PROMPT
from domain.clothes import ClothesSemantics


async def fetch_available_models() -> List[dict]:
    """
    获取可用模型列表
    """
    config = load_config()
    
    if not config.api_key:
        return []
    
    # 确保 api_base 格式正确
    api_base = config.api_base.rstrip("/")
    if not api_base.endswith("/v1"):
        api_base = api_base + "/v1"
    
    url = f"{api_base}/models"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                url,
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                models = data.get("data", [])
                # 过滤出支持视觉的模型（通常包含 vision, gpt-4o, claude 等关键词）
                return [
                    {"id": m["id"], "name": m.get("name", m["id"])}
                    for m in models
                ]
            else:
                error_msg = f"API请求失败 ({response.status_code}): {response.text[:200]}"
                print(error_msg)
                raise Exception(error_msg)
    except Exception as e:
        print(f"获取模型列表异常: {e}")
        raise Exception(f"连接异常: {str(e)}")


def extract_json_from_response(text: str) -> dict:
    """
    从响应中提取 JSON
    处理可能的 markdown 代码块包装
    """
    # 尝试直接解析
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    
    # 尝试提取 markdown 代码块中的 JSON
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    
    # 尝试找到 { } 包围的内容
    brace_match = re.search(r'\{[\s\S]*\}', text)
    if brace_match:
        try:
            return json.loads(brace_match.group())
        except json.JSONDecodeError:
            pass
    
    raise ValueError(f"无法从响应中提取 JSON: {text}")


async def analyze_clothes_openai(image_bytes: bytes) -> ClothesSemantics:
    """
    使用 OpenAI 兼容 API 分析衣物图片
    
    Args:
        image_bytes: 图片的字节数据
        
    Returns:
        ClothesSemantics: 衣物语义信息
    """
    config = load_config()
    
    if not config.api_key:
        raise ValueError("请先配置 API Key")
    
    # 确保 api_base 格式正确
    api_base = config.api_base.rstrip("/")
    if not api_base.endswith("/v1"):
        api_base = api_base + "/v1"
    
    url = f"{api_base}/chat/completions"
    
    # 将图片转换为 base64
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    
    # 构建请求体
    payload = {
        "model": config.model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": CLOTHES_SEMANTIC_PROMPT
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/png;base64,{image_base64}"
                        }
                    }
                ]
            }
        ],
        "max_tokens": 1000
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {config.api_key}",
                "Content-Type": "application/json"
            },
            json=payload
        )
        
        if response.status_code != 200:
            raise ValueError(f"API 请求失败: {response.status_code} - {response.text}")
        
        data = response.json()
        
        # 提取响应内容
        content = data["choices"][0]["message"]["content"]
        
        # 解析 JSON
        result = extract_json_from_response(content)
        
        return ClothesSemantics(**result)
