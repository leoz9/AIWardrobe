"""
AI穿搭推荐服务
基于天气、星座运势和衣橱数据生成个性化推荐
"""
import httpx
from typing import Any

from domain.clothes import normalize_category_value
from services.horoscope import get_daily_horoscope
from services.weather import WeatherInfo
from storage.config_store import load_config
from storage.db import get_all_clothes

SEASON_ALIASES = {
    "春": {"春", "春季", "spring"},
    "夏": {"夏", "夏季", "summer"},
    "秋": {"秋", "秋季", "autumn", "fall"},
    "冬": {"冬", "冬季", "winter"},
}

ZODIAC_STYLE_HINTS = {
    "aries": {"运动", "街头", "休闲", "sport", "casual"},
    "taurus": {"简约", "质感", "通勤", "minimal", "business"},
    "gemini": {"轻松", "层次", "日常", "casual", "daily"},
    "cancer": {"柔和", "舒适", "居家", "comfort", "daily"},
    "leo": {"亮眼", "时髦", "正式", "formal", "fashion"},
    "virgo": {"利落", "简约", "通勤", "minimal", "business"},
    "libra": {"平衡", "优雅", "约会", "elegant", "formal"},
    "scorpio": {"深色", "干练", "都市", "formal", "vintage"},
    "sagittarius": {"户外", "运动", "旅行", "sport", "casual"},
    "capricorn": {"通勤", "商务", "经典", "business", "formal"},
    "aquarius": {"个性", "创意", "街头", "street", "casual"},
    "pisces": {"柔和", "文艺", "轻盈", "vintage", "casual"},
}

ACCESSORY_KEYWORDS = (
    "帽", "帽子", "围巾", "项链", "耳环", "耳钉", "手链", "戒指",
    "手表", "墨镜", "眼镜", "领带", "腰带", "cap", "hat", "scarf",
    "necklace", "earring", "bracelet", "ring", "watch", "sunglasses",
    "tie", "belt"
)


def normalize_seasons(raw_values: list[str]) -> set[str]:
    normalized: set[str] = set()
    for value in raw_values or []:
        token = (value or "").strip().lower()
        if not token:
            continue
        for canonical, aliases in SEASON_ALIASES.items():
            if token in aliases:
                normalized.add(canonical)
                break
    return normalized


def build_temperature_profile(weather: WeatherInfo) -> dict[str, Any]:
    feels_like = weather.feelsLike

    if feels_like <= 5:
        return {
            "label": "寒冷",
            "allowed_seasons": {"冬"},
            "advice": "优先保暖，建议选择厚实上衣、长裤和防滑保暖鞋。",
            "purchase_hints": {
                "top": ["羽绒服", "保暖内搭", "羊毛衫"],
                "bottom": ["加绒长裤", "保暖打底裤"],
                "shoes": ["保暖短靴", "防滑鞋"],
                "accessory": ["围巾", "针织帽", "手套"],
            },
        }
    if feels_like <= 14:
        return {
            "label": "偏凉",
            "allowed_seasons": {"秋", "冬"},
            "advice": "建议轻量叠穿，外套和长裤优先，鞋履尽量包裹性更强。",
            "purchase_hints": {
                "top": ["风衣", "针织衫", "卫衣"],
                "bottom": ["直筒长裤", "牛仔裤"],
                "shoes": ["运动鞋", "乐福鞋"],
                "accessory": ["薄围巾", "金属手表"],
            },
        }
    if feels_like <= 24:
        return {
            "label": "舒适",
            "allowed_seasons": {"春", "秋"},
            "advice": "温度适中，保持透气与层次，注意早晚温差。",
            "purchase_hints": {
                "top": ["衬衫", "薄针织", "轻薄夹克"],
                "bottom": ["休闲长裤", "九分裤"],
                "shoes": ["小白鞋", "休闲鞋"],
                "accessory": ["细链项链", "简约手链"],
            },
        }
    if feels_like <= 30:
        return {
            "label": "偏热",
            "allowed_seasons": {"春", "夏"},
            "advice": "优先透气轻薄单品，避免厚重面料。",
            "purchase_hints": {
                "top": ["短袖T恤", "亚麻衬衫"],
                "bottom": ["轻薄休闲裤", "短裤"],
                "shoes": ["透气运动鞋", "凉鞋"],
                "accessory": ["棒球帽", "太阳镜"],
            },
        }
    return {
        "label": "炎热",
        "allowed_seasons": {"夏"},
        "advice": "尽量选择吸汗速干和透气面料，减少叠穿。",
        "purchase_hints": {
            "top": ["速干短袖", "背心"],
            "bottom": ["速干短裤", "轻薄短裤"],
            "shoes": ["凉鞋", "网面运动鞋"],
            "accessory": ["遮阳帽", "太阳镜"],
        },
    }


def is_temperature_compatible(item: dict, allowed_seasons: set[str]) -> bool:
    item_seasons = normalize_seasons(item.get("season_semantics", []))
    if not item_seasons:
        return False
    return bool(item_seasons & allowed_seasons)


def build_color_tokens(raw_color: str) -> list[str]:
    base = (raw_color or "").strip().lower()
    if not base:
        return []
    compact = base.replace("色", "").replace("系", "").replace(" ", "")
    tokens = {base, compact}
    if len(compact) >= 2:
        tokens.add(compact[:2])
    return [token for token in tokens if token]


def score_item(
    item: dict,
    category: str,
    horoscope: dict,
    weather: WeatherInfo,
    temperature_profile: dict[str, Any],
) -> tuple[int, list[str]]:
    score = 5
    reasons = [f"季节标签匹配{temperature_profile['label']}温度策略"]

    lucky_color = horoscope.get("lucky_color", "")
    color_tokens = build_color_tokens(lucky_color)
    searchable_text = " ".join([
        str(item.get("item", "")),
        str(item.get("color_semantics", "")),
        str(item.get("description", "")),
    ]).lower()

    if color_tokens and any(token in searchable_text for token in color_tokens):
        score += 4
        reasons.append(f"颜色接近今日幸运色「{lucky_color}」")

    sign_key = horoscope.get("zodiac_sign", "")
    style_hints = ZODIAC_STYLE_HINTS.get(sign_key, set())
    style_values = {
        str(v).strip().lower()
        for v in item.get("style_semantics", [])
        if str(v).strip()
    }
    if style_hints and (style_values & style_hints):
        score += 3
        reasons.append("风格与今日星座运势倾向一致")

    if category == "shoes" and ("雨" in weather.condition or "雪" in weather.condition):
        if any(keyword in searchable_text for keyword in ("防水", "短靴", "boot", "靴")):
            score += 2
            reasons.append("天气有降水，鞋履更注重防滑/防水")

    return score, reasons


def pick_best_item(
    candidates: list[dict],
    category: str,
    horoscope: dict,
    weather: WeatherInfo,
    temperature_profile: dict[str, Any],
) -> tuple[dict | None, str]:
    if not candidates:
        return None, ""

    best_item = None
    best_score = -1
    best_reasons: list[str] = []

    for item in candidates:
        score, reasons = score_item(item, category, horoscope, weather, temperature_profile)
        if score > best_score:
            best_score = score
            best_item = item
            best_reasons = reasons

    return best_item, "；".join(best_reasons)


def build_purchase_suggestion(
    category: str,
    temperature_profile: dict[str, Any],
    horoscope: dict,
) -> dict[str, Any]:
    names = {
        "top": "上装",
        "bottom": "下装",
        "shoes": "鞋履",
    }
    hints = temperature_profile["purchase_hints"].get(category, [])
    zodiac_name = horoscope.get("zodiac_name", "今日运势")
    lucky_color = horoscope.get("lucky_color", "中性色")
    return {
        "category": category,
        "title": f"建议补充{names.get(category, category)}",
        "reason": f"衣柜中暂无满足当前温度策略的{names.get(category, category)}，建议优先补齐温度刚需单品。",
        "keywords": hints,
        "horoscope_hint": f"{zodiac_name}今日幸运色为{lucky_color}，可优先选择该色系。",
    }


def extract_wardrobe_accessories(all_clothes: list[dict]) -> list[dict]:
    accessories = []
    for item in all_clothes:
        if normalize_category_value(str(item.get("category", ""))) == "accessory":
            accessories.append(item)
            continue
        text = f"{item.get('item', '')} {item.get('description', '')}".lower()
        if any(keyword in text for keyword in ACCESSORY_KEYWORDS):
            accessories.append(item)
    return accessories


def build_purchase_accessories(
    temperature_profile: dict[str, Any],
    horoscope: dict,
) -> list[dict]:
    lucky_color = horoscope.get("lucky_color", "中性色")
    zodiac_name = horoscope.get("zodiac_name", "今日运势")
    base_items = temperature_profile["purchase_hints"].get("accessory", ["简约手链", "通勤手表"])
    return [
        {
            "name": accessory_name,
            "reason": f"结合{zodiac_name}与天气体感，选择{lucky_color}或同色系点缀更协调。",
            "from_wardrobe": False,
            "should_buy": True,
        }
        for accessory_name in base_items[:2]
    ]


def build_recommendation_summary(
    selected: dict[str, dict | None],
    purchase_suggestions: list[dict],
) -> str:
    outfit_parts = []
    for category in ("top", "bottom", "shoes"):
        item = selected.get(category)
        if item:
            outfit_parts.append(f"{category}: {item.get('item', '未命名')}")

    summary = "，".join(outfit_parts) if outfit_parts else "暂无可直接搭配的单品。"
    if purchase_suggestions:
        summary += f" 需要补充 {len(purchase_suggestions)} 类温度必需单品。"
    return summary


async def get_ai_recommendation(weather: WeatherInfo, zodiac_sign: str | None = None) -> dict:
    """
    根据天气和星座运势获取AI穿搭推荐。
    温度约束为硬条件：衣柜单品必须满足温度策略，不满足时给出购买兜底。
    """
    all_clothes_items = await get_all_clothes()
    all_clothes = [
        {
            "id": item.id,
            "category": item.category,
            "item": item.item,
            "style_semantics": item.style_semantics,
            "season_semantics": item.season_semantics,
            "usage_semantics": item.usage_semantics,
            "color_semantics": item.color_semantics,
            "description": item.description,
            "image_url": item.image_url,
        }
        for item in all_clothes_items
    ]

    horoscope = await get_daily_horoscope(
        weather=weather,
        zodiac_sign=zodiac_sign,
        include_inference=True,
    )
    temperature_profile = build_temperature_profile(weather)

    by_category: dict[str, list[dict]] = {"top": [], "bottom": [], "shoes": []}
    for item in all_clothes:
        category = normalize_category_value(str(item.get("category", "")))
        if category not in by_category:
            continue
        if is_temperature_compatible(item, temperature_profile["allowed_seasons"]):
            by_category[category].append(item)

    selected: dict[str, dict | None] = {}
    selection_reasons: dict[str, str] = {}
    purchase_suggestions: list[dict] = []

    for category in ("top", "bottom", "shoes"):
        chosen, reason = pick_best_item(
            by_category[category],
            category=category,
            horoscope=horoscope,
            weather=weather,
            temperature_profile=temperature_profile,
        )
        selected[category] = chosen
        selection_reasons[category] = reason
        if chosen is None:
            purchase_suggestions.append(
                build_purchase_suggestion(category, temperature_profile, horoscope)
            )

    accessory_candidates = extract_wardrobe_accessories(all_clothes)
    compatible_accessories = []
    for item in accessory_candidates:
        # 饰品优先按季节匹配；无季节标签时保留可选。
        if is_temperature_compatible(item, temperature_profile["allowed_seasons"]) or not item.get("season_semantics"):
            compatible_accessories.append(item)

    suggested_accessories: list[dict[str, Any]] = []
    if compatible_accessories:
        scored = []
        for item in compatible_accessories:
            score, reasons = score_item(
                item,
                category="accessory",
                horoscope=horoscope,
                weather=weather,
                temperature_profile=temperature_profile,
            )
            scored.append((score, item, "；".join(reasons)))
        scored.sort(key=lambda value: value[0], reverse=True)
        for _, item, reason in scored[:2]:
            suggested_accessories.append(
                {
                    "name": item.get("item", "饰品"),
                    "reason": reason or "与今日运势风格匹配",
                    "from_wardrobe": True,
                    "should_buy": False,
                    "item": item,
                }
            )
    else:
        suggested_accessories = build_purchase_accessories(temperature_profile, horoscope)

    recommendation_text = await get_llm_recommendation(
        weather=weather,
        horoscope=horoscope,
        temperature_profile=temperature_profile,
        selected=selected,
        selection_reasons=selection_reasons,
        purchase_suggestions=purchase_suggestions,
        suggested_accessories=suggested_accessories,
    )

    return {
        "weather": {
            "temperature": weather.temperature,
            "feelsLike": weather.feelsLike,
            "condition": weather.condition,
            "icon": weather.icon,
            "humidity": weather.humidity,
            "windDir": weather.windDir,
            "windScale": weather.windScale,
            "location": weather.location,
            "obsTime": weather.obsTime,
        },
        "horoscope": horoscope,
        "temperature_rule": {
            "label": temperature_profile["label"],
            "allowed_seasons": sorted(list(temperature_profile["allowed_seasons"])),
            "advice": temperature_profile["advice"],
        },
        "recommendation_text": recommendation_text,
        "outfit_summary": build_recommendation_summary(selected, purchase_suggestions),
        "selection_reasons": selection_reasons,
        "suggested_top": selected.get("top"),
        "suggested_bottom": selected.get("bottom"),
        "suggested_shoes": selected.get("shoes"),
        "suggested_accessories": suggested_accessories,
        "purchase_suggestions": purchase_suggestions,
    }


async def get_llm_recommendation(
    weather: WeatherInfo,
    horoscope: dict,
    temperature_profile: dict[str, Any],
    selected: dict[str, dict | None],
    selection_reasons: dict[str, str],
    purchase_suggestions: list[dict],
    suggested_accessories: list[dict],
) -> str:
    """
    使用 LLM 生成推荐文案，失败时回退到规则文本。
    """
    config = load_config()
    if not config.api_key:
        return generate_basic_recommendation(
            weather=weather,
            horoscope=horoscope,
            temperature_profile=temperature_profile,
            selected=selected,
            selection_reasons=selection_reasons,
            purchase_suggestions=purchase_suggestions,
            suggested_accessories=suggested_accessories,
        )

    def item_name(category: str) -> str:
        item = selected.get(category)
        return item["item"] if item else "缺失"

    purchase_lines = "\n".join(
        [f"- {entry['title']}：{', '.join(entry.get('keywords', []))}" for entry in purchase_suggestions]
    ) or "- 无需购买补充"

    accessory_lines = "\n".join(
        [
            f"- {entry.get('name', '饰品')}（{'衣柜已有' if entry.get('from_wardrobe') else '建议补购'}）：{entry.get('reason', '')}"
            for entry in suggested_accessories
        ]
    ) or "- 暂无饰品建议"

    prompt = f"""
你是一位务实的穿搭顾问。请基于以下信息输出一段 Markdown 推荐：

天气：
- 温度 {weather.temperature}°C，体感 {weather.feelsLike}°C，{weather.condition}
- 湿度 {weather.humidity}% / 风力 {weather.windScale}级

星座运势：
- 星座：{horoscope.get('zodiac_name', '未设置')}
- 今日关键词：{horoscope.get('mood', '平稳')}
- 幸运色：{horoscope.get('lucky_color', '中性色')}
- 运势摘要：{horoscope.get('summary', '')}

温度策略：
- 档位：{temperature_profile['label']}
- 可用季节标签：{', '.join(sorted(list(temperature_profile['allowed_seasons'])))}
- 策略建议：{temperature_profile['advice']}

从衣柜挑选结果（仅保留温度匹配单品）：
- 上装：{item_name('top')}（{selection_reasons.get('top', '未命中')}）
- 下装：{item_name('bottom')}（{selection_reasons.get('bottom', '未命中')}）
- 鞋履：{item_name('shoes')}（{selection_reasons.get('shoes', '未命中')}）

缺失补购建议：
{purchase_lines}

饰品建议：
{accessory_lines}

输出要求：
1. 先给出今日穿搭结论（2-3句）
2. 明确指出哪些是衣柜现有、哪些需要补购
3. 补充1条与星座运势相关的饰品搭配建议
4. 不要输出代码块
"""

    try:
        api_base = config.api_base.rstrip("/")
        if not api_base.endswith("/v1"):
            api_base = f"{api_base}/v1"

        payload = {
            "model": config.model,
            "messages": [
                {
                    "role": "system",
                    "content": "你是专业穿搭顾问，强调可执行建议和温度适配。",
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.6,
        }

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                f"{api_base}/chat/completions",
                headers={
                    "Authorization": f"Bearer {config.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )

        if response.status_code != 200:
            print(f"LLM API请求失败: {response.status_code}")
            return generate_basic_recommendation(
                weather=weather,
                horoscope=horoscope,
                temperature_profile=temperature_profile,
                selected=selected,
                selection_reasons=selection_reasons,
                purchase_suggestions=purchase_suggestions,
                suggested_accessories=suggested_accessories,
            )

        data = response.json()
        return data["choices"][0]["message"]["content"].strip()
    except Exception as exc:
        print(f"调用LLM失败: {exc}")
        return generate_basic_recommendation(
            weather=weather,
            horoscope=horoscope,
            temperature_profile=temperature_profile,
            selected=selected,
            selection_reasons=selection_reasons,
            purchase_suggestions=purchase_suggestions,
            suggested_accessories=suggested_accessories,
        )


def generate_basic_recommendation(
    weather: WeatherInfo,
    horoscope: dict,
    temperature_profile: dict[str, Any],
    selected: dict[str, dict | None],
    selection_reasons: dict[str, str],
    purchase_suggestions: list[dict],
    suggested_accessories: list[dict],
) -> str:
    """
    生成规则版推荐文本（不依赖 LLM）。
    """
    lines = [
        f"### 今日穿搭结论",
        f"体感温度约 **{weather.feelsLike}°C**，按 **{temperature_profile['label']}** 策略搭配：{temperature_profile['advice']}",
        "",
        "### 衣柜命中单品",
    ]

    category_names = {"top": "上装", "bottom": "下装", "shoes": "鞋履"}
    for category in ("top", "bottom", "shoes"):
        item = selected.get(category)
        if item:
            lines.append(
                f"- {category_names[category]}：**{item.get('item', '未命名')}**（{selection_reasons.get(category, '温度匹配')}）"
            )
        else:
            lines.append(f"- {category_names[category]}：暂无温度匹配单品")

    if purchase_suggestions:
        lines.extend(["", "### 补购清单（兜底）"])
        for entry in purchase_suggestions:
            keywords = "、".join(entry.get("keywords", [])) or "基础款"
            lines.append(f"- {entry['title']}：{keywords}。{entry['horoscope_hint']}")

    if suggested_accessories:
        lines.extend(["", "### 饰品建议（结合星座运势）"])
        for entry in suggested_accessories[:2]:
            source = "衣柜已有" if entry.get("from_wardrobe") else "建议补购"
            lines.append(f"- **{entry.get('name', '饰品')}**（{source}）：{entry.get('reason', '')}")

    horoscope_tip = horoscope.get("suggestion", "")
    if horoscope_tip:
        lines.extend(["", f"运势提醒：{horoscope_tip}"])

    return "\n".join(lines)
