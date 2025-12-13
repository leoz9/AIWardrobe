"""
配置存储 - 使用 JSON 文件持久化配置
"""
import json
from pathlib import Path
from typing import Optional
from domain.config import LLMConfig

CONFIG_FILE = Path(__file__).parent / "llm_config.json"


def load_config() -> LLMConfig:
    """加载 LLM 配置"""
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return LLMConfig(**data)
        except Exception:
            pass
    return LLMConfig()


def save_config(config: LLMConfig) -> None:
    """保存 LLM 配置"""
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config.model_dump(), f, indent=2, ensure_ascii=False)


def update_config(
    api_base: Optional[str] = None,
    api_key: Optional[str] = None, 
    model: Optional[str] = None,
    removebg_api_key: Optional[str] = None,
    bg_removal_method: Optional[str] = None,
    qweather_api_key: Optional[str] = None,
    qweather_api_host: Optional[str] = None
) -> LLMConfig:
    """更新配置"""
    config = load_config()
    
    if api_base is not None:
        config.api_base = api_base.strip()
    if api_key is not None:
        config.api_key = api_key.strip()
    if model is not None:
        config.model = model.strip()
    if removebg_api_key is not None:
        config.removebg_api_key = removebg_api_key.strip()
    if bg_removal_method is not None:
        config.bg_removal_method = bg_removal_method
    if qweather_api_key is not None:
        config.qweather_api_key = qweather_api_key.strip()
    if qweather_api_host is not None:
        config.qweather_api_host = qweather_api_host.strip()
    
    save_config(config)
    return config


def _mask_key(key: str) -> str:
    """对 API Key 进行脱敏处理"""
    if not key:
        return ""
    if len(key) > 8:
        return key[:4] + "*" * (len(key) - 8) + key[-4:]
    return "*" * len(key)


def get_masked_config() -> dict:
    """获取脱敏后的配置（隐藏 API Key）"""
    config = load_config()
    
    return {
        "api_base": config.api_base,
        "api_key_masked": _mask_key(config.api_key),
        "has_api_key": bool(config.api_key),
        "model": config.model,
        "removebg_api_key_masked": _mask_key(config.removebg_api_key),
        "has_removebg_key": bool(config.removebg_api_key),
        "bg_removal_method": config.bg_removal_method,
        "qweather_api_key_masked": _mask_key(config.qweather_api_key),
        "has_qweather_key": bool(config.qweather_api_key),
        "qweather_api_host": config.qweather_api_host
    }
