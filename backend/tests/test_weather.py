import pytest
from app.services.weather_service import OpenMeteoProvider

def test_weather_fallback_unavailable():
    provider = OpenMeteoProvider()
    fallback = provider._fallback_unavailable("Test connection error")
    assert fallback["status"] == "UNAVAILABLE"
    assert fallback["temperature_c"] is None
    assert fallback["precipitation_probability_pct"] is None
    assert "Test connection error" in fallback["reason"]
