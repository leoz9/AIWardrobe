"""
SQLite 数据库模型定义
使用 aiosqlite 进行异步操作
"""

# 数据库表结构
CLOTHES_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS clothes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,  -- top, bottom, shoes, accessory
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

# 星座运势缓存表
HOROSCOPE_RECORDS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS horoscope_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_date TEXT NOT NULL,  -- YYYY-MM-DD
    zodiac_sign TEXT NOT NULL,
    zodiac_name TEXT NOT NULL,
    source_provider TEXT NOT NULL,  -- aztro / fallback
    source_payload TEXT NOT NULL,  -- JSON
    llm_status TEXT NOT NULL DEFAULT 'pending',  -- pending / done / failed / skipped
    llm_reasoning TEXT,
    llm_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(record_date, zodiac_sign)
);
"""

HOROSCOPE_RECORDS_INDEX_SQL = """
CREATE INDEX IF NOT EXISTS idx_horoscope_date_sign ON horoscope_records(record_date, zodiac_sign);
"""
