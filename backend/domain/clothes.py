"""
服装语义数据结构定义
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

CATEGORY_ALIASES = {
    "top": {"top", "tops", "上衣", "上装", "外套"},
    "bottom": {"bottom", "bottoms", "裤子", "下装", "裙子"},
    "shoes": {"shoes", "shoe", "鞋", "鞋子", "鞋履"},
    "accessory": {"accessory", "accessories", "饰品", "配饰", "首饰", "珠宝"},
}


def normalize_category_value(category: str) -> str:
    """将类别归一化为 top/bottom/shoes/accessory。"""
    value = (category or "").strip().lower()
    for canonical, aliases in CATEGORY_ALIASES.items():
        if value in aliases:
            return canonical
    return value


class ClothesSemantics(BaseModel):
    """Gemini Vision 返回的语义数据结构"""
    category: str  # top | bottom | shoes | accessory
    item: str  # 具体衣物名称
    style_semantics: List[str]  # 风格标签
    season_semantics: List[str]  # 季节
    usage_semantics: List[str]  # 使用场景
    color_semantics: str  # 颜色语义
    description: str  # 一句话总结


class ClothesItem(BaseModel):
    """衣柜中的单个衣物"""
    id: int
    category: str
    item: str
    style_semantics: List[str]
    season_semantics: List[str]
    usage_semantics: List[str]
    color_semantics: str
    description: str
    image_url: str
    created_at: datetime


class ClothesCreate(BaseModel):
    """创建衣物的请求体"""
    category: str
    item: str
    style_semantics: List[str]
    season_semantics: List[str]
    usage_semantics: List[str]
    color_semantics: str
    description: str
    image_filename: str


class WardrobeResponse(BaseModel):
    """衣柜分类响应"""
    tops: List[ClothesItem]
    bottoms: List[ClothesItem]
    shoes: List[ClothesItem]
    accessories: List[ClothesItem]
