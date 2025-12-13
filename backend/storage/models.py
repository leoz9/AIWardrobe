"""
SQLite 数据库模型定义
使用 aiosqlite 进行异步操作
"""

# 数据库表结构
CLOTHES_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS clothes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,  -- top, bottom, shoes
    item TEXT NOT NULL,
    style_semantics TEXT,  -- JSON array
    season_semantics TEXT,  -- JSON array
    usage_semantics TEXT,  -- JSON array
    color_semantics TEXT,
    description TEXT,
    image_filename TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

# 创建索引用于快速查询
CLOTHES_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_clothes_category ON clothes(category);
"""
