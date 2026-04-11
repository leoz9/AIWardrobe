import asyncio
from types import SimpleNamespace
import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

import main
import storage.db as db_store
import services.weather as weather_service
from domain.clothes import resolve_category_value
from services.weather import build_weather_cache_bucket, build_weather_cache_key


def _mock_weather(location: str):
    return SimpleNamespace(
        temperature=22.0,
        feelsLike=23.0,
        condition="晴",
        icon="100",
        humidity=55.0,
        windDir="东北风",
        windScale="3",
        location="上海, 上海市, 中国",
        obsTime="2026-04-10T10:00:00+08:00",
    )


class RecommendationApiTests(unittest.TestCase):
    def test_recommendation_api_returns_mode_goal_and_reasons(self):
        async def fake_get_ai_recommendation(weather, zodiac_sign=None, goal=None, mode="balanced"):
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
                "recommendation_text": "推荐文案",
                "selection_reasons": {
                    "top": "理由-top",
                    "bottom": "理由-bottom",
                    "shoes": "理由-shoes",
                },
                "suggested_top": {"item": "白衬衫"},
                "suggested_bottom": {"item": "黑长裤"},
                "suggested_shoes": {"item": "小白鞋"},
                "suggested_accessories": [],
                "purchase_suggestions": [],
                "goal_raw": goal,
                "goal_normalized": "commute",
                "mode": mode,
            }

        with patch("api.recommendation.get_weather", new=AsyncMock(side_effect=_mock_weather)):
            with patch("api.recommendation.get_ai_recommendation", new=AsyncMock(side_effect=fake_get_ai_recommendation)):
                client = TestClient(main.app)
                response = client.get(
                    "/api/recommendation",
                    params={
                        "location": "上海, 上海市, 中国",
                        "goal": "上班通勤",
                        "mode": "goal_first",
                    },
                )

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["mode"], "goal_first")
        self.assertEqual(payload["goal_raw"], "上班通勤")
        self.assertEqual(payload["goal_normalized"], "commute")
        self.assertIn("selection_reasons", payload)
        self.assertTrue(payload["selection_reasons"]["top"])

    def test_category_resolution_for_hoodie_prefers_top(self):
        category = resolve_category_value("unknown", "连帽拉链卫衣", "休闲风格，适合通勤")
        self.assertEqual(category, "top")

    def test_recommendation_mode_weights_config_roundtrip(self):
        import storage.config_store as config_store

        backup_file = config_store.CONFIG_FILE
        backup_cache = config_store._CONFIG_CACHE
        backup_mtime = config_store._CONFIG_MTIME

        temp_file = backup_file.with_name("llm_config_test.json")
        config_store.CONFIG_FILE = temp_file
        config_store._CONFIG_CACHE = None
        config_store._CONFIG_MTIME = None

        try:
            if temp_file.exists():
                temp_file.unlink()

            client = TestClient(main.app)

            get_resp = client.get("/api/config")
            self.assertEqual(get_resp.status_code, 200)
            self.assertIn("recommendation_mode_weights", get_resp.json())

            update_payload = {
                "recommendation_mode_weights": {
                    "balanced": {"goal_bonus": 5, "color_bonus": 4, "style_bonus": 3},
                    "goal_first": {"goal_bonus": 8, "color_bonus": 2, "style_bonus": 2},
                    "wardrobe_first": {"goal_bonus": 1, "color_bonus": 6, "style_bonus": 5},
                }
            }
            post_resp = client.post("/api/config", json=update_payload)
            self.assertEqual(post_resp.status_code, 200)

            cfg = post_resp.json()["config"]["recommendation_mode_weights"]
            self.assertEqual(cfg["goal_first"]["goal_bonus"], 8)
            self.assertEqual(cfg["wardrobe_first"]["color_bonus"], 6)

        finally:
            if temp_file.exists():
                temp_file.unlink()
            config_store.CONFIG_FILE = backup_file
            config_store._CONFIG_CACHE = backup_cache
            config_store._CONFIG_MTIME = backup_mtime

    def test_get_weather_uses_db_cache_before_provider(self):
        async def run_case():
            cache_key = build_weather_cache_key("121.4737,31.2304")
            bucket = build_weather_cache_bucket()

            await db_store.upsert_weather_cache(
                cache_key,
                bucket,
                {
                    "temperature": 18.5,
                    "feelsLike": 19.0,
                    "condition": "多云",
                    "icon": "102",
                    "humidity": 63.0,
                    "windDir": "东北风",
                    "windScale": "2",
                    "location": "上海, 上海市, 中国",
                    "obsTime": "2026-04-11T10:00:00+08:00",
                },
            )

            with patch("services.weather.resolve_location", new=AsyncMock(return_value=("121.4737,31.2304", "上海, 上海市, 中国"))):
                with patch("services.weather.get_qweather_now", new=AsyncMock(side_effect=AssertionError("provider should not be called"))):
                    weather = await weather_service.get_weather("上海, 上海市, 中国")

            self.assertIsNotNone(weather)
            self.assertEqual(weather.condition, "多云")
            self.assertEqual(weather.temperature, 18.5)

        asyncio.run(run_case())


if __name__ == "__main__":
    unittest.main()
