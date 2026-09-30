import time
import asyncio
import httpx
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

# WMO Weather Code Mapping (standard meteorological codes)
WMO_CODE_MAP = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
}

class WeatherProvider(ABC):
    """Abstract weather provider interface for pluggable implementations."""
    
    @abstractmethod
    async def get_forecast(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch current weather and forecasts for a coordinate pair."""
        pass


class OpenMeteoProvider(WeatherProvider):
    """
    Open-Meteo Weather API Provider.
    Zero-cost, non-commercial public API. No API key required.
    Includes in-memory cache, in-flight request deduplication, and rate-limit cooldown.
    """
    
    def __init__(self, cache_ttl_seconds: int = 3600, cooldown_seconds: int = 60): # 1 hour cache, 60s 429 cooldown
        self.base_url = settings.OPEN_METEO_BASE_URL
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.cache_ttl = cache_ttl_seconds
        self.cooldown_seconds = cooldown_seconds
        self.cooldowns: Dict[str, float] = {}
        self._in_flight: Dict[str, asyncio.Task] = {}

    def _cache_key(self, lat: float, lon: float) -> str:
        return f"{round(lat, 3)}:{round(lon, 3)}"

    async def get_forecast(self, latitude: float, longitude: float) -> Dict[str, Any]:
        # Validate coordinates
        if not (-90.0 <= latitude <= 90.0 and -180.0 <= longitude <= 180.0):
            return self._fallback_unavailable(f"Invalid geographical coordinates: ({latitude}, {longitude})")

        key = self._cache_key(latitude, longitude)
        now = time.time()
        
        # 1. Check cache for fresh entry
        if key in self.cache:
            entry = self.cache[key]
            if now - entry["timestamp"] < self.cache_ttl:
                cached_data = dict(entry["data"])
                cached_data["status"] = "CACHED"
                cached_data["cache_status"] = "FRESH"
                return cached_data

        # 2. Check HTTP 429 cooldown for this location
        if key in self.cooldowns:
            if now < self.cooldowns[key]:
                logger.info(f"Open-Meteo cooldown active for {key}. Skipping network request.")
                if key in self.cache:
                    stale = dict(self.cache[key]["data"])
                    stale["status"] = "CACHED"
                    stale["cache_status"] = "STALE"
                    return stale
                return self._fallback_unavailable("Open-Meteo rate limit reached. Please wait a moment.")
            else:
                del self.cooldowns[key]

        # 3. In-flight request deduplication (Single-flight)
        if key in self._in_flight:
            logger.debug(f"Awaiting existing in-flight weather request for {key}")
            res = await self._in_flight[key]
            return dict(res)

        # Create new in-flight task
        task = asyncio.create_task(self._fetch_and_cache(key, latitude, longitude))
        self._in_flight[key] = task
        try:
            res = await task
            return dict(res)
        finally:
            self._in_flight.pop(key, None)

    async def _fetch_and_cache(self, key: str, latitude: float, longitude: float) -> Dict[str, Any]:
        try:
            return await self._do_fetch(key, latitude, longitude)
        finally:
            self._in_flight.pop(key, None)

    async def _do_fetch(self, key: str, latitude: float, longitude: float) -> Dict[str, Any]:
        url = f"{self.base_url}/v1/forecast"
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m,wind_direction_10m",
            "hourly": "temperature_2m,precipitation_probability,precipitation,weather_code",
            "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weather_code",
            "timezone": "auto",
            "forecast_days": 7
        }

        now = time.time()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                
                if response.status_code == 200:
                    data = response.json()
                    formatted = self._format_response(data)
                    formatted["cache_status"] = "LIVE"
                    # Cache successful response
                    self.cache[key] = {
                        "timestamp": now,
                        "data": formatted
                    }
                    return formatted
                elif response.status_code == 429:
                    logger.warning("Open-Meteo API rate limit exceeded (HTTP 429). Activating cooldown.")
                    self.cooldowns[key] = now + self.cooldown_seconds
                    if key in self.cache:
                        stale = dict(self.cache[key]["data"])
                        stale["status"] = "CACHED"
                        stale["cache_status"] = "STALE"
                        return stale
                    return self._fallback_unavailable("Open-Meteo rate limit reached. Please wait a moment.")
                else:
                    logger.error(f"Open-Meteo API returned error status {response.status_code}: {response.text}")
                    if key in self.cache:
                        stale = dict(self.cache[key]["data"])
                        stale["status"] = "CACHED"
                        stale["cache_status"] = "STALE"
                        return stale
                    return self._fallback_unavailable(f"Open-Meteo returned status {response.status_code}")
        except httpx.TimeoutException:
            logger.error("Timeout connecting to Open-Meteo API")
            if key in self.cache:
                stale = dict(self.cache[key]["data"])
                stale["status"] = "CACHED"
                stale["cache_status"] = "STALE"
                return stale
            return self._fallback_unavailable("Weather service timeout (Open-Meteo).")
        except Exception as e:
            logger.error(f"Error fetching Open-Meteo weather: {str(e)}")
            if key in self.cache:
                stale = dict(self.cache[key]["data"])
                stale["status"] = "CACHED"
                stale["cache_status"] = "STALE"
                return stale
            return self._fallback_unavailable(f"Weather service error: {str(e)}")

    def _format_response(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        current = raw.get("current", {})
        hourly = raw.get("hourly", {})
        daily = raw.get("daily", {})
        
        weather_code = current.get("weather_code")
        weather_desc = WMO_CODE_MAP.get(weather_code, "Unknown weather condition")
        
        # Extract next 24 hourly points
        hourly_forecast = []
        times = hourly.get("time", [])[:24]
        temps = hourly.get("temperature_2m", [])[:24]
        precip_probs = hourly.get("precipitation_probability", [])[:24]
        precip_mms = hourly.get("precipitation", [])[:24]
        
        for i in range(len(times)):
            hourly_forecast.append({
                "time": times[i],
                "temperature_c": temps[i] if i < len(temps) else 0.0,
                "precipitation_probability": precip_probs[i] if i < len(precip_probs) else 0.0,
                "precipitation_mm": precip_mms[i] if i < len(precip_mms) else 0.0,
            })

        # Extract 7 daily points
        daily_forecast = []
        d_times = daily.get("time", [])
        d_max = daily.get("temperature_2m_max", [])
        d_min = daily.get("temperature_2m_min", [])
        d_sum = daily.get("precipitation_sum", [])
        d_prob = daily.get("precipitation_probability_max", [])
        d_codes = daily.get("weather_code", [])
        
        for i in range(len(d_times)):
            code = d_codes[i] if i < len(d_codes) else 0
            daily_forecast.append({
                "date": d_times[i],
                "temp_max": d_max[i] if i < len(d_max) else 0.0,
                "temp_min": d_min[i] if i < len(d_min) else 0.0,
                "precipitation_sum": d_sum[i] if i < len(d_sum) else 0.0,
                "precipitation_probability_max": d_prob[i] if i < len(d_prob) else 0.0,
                "weather_desc": WMO_CODE_MAP.get(code, "Clear")
            })

        # Calculate precipitation probability for current timeframe
        current_precip_prob = precip_probs[0] if precip_probs else None

        return {
            "source": "Open-Meteo Public API (Attribution: Open-Meteo.com under CC BY 4.0)",
            "retrieved_at": datetime.utcnow().isoformat(),
            "temperature_c": current.get("temperature_2m"),
            "apparent_temp_c": current.get("apparent_temperature"),
            "humidity_pct": current.get("relative_humidity_2m"),
            "precipitation_mm": current.get("precipitation"),
            "precipitation_probability_pct": current_precip_prob,
            "wind_speed_kmh": current.get("wind_speed_10m"),
            "wind_direction_deg": current.get("wind_direction_10m"),
            "weather_code": weather_code,
            "weather_desc": weather_desc,
            "hourly_forecast": hourly_forecast,
            "daily_forecast": daily_forecast,
            "status": "LIVE",
            "cache_status": "LIVE"
        }

    def _fallback_unavailable(self, reason: str) -> Dict[str, Any]:
        """Never fabricate fake numbers when weather API is unavailable."""
        return {
            "source": "Open-Meteo Public API",
            "retrieved_at": datetime.utcnow().isoformat(),
            "temperature_c": None,
            "apparent_temp_c": None,
            "humidity_pct": None,
            "precipitation_mm": None,
            "precipitation_probability_pct": None,
            "wind_speed_kmh": None,
            "wind_direction_deg": None,
            "weather_code": None,
            "weather_desc": "Unavailable",
            "hourly_forecast": [],
            "daily_forecast": [],
            "status": "UNAVAILABLE",
            "cache_status": "UNAVAILABLE",
            "reason": reason
        }


# Global weather service instance with provider abstraction
weather_service = OpenMeteoProvider()
