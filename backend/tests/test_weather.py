import pytest
import time
import asyncio
import httpx
from unittest.mock import patch
from app.services.weather_service import OpenMeteoProvider

MOCK_RAW_WEATHER = {
    "current": {
        "temperature_2m": 29.5,
        "apparent_temperature": 31.0,
        "relative_humidity_2m": 62,
        "precipitation": 0.0,
        "weather_code": 1,
        "wind_speed_10m": 11.5,
        "wind_direction_10m": 190
    },
    "hourly": {
        "time": ["2026-09-30T00:00"],
        "temperature_2m": [29.5],
        "precipitation_probability": [15],
        "precipitation": [0.0],
        "weather_code": [1]
    },
    "daily": {
        "time": ["2026-09-30"],
        "temperature_2m_max": [33.0],
        "temperature_2m_min": [24.0],
        "precipitation_sum": [0.0],
        "precipitation_probability_max": [15],
        "weather_code": [1]
    }
}

def test_weather_fallback_unavailable():
    provider = OpenMeteoProvider()
    fallback = provider._fallback_unavailable("Test connection error")
    assert fallback["status"] == "UNAVAILABLE"
    assert fallback["temperature_c"] is None
    assert fallback["precipitation_probability_pct"] is None
    assert "Test connection error" in fallback["reason"]

def test_cache_ttl_and_cooldown_defaults():
    provider = OpenMeteoProvider()
    assert provider.cache_ttl == 3600
    assert provider.cooldown_seconds == 60
    assert provider.cache == {}
    assert provider.cooldowns == {}
    assert provider._in_flight == {}

def test_concurrent_requests_single_flight():
    provider = OpenMeteoProvider()
    call_count = 0

    async def _run():
        nonlocal call_count
        async def mock_get(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.05)  # Simulate network latency so concurrent callers overlap
            return httpx.Response(200, json=MOCK_RAW_WEATHER)

        with patch("httpx.AsyncClient.get", side_effect=mock_get):
            # Fire 5 concurrent requests for the exact same location
            results = await asyncio.gather(*[
                provider.get_forecast(10.787, 79.138)
                for _ in range(5)
            ])

        assert call_count == 1, f"Expected 1 network call, got {call_count}"
        assert len(results) == 5
        for r in results:
            assert r["temperature_c"] == 29.5
            assert r["cache_status"] in ("LIVE", "FRESH", "CACHED")
        # In-flight registry must be empty after completion
        assert len(provider._in_flight) == 0

    asyncio.run(_run())

def test_in_flight_cleanup_on_exception():
    provider = OpenMeteoProvider()
    call_count = 0

    async def _run():
        nonlocal call_count
        async def mock_get(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.02)
            raise httpx.ConnectError("Network unreachable")

        with patch("httpx.AsyncClient.get", side_effect=mock_get):
            results = await asyncio.gather(*[
                provider.get_forecast(10.787, 79.138)
                for _ in range(3)
            ])

        assert call_count == 1
        for r in results:
            assert r["status"] == "UNAVAILABLE"
            assert "error" in r["reason"].lower() or "unreachable" in r["reason"].lower()
        # In-flight registry must be cleaned up even on error
        assert len(provider._in_flight) == 0

    asyncio.run(_run())

def test_http_429_activates_cooldown_and_returns_unavailable_when_no_cache():
    provider = OpenMeteoProvider()
    call_count = 0

    async def _run():
        nonlocal call_count
        async def mock_get(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            return httpx.Response(429, text="Rate limit exceeded")

        with patch("httpx.AsyncClient.get", side_effect=mock_get):
            res = await provider.get_forecast(10.787, 79.138)

        key = provider._cache_key(10.787, 79.138)
        assert call_count == 1
        assert res["status"] == "UNAVAILABLE"
        assert "rate limit" in res["reason"].lower()
        # Cooldown must be active
        assert key in provider.cooldowns
        assert provider.cooldowns[key] > time.time()
        assert len(provider._in_flight) == 0

    asyncio.run(_run())

def test_requests_during_cooldown_do_not_call_open_meteo():
    provider = OpenMeteoProvider()
    key = provider._cache_key(10.787, 79.138)
    provider.cooldowns[key] = time.time() + 60.0  # Manually set active cooldown
    call_count = 0

    async def _run():
        nonlocal call_count
        async def mock_get(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            return httpx.Response(200, json=MOCK_RAW_WEATHER)

        with patch("httpx.AsyncClient.get", side_effect=mock_get):
            res = await provider.get_forecast(10.787, 79.138)

        # Network call must NOT be made during cooldown
        assert call_count == 0
        assert res["status"] == "UNAVAILABLE"
        assert "rate limit" in res["reason"].lower()

    asyncio.run(_run())

def test_stale_cache_returned_after_429_when_available():
    provider = OpenMeteoProvider()
    key = provider._cache_key(10.787, 79.138)
    # Populate existing cache entry
    stale_data = provider._format_response(MOCK_RAW_WEATHER)
    stale_data["temperature_c"] = 27.0
    provider.cache[key] = {
        "timestamp": time.time() - 4000,  # Expired (older than 3600s TTL)
        "data": stale_data
    }

    call_count = 0

    async def _run():
        nonlocal call_count
        async def mock_get(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            return httpx.Response(429, text="Rate limit exceeded")

        with patch("httpx.AsyncClient.get", side_effect=mock_get):
            res = await provider.get_forecast(10.787, 79.138)

        assert call_count == 1
        assert res["status"] == "CACHED"
        assert res["cache_status"] == "STALE"
        assert res["temperature_c"] == 27.0
        # Cooldown is activated
        assert key in provider.cooldowns

        # Second request during cooldown must return stale cache WITHOUT network call
        with patch("httpx.AsyncClient.get", side_effect=mock_get):
            res2 = await provider.get_forecast(10.787, 79.138)

        assert call_count == 1  # Still 1, no additional network call
        assert res2["status"] == "CACHED"
        assert res2["cache_status"] == "STALE"
        assert res2["temperature_c"] == 27.0

    asyncio.run(_run())

def test_fresh_cache_within_3600s_skips_network():
    provider = OpenMeteoProvider()
    key = provider._cache_key(10.787, 79.138)
    cached_data = provider._format_response(MOCK_RAW_WEATHER)
    provider.cache[key] = {
        "timestamp": time.time() - 1800,  # 30 min old, well within 3600s TTL
        "data": cached_data
    }

    call_count = 0

    async def _run():
        nonlocal call_count
        async def mock_get(*args, **kwargs):
            nonlocal call_count
            call_count += 1
            return httpx.Response(200, json=MOCK_RAW_WEATHER)

        with patch("httpx.AsyncClient.get", side_effect=mock_get):
            res = await provider.get_forecast(10.787, 79.138)

        assert call_count == 0  # No network call
        assert res["status"] == "CACHED"
        assert res["cache_status"] == "FRESH"
        assert res["temperature_c"] == 29.5
