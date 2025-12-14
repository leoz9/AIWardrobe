"""
数据库连接和 CRUD 操作
"""
import aiosqlite
import json
from pathlib import Path
from typing import List, Optional
from datetime import datetime
from domain.clothes import ClothesItem, ClothesCreate
from storage.models import CLOTHES_TABLE_SQL, CLOTHES_INDEX_SQL

# 数据库文件路径
# 优先使用环境变量，方便 Docker 挂载 volume
import os
_default_path = Path(__file__).parent.parent / "wardrobe.db"
DB_PATH = Path(os.getenv("DB_FILE_PATH", _default_path))


async def init_db():
    """初始化数据库，创建表和索引"""
    # 确保数据库文件的父目录存在
    if not DB_PATH.parent.exists():
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute(CLOTHES_TABLE_SQL)
        await db.execute(CLOTHES_INDEX_SQL)
        await db.commit()


async def add_clothes(clothes: ClothesCreate) -> int:
    """
    添加衣物到数据库
    
    Returns:
        新创建的衣物 ID
    """
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """
            INSERT INTO clothes (
                category, item, style_semantics, season_semantics,
                usage_semantics, color_semantics, description, image_filename
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                clothes.category,
                clothes.item,
                json.dumps(clothes.style_semantics),
                json.dumps(clothes.season_semantics),
                json.dumps(clothes.usage_semantics),
                clothes.color_semantics,
                clothes.description,
                clothes.image_filename
            )
        )
        await db.commit()
        return cursor.lastrowid


async def get_all_clothes() -> List[ClothesItem]:
    """获取所有衣物"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM clothes ORDER BY created_at DESC"
        )
        rows = await cursor.fetchall()
        
        return [_row_to_clothes_item(row) for row in rows]


async def get_clothes_by_category(category: str) -> List[ClothesItem]:
    """按类别获取衣物"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM clothes WHERE category = ? ORDER BY created_at DESC",
            (category,)
        )
        rows = await cursor.fetchall()
        
        return [_row_to_clothes_item(row) for row in rows]


async def get_clothes_by_id(clothes_id: int) -> Optional[ClothesItem]:
    """按 ID 获取衣物"""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            "SELECT * FROM clothes WHERE id = ?",
            (clothes_id,)
        )
        row = await cursor.fetchone()
        
        if row:
            return _row_to_clothes_item(row)
        return None


async def delete_clothes(clothes_id: int) -> bool:
    """删除衣物"""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            "DELETE FROM clothes WHERE id = ?",
            (clothes_id,)
        )
        await db.commit()
        return cursor.rowcount > 0


async def update_clothes(clothes_id: int, clothes: ClothesCreate) -> bool:
    """更新衣物信息"""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """
            UPDATE clothes 
            SET category = ?, item = ?, style_semantics = ?, 
                season_semantics = ?, usage_semantics = ?, 
                color_semantics = ?, description = ?
            WHERE id = ?
            """,
            (
                clothes.category,
                clothes.item,
                json.dumps(clothes.style_semantics),
                json.dumps(clothes.season_semantics),
                json.dumps(clothes.usage_semantics),
                clothes.color_semantics,
                clothes.description,
                clothes_id
            )
        )
        await db.commit()
        return cursor.rowcount > 0


def _row_to_clothes_item(row: aiosqlite.Row) -> ClothesItem:
    """将数据库行转换为 ClothesItem"""
    return ClothesItem(
        id=row["id"],
        category=row["category"],
        item=row["item"],
        style_semantics=json.loads(row["style_semantics"] or "[]"),
        season_semantics=json.loads(row["season_semantics"] or "[]"),
        usage_semantics=json.loads(row["usage_semantics"] or "[]"),
        color_semantics=row["color_semantics"] or "",
        description=row["description"] or "",
        image_url=f"/uploads/{row['image_filename']}",
        created_at=datetime.fromisoformat(row["created_at"]) if row["created_at"] else datetime.now()
    )
