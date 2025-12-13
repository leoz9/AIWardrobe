"""
Gemini Vision API 服务
"""
import google.generativeai as genai
import json
import os
import re
from dotenv import load_dotenv
from domain.prompts import CLOTHES_SEMANTIC_PROMPT
from domain.clothes import ClothesSemantics

load_dotenv()

# 配置 Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

# 使用 gemini-1.5-flash（更快、更便宜）
model = genai.GenerativeModel("gemini-1.5-flash")


def extract_json_from_response(text: str) -> dict:
    """
    从 Gemini 响应中提取 JSON
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


async def analyze_clothes(image_bytes: bytes) -> ClothesSemantics:
    """
    使用 Gemini Vision 分析衣物图片
    
    Args:
        image_bytes: 图片的字节数据（建议是去背景后的 PNG）
        
    Returns:
        ClothesSemantics: 衣物语义信息
    """
    response = model.generate_content([
        CLOTHES_SEMANTIC_PROMPT,
        {
            "mime_type": "image/png",
            "data": image_bytes
        }
    ])
    
    # 解析响应
    result = extract_json_from_response(response.text)
    
    return ClothesSemantics(**result)
