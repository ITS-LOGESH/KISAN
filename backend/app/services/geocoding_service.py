import httpx
import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeocodingService:
    """
    Zero-cost geocoding service using Open-Meteo Geocoding API (free, no API key)
    and OpenStreetMap Nominatim for reverse geocoding.
    """
    
    def __init__(self):
        self.search_url = settings.OPEN_METEO_GEOCODING_URL

    async def search_location(self, name: str, count: int = 5) -> List[Dict[str, Any]]:
        """
        Forward geocode: place name -> latitude/longitude.
        Returns list of matching locations with state/district details.
        """
        if not name or len(name.strip()) < 2:
            return []

        params = {
            "name": name.strip(),
            "count": count,
            "language": "en",
            "format": "json"
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(self.search_url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    return [
                        {
                            "name": r.get("name"),
                            "latitude": r.get("latitude"),
                            "longitude": r.get("longitude"),
                            "country": r.get("country", "India"),
                            "admin1": r.get("admin1"), # State
                            "admin2": r.get("admin2"), # District
                            "elevation": r.get("elevation")
                        }
                        for r in results
                    ]
                else:
                    logger.warning(f"Geocoding API status {response.status_code}")
                    return []
        except Exception as e:
            logger.error(f"Geocoding error for '{name}': {str(e)}")
            return []

    async def reverse_geocode(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """
        Reverse geocode: coordinates -> place name, district, state.
        Uses OSM Nominatim with required custom User-Agent.
        """
        url = "https://nominatim.openstreetmap.org/reverse"
        headers = {
            "User-Agent": "KrishiNet-Agricultural-Intelligence-System/1.0 (devika.agri.hackathon@public.org)"
        }
        params = {
            "lat": latitude,
            "lon": longitude,
            "format": "json",
            "zoom": 10
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.get(url, params=params, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    address = data.get("address", {})
                    return {
                        "display_name": data.get("display_name", f"{latitude:.4f}, {longitude:.4f}"),
                        "state": address.get("state") or address.get("state_district") or "Unknown State",
                        "district": address.get("county") or address.get("district") or address.get("city") or "Unknown District",
                        "village": address.get("village") or address.get("suburb"),
                        "status": "RESOLVED"
                    }
                else:
                    return {
                        "display_name": f"{latitude:.4f}, {longitude:.4f}",
                        "state": "Unknown State",
                        "district": "Unknown District",
                        "status": "UNRESOLVED"
                    }
        except Exception as e:
            logger.warning(f"Reverse geocode error: {str(e)}")
            return {
                "display_name": f"{latitude:.4f}, {longitude:.4f}",
                "state": "Unknown State",
                "district": "Unknown District",
                "status": "UNAVAILABLE"
            }

geocoding_service = GeocodingService()
