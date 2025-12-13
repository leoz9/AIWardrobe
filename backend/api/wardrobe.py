"""
衣柜 API - 获取和管理衣物
"""
from fastapi import APIRouter, HTTPException
from typing import Optional

from domain.clothes import ClothesItem, WardrobeResponse, ClothesCreate
from storage.db import (
    get_all_clothes,
    get_clothes_by_category,
    get_clothes_by_id,
    delete_clothes,
    update_clothes
)

router = APIRouter()


@router.get("/wardrobe", response_model=WardrobeResponse)
async def get_wardrobe():
    """
    获取整个衣柜
    
    按 top/bottom/shoes 三类返回所有衣物
    """
    all_clothes = await get_all_clothes()
    
    tops = [c for c in all_clothes if c.category == "top"]
    bottoms = [c for c in all_clothes if c.category == "bottom"]
    shoes = [c for c in all_clothes if c.category == "shoes"]
    
    return WardrobeResponse(
        tops=tops,
        bottoms=bottoms,
        shoes=shoes
    )


@router.get("/wardrobe/{category}", response_model=list[ClothesItem])
async def get_wardrobe_category(category: str):
    """
    按类别获取衣物
    
    Args:
        category: top, bottom, shoes
    """
    if category not in ["top", "bottom", "shoes"]:
        raise HTTPException(
            status_code=400,
            detail="类别必须是 top, bottom 或 shoes"
        )
    
    return await get_clothes_by_category(category)


@router.get("/clothes/{clothes_id}", response_model=ClothesItem)
async def get_clothes(clothes_id: int):
    """获取单个衣物详情"""
    clothes = await get_clothes_by_id(clothes_id)
    if not clothes:
        raise HTTPException(status_code=404, detail="衣物不存在")
    return clothes


@router.put("/clothes/{clothes_id}")
async def update_clothes_item(clothes_id: int, clothes: ClothesCreate):
    """更新衣物信息"""
    success = await update_clothes(clothes_id, clothes)
    if not success:
        raise HTTPException(status_code=404, detail="衣物不存在")
    return {"message": "更新成功", "id": clothes_id}


@router.delete("/clothes/{clothes_id}")
async def remove_clothes(clothes_id: int):
    """删除衣物"""
    success = await delete_clothes(clothes_id)
    if not success:
        raise HTTPException(status_code=404, detail="衣物不存在")
    return {"message": "删除成功", "id": clothes_id}
