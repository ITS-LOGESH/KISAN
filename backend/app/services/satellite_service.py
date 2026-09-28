import httpx
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from app.core.config import settings

logger = logging.getLogger(__name__)

class SatelliteProvider(ABC):
    """Abstract interface for satellite data providers."""
    
    @abstractmethod
    async def get_vegetation_metrics(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Retrieve recent satellite observation metrics for a location."""
        pass


class PublicDatasetProvider(SatelliteProvider):
    """
    Public Earth Observation Provider using open STAC catalogs (Sentinel-2 L2A via Element84/AWS open registry).
    100% Zero-cost, public open science dataset.
    Follows strict Phase 3 Rule: Never fabricate NDVI. If bands are unretrieved, report UNAVAILABLE.
    """
    
    def __init__(self):
        self.stac_url = "https://earth-search.aws.element84.com/v1/search"

    async def get_vegetation_metrics(self, latitude: float, longitude: float) -> Dict[str, Any]:
        # Search window: last 45 days
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=45)
        
        # Bounding box around coordinates (+/- 0.03 deg ~ 3km)
        bbox = [
            longitude - 0.03,
            latitude - 0.03,
            longitude + 0.03,
            latitude + 0.03
        ]
        
        payload = {
            "collections": ["sentinel-2-l2a"],
            "bbox": bbox,
            "datetime": f"{start_date.strftime('%Y-%m-%dT00:00:00Z')}/{end_date.strftime('%Y-%m-%dT23:59:59Z')}",
            "limit": 6,
            "sortby": [{"field": "properties.datetime", "direction": "desc"}]
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(self.stac_url, json=payload)
                if response.status_code == 200:
                    data = response.json()
                    features: List[Dict[str, Any]] = data.get("features", [])
                    
                    if not features:
                        return self._no_observation_response("No Sentinel-2 scenes found in the last 45 days for this bounding box.")
                    
                    # 1. Inspect the newest scene
                    newest_scene = features[0]
                    newest_props = newest_scene.get("properties", {})
                    newest_cloud = newest_props.get("eo:cloud_cover", 100.0)
                    
                    selected_scene = newest_scene
                    is_older = False
                    
                    # 2. Cloud Handling (Rule 8):
                    # If the newest scene is excessively cloudy (>75%), search older observations in window
                    if newest_cloud > 75.0:
                        usable_candidates = [
                            f for f in features[1:] 
                            if f.get("properties", {}).get("eo:cloud_cover", 100.0) <= 75.0
                        ]
                        if usable_candidates:
                            selected_scene = usable_candidates[0]
                            is_older = True
                        else:
                            # ALL recent scenes are excessively cloudy
                            scene_id = newest_scene.get("id", "Sentinel-2 Scene")
                            obs_time_str = newest_props.get("datetime")
                            platform = newest_props.get("platform", "Sentinel-2")
                            newest_assets = newest_scene.get("assets", {})
                            thumb_url = newest_assets.get("thumbnail", {}).get("href") or newest_assets.get("overview", {}).get("href")
                            return {
                                "provider": f"Copernicus {platform}",
                                "dataset": "Sentinel-2 L2A",
                                "scene_id": scene_id,
                                "observation_date": obs_time_str,
                                "ndvi": None, # Never fabricate NDVI when obscured by clouds
                                "ndwi": None,
                                "vegetation_condition": "Obscured",
                                "vegetation_trend": "Insufficient Cloud-Free Data",
                                "cloud_cover_pct": round(newest_cloud, 1),
                                "cloud_status": "CLOUDY",
                                "status": "CLOUDY",
                                "processing_status": "UNAVAILABLE",
                                "is_older_observation": False,
                                "provenance_details": f"Source: Copernicus {platform} | Dataset: Sentinel-2 L2A | Scene ID: {scene_id} | High cloud cover ({round(newest_cloud, 1)}%) prevents optical observation.",
                                "retrieved_at": datetime.utcnow().isoformat(),
                                "reason": "Recent usable optical observation unavailable because of cloud cover.",
                                "thumbnail_url": thumb_url
                            }

                    # We have a usable scene (either newest or clear older scene)
                    props = selected_scene.get("properties", {})
                    cloud_cover = props.get("eo:cloud_cover", 0.0)
                    obs_time_str = props.get("datetime")
                    scene_id = selected_scene.get("id", "Sentinel-2 Scene")
                    platform = props.get("platform", "Sentinel-2")
                    assets = selected_scene.get("assets", {})
                    thumb_url = assets.get("thumbnail", {}).get("href") or assets.get("overview", {}).get("href")
                    
                    cloud_status = "CLEAR" if cloud_cover < 20.0 else "PARTLY_CLOUDY" if cloud_cover <= 75.0 else "CLOUDY"
                    
                    # Band Availability & NDVI Rule (Rule 6):
                    # Sentinel-2 B04 (Red) and B08 (NIR) are stored as 216 MB Cloud-Optimized GeoTIFFs on AWS S3.
                    # Without dedicated GDAL C-extension raster processing running on the server,
                    # full band rasters cannot be safely downloaded over HTTP in real time (~432 MB per request).
                    # Under strict Phase 3 rules, we DO NOT invent/estimate NDVI from unrelated data.
                    # We report NDVI = UNAVAILABLE, and explain: "Required satellite bands could not be retrieved."
                    
                    older_note = f" (Older cloud-free observation from {obs_time_str[:10]} used because latest pass was cloudy)" if is_older else ""
                    
                    return {
                        "provider": f"Copernicus {platform}",
                        "dataset": "Sentinel-2 L2A",
                        "scene_id": scene_id,
                        "observation_date": obs_time_str,
                        "ndvi": None, # Strict Rule: NEVER fabricate NDVI without raw band calculation
                        "ndwi": None,
                        "vegetation_condition": f"Scene Identified ({cloud_status}){older_note}",
                        "vegetation_trend": "Optical bands unretrieved (Raster processing service required)",
                        "cloud_cover_pct": round(cloud_cover, 1),
                        "cloud_status": cloud_status,
                        "status": "AVAILABLE",
                        "processing_status": "BANDS_UNRETRIEVED",
                        "is_older_observation": is_older,
                        "provenance_details": (
                            f"Source: Copernicus {platform} | Dataset: Sentinel-2 L2A | Scene ID: {scene_id} | "
                            f"Observed: {obs_time_str} | Cloud Cover: {round(cloud_cover, 1)}% | 10m Resolution"
                            f"{older_note}"
                        ),
                        "retrieved_at": datetime.utcnow().isoformat(),
                        "reason": "Required satellite bands could not be retrieved.",
                        "thumbnail_url": thumb_url
                    }
                else:
                    logger.warning(f"STAC API returned status {response.status_code}")
                    return self._no_observation_response(f"Public STAC registry returned status {response.status_code}")
        except Exception as e:
            logger.error(f"Satellite data retrieval error: {str(e)}")
            return self._no_observation_response("Public satellite archive connection unavailable or timed out.")

    def _no_observation_response(self, reason: str) -> Dict[str, Any]:
        """Display clear message and NEVER invent NDVI."""
        return {
            "provider": "Copernicus Sentinel-2",
            "dataset": "Sentinel-2 L2A",
            "scene_id": None,
            "observation_date": None,
            "ndvi": None,
            "ndwi": None,
            "vegetation_condition": None,
            "vegetation_trend": "No recent satellite observation available.",
            "cloud_cover_pct": None,
            "cloud_status": "UNAVAILABLE",
            "status": "UNAVAILABLE",
            "processing_status": "UNAVAILABLE",
            "is_older_observation": False,
            "provenance_details": "Copernicus Open Access Hub / STAC Public Registry",
            "retrieved_at": datetime.utcnow().isoformat(),
            "reason": reason,
            "thumbnail_url": None
        }


class EarthEngineProvider(SatelliteProvider):
    """
    Optional Earth Engine Provider.
    Only instantiated if explicitly configured without paid requirements.
    """
    
    def __init__(self):
        self.is_enabled = settings.ENABLE_EARTH_ENGINE

    async def get_vegetation_metrics(self, latitude: float, longitude: float) -> Dict[str, Any]:
        if not self.is_enabled:
            return {
                "provider": "Google Earth Engine (Optional)",
                "dataset": "Sentinel-2",
                "scene_id": None,
                "observation_date": None,
                "ndvi": None,
                "ndwi": None,
                "vegetation_condition": None,
                "vegetation_trend": None,
                "cloud_cover_pct": None,
                "cloud_status": "UNAVAILABLE",
                "status": "UNAVAILABLE",
                "processing_status": "UNAVAILABLE",
                "is_older_observation": False,
                "provenance_details": "Google Earth Engine",
                "retrieved_at": datetime.utcnow().isoformat(),
                "reason": "Earth Engine provider not enabled in zero-cost mode.",
                "thumbnail_url": None
            }
        return {
            "provider": "Google Earth Engine",
            "dataset": "Sentinel-2",
            "scene_id": None,
            "observation_date": None,
            "ndvi": None,
            "ndwi": None,
            "vegetation_condition": None,
            "vegetation_trend": None,
            "cloud_cover_pct": None,
            "cloud_status": "UNAVAILABLE",
            "status": "UNAVAILABLE",
            "processing_status": "UNAVAILABLE",
            "is_older_observation": False,
            "provenance_details": "Google Earth Engine",
            "retrieved_at": datetime.utcnow().isoformat(),
            "reason": "EE credentials not configured.",
            "thumbnail_url": None
        }


class SatelliteService:
    """Unified satellite service orchestrator."""
    
    def __init__(self):
        self.public_provider = PublicDatasetProvider()
        self.ee_provider = EarthEngineProvider()

    async def get_metrics(self, latitude: float, longitude: float) -> Dict[str, Any]:
        if settings.ENABLE_EARTH_ENGINE:
            res = await self.ee_provider.get_vegetation_metrics(latitude, longitude)
            if res.get("status") == "AVAILABLE":
                return res
        return await self.public_provider.get_vegetation_metrics(latitude, longitude)


satellite_service = SatelliteService()
