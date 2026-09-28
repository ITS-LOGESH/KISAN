import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import (
    Field, SoilRecord, RiskResult, Advisory,
    WeatherSnapshot, SatelliteObservation
)
from app.schemas.schemas import (
    RiskResultResponse, AdvisoryResponse,
    CropSuitabilityResponse, RegenerativeAdvisoryResponse,
    FieldIntelligenceResponse, FieldResponse,
    WeatherDataResponse, SatelliteDataResponse, SoilRecordResponse
)
from app.services.weather_service import weather_service
from app.services.satellite_service import satellite_service
from app.engines.risk_engine import RiskEngine
from app.engines.crop_engine import CropEngine
from app.engines.advisory_engine import AdvisoryEngine

router = APIRouter(tags=["advisory"])

@router.get("/fields/{field_id}/risks", response_model=List[RiskResultResponse])
async def get_field_risks(field_id: int, db: Session = Depends(get_db)):
    """Evaluate or retrieve transparent deterministic agricultural risk factors."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    # Fetch live telemetry
    weather = await weather_service.get_forecast(field.latitude, field.longitude)
    satellite = await satellite_service.get_metrics(field.latitude, field.longitude)
    soil_rec = db.query(SoilRecord).filter(SoilRecord.field_id == field_id).order_by(SoilRecord.id.desc()).first()
    
    soil_dict = None
    if soil_rec:
        soil_dict = {
            "source_type": soil_rec.source_type,
            "source_name": soil_rec.source_name,
            "ph": soil_rec.ph,
            "organic_carbon_pct": soil_rec.organic_carbon_pct,
            "texture": soil_rec.texture
        }

    risks = RiskEngine.evaluate(field.name, field.crop_type, weather, satellite, soil_dict)
    
    return [
        RiskResultResponse(
            field_id=field_id,
            category=r["category"],
            level=r["level"],
            what_risk=r["what_risk"],
            why_evidence=r["why_evidence"],
            data_used=r["data_used"],
            data_date=r["data_date"],
            limitations=r["limitations"]
        )
        for r in risks
    ]

@router.get("/fields/{field_id}/advisories", response_model=List[AdvisoryResponse])
async def get_field_advisories(field_id: int, db: Session = Depends(get_db)):
    """Evaluate or retrieve current actionable agricultural advisories."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    weather = await weather_service.get_forecast(field.latitude, field.longitude)
    satellite = await satellite_service.get_metrics(field.latitude, field.longitude)
    soil_rec = db.query(SoilRecord).filter(SoilRecord.field_id == field_id).order_by(SoilRecord.id.desc()).first()
    
    soil_dict = None
    if soil_rec:
        soil_dict = {
            "source_type": soil_rec.source_type,
            "source_name": soil_rec.source_name,
            "ph": soil_rec.ph,
            "organic_carbon_pct": soil_rec.organic_carbon_pct,
            "texture": soil_rec.texture
        }

    advisories_data = AdvisoryEngine.generate_advisories(field.crop_type, weather, satellite, soil_dict)
    
    res = []
    for idx, a in enumerate(advisories_data):
        res.append(
            AdvisoryResponse(
                id=idx + 1,
                field_id=field_id,
                category=a["category"],
                title=a["title"],
                recommendation=a["recommendation"],
                priority=a["priority"],
                factors_used=a["factors_used"],
                data_sources=a["data_sources"],
                limitations=a["limitations"],
                is_active=True,
                created_at=weather.get("retrieved_at")
            )
        )
    return res

@router.post("/fields/{field_id}/analyze", response_model=FieldIntelligenceResponse)
async def trigger_field_analysis(field_id: int, db: Session = Depends(get_db)):
    """
    Execute full data-fusion agricultural analysis pipeline for a field:
    1. Load field profile
    2. Retrieve live weather (Open-Meteo)
    3. Retrieve satellite observations (Sentinel-2 STAC)
    4. Load field soil record (Soil Health Card provenance)
    5. Evaluate crop suitability
    6. Run deterministic risk engine
    7. Run advisory engine
    8. Store deduplicated database snapshots (15-min throttle)
    9. Return fused FieldIntelligence with transparent data quality
    """
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    # 1. Fetch live telemetry
    weather = await weather_service.get_forecast(field.latitude, field.longitude)
    satellite = await satellite_service.get_metrics(field.latitude, field.longitude)
    soil_rec = db.query(SoilRecord).filter(SoilRecord.field_id == field_id).order_by(SoilRecord.id.desc()).first()
    
    soil_dict = None
    if soil_rec:
        soil_dict = {
            "source_type": soil_rec.source_type,
            "source_name": soil_rec.source_name,
            "ph": soil_rec.ph,
            "nitrogen_kg_ha": soil_rec.nitrogen_kg_ha,
            "phosphorus_kg_ha": soil_rec.phosphorus_kg_ha,
            "potassium_kg_ha": soil_rec.potassium_kg_ha,
            "organic_carbon_pct": soil_rec.organic_carbon_pct,
            "texture": soil_rec.texture
        }

    # 2. Run deterministic engines
    crops_eval = CropEngine.evaluate_all(field.state, weather, soil_dict)
    risks_raw = RiskEngine.evaluate(field.name, field.crop_type, weather, satellite, soil_dict)
    advisories_raw = AdvisoryEngine.generate_advisories(field.crop_type, weather, satellite, soil_dict)

    # 3. Transparent Data Quality Calculation (Section 10)
    weather_ok = weather.get("status") in ("LIVE", "CACHED") and weather.get("temperature_c") is not None
    sat_scene_ok = satellite.get("status") in ("AVAILABLE", "CLOUDY")
    soil_ok = soil_rec is not None and soil_rec.source_type in ("MEASURED", "USER_PROVIDED")

    quality_reasons = []
    if weather_ok:
        quality_reasons.append(f"Weather: {weather.get('status')} from Open-Meteo ({weather.get('temperature_c')}°C, humidity {weather.get('humidity_pct')}%)")
    else:
        quality_reasons.append(f"Weather: UNAVAILABLE ({weather.get('reason', 'feed offline')})")

    if sat_scene_ok:
        obs_dt = satellite.get("observation_date")
        obs_str = obs_dt[:10] if isinstance(obs_dt, str) else "Recent"
        if satellite.get("status") == "CLOUDY":
            quality_reasons.append(f"Satellite: CLOUDY (Cloud cover {satellite.get('cloud_cover_pct')}%, observed {obs_str})")
        else:
            quality_reasons.append(f"Satellite: AVAILABLE scene observed {obs_str} (NDVI: {satellite.get('reason') or 'Unretrieved'})")
    else:
        quality_reasons.append(f"Satellite: UNAVAILABLE ({satellite.get('reason', 'Archive gap')})")

    if soil_ok:
        quality_reasons.append(f"Soil: {soil_rec.source_type} ({soil_rec.source_name or 'Soil Test'})")
    else:
        quality_reasons.append("Soil: UNAVAILABLE (No laboratory Soil Health Card on record)")

    if weather_ok and sat_scene_ok and soil_ok:
        data_quality = "GOOD"
    elif weather_ok and (sat_scene_ok or soil_ok):
        data_quality = "PARTIAL"
    elif weather_ok:
        data_quality = "LIMITED"
    else:
        data_quality = "UNAVAILABLE"

    # 4. Store Database Snapshots without duplicates (Section 17)
    # Check if a weather snapshot exists from the last 15 minutes
    cutoff_15m = datetime.utcnow() - timedelta(minutes=15)
    recent_weather = db.query(WeatherSnapshot).filter(
        WeatherSnapshot.field_id == field_id,
        WeatherSnapshot.retrieved_at >= cutoff_15m
    ).first()

    if not recent_weather and weather.get("temperature_c") is not None:
        db_snap = WeatherSnapshot(
            field_id=field_id,
            source=weather.get("source", "Open-Meteo Public API"),
            retrieved_at=datetime.utcnow(),
            temperature_c=weather.get("temperature_c"),
            apparent_temp_c=weather.get("apparent_temp_c"),
            humidity_pct=weather.get("humidity_pct"),
            precipitation_mm=weather.get("precipitation_mm"),
            precipitation_probability_pct=weather.get("precipitation_probability_pct"),
            wind_speed_kmh=weather.get("wind_speed_kmh"),
            wind_direction_deg=weather.get("wind_direction_deg"),
            weather_code=weather.get("weather_code"),
            weather_desc=weather.get("weather_desc"),
            hourly_forecast_json=json.dumps(weather.get("hourly_forecast", [])),
            daily_forecast_json=json.dumps(weather.get("daily_forecast", []))
        )
        db.add(db_snap)
        db.commit()

    # Check if satellite observation snapshot exists for this scene/date
    if satellite.get("status") in ("AVAILABLE", "CLOUDY"):
        recent_sat = db.query(SatelliteObservation).filter(
            SatelliteObservation.field_id == field_id,
            SatelliteObservation.retrieved_at >= cutoff_15m
        ).first()
        if not recent_sat:
            sat_snap = SatelliteObservation(
                field_id=field_id,
                provider=satellite.get("provider", "Copernicus Sentinel-2"),
                observation_date=datetime.fromisoformat(satellite["observation_date"].replace("Z", "+00:00")) if satellite.get("observation_date") else None,
                ndvi=satellite.get("ndvi"),
                ndwi=satellite.get("ndwi"),
                vegetation_condition=satellite.get("vegetation_condition"),
                vegetation_trend=satellite.get("vegetation_trend"),
                cloud_cover_pct=satellite.get("cloud_cover_pct"),
                status=satellite.get("status"),
                provenance_details=satellite.get("provenance_details"),
                retrieved_at=datetime.utcnow()
            )
            db.add(sat_snap)
            db.commit()

    # Format risk response list
    risks_out = [
        RiskResultResponse(
            field_id=field_id,
            category=r["category"],
            level=r["level"],
            what_risk=r["what_risk"],
            why_evidence=r["why_evidence"],
            data_used=r["data_used"],
            data_date=r["data_date"],
            limitations=r["limitations"]
        )
        for r in risks_raw
    ]

    # Format advisory response list
    advisories_out = [
        AdvisoryResponse(
            id=idx + 1,
            field_id=field_id,
            category=a["category"],
            title=a["title"],
            recommendation=a["recommendation"],
            priority=a["priority"],
            factors_used=a["factors_used"],
            data_sources=a["data_sources"],
            limitations=a["limitations"],
            is_active=True,
            created_at=datetime.utcnow()
        )
        for idx, a in enumerate(advisories_raw)
    ]

    # Soil response fallback if none exists
    if not soil_rec:
        soil_rec = SoilRecord(
            field_id=field_id,
            source_type="UNAVAILABLE",
            notes="No laboratory Soil Health Card on record."
        )

    return FieldIntelligenceResponse(
        field=FieldResponse.model_validate(field),
        weather=WeatherDataResponse(
            source=weather.get("source", "Open-Meteo Public API"),
            retrieved_at=datetime.utcnow(),
            temperature_c=weather.get("temperature_c"),
            apparent_temp_c=weather.get("apparent_temp_c"),
            humidity_pct=weather.get("humidity_pct"),
            precipitation_mm=weather.get("precipitation_mm"),
            precipitation_probability_pct=weather.get("precipitation_probability_pct"),
            wind_speed_kmh=weather.get("wind_speed_kmh"),
            wind_direction_deg=weather.get("wind_direction_deg"),
            weather_code=weather.get("weather_code"),
            weather_desc=weather.get("weather_desc"),
            hourly_forecast=weather.get("hourly_forecast"),
            daily_forecast=weather.get("daily_forecast"),
            status=weather.get("status", "LIVE"),
            cache_status=weather.get("cache_status", "LIVE")
        ),
        satellite=SatelliteDataResponse(
            provider=satellite.get("provider", "Copernicus Sentinel-2"),
            dataset=satellite.get("dataset", "Sentinel-2 L2A"),
            scene_id=satellite.get("scene_id"),
            observation_date=satellite.get("observation_date"),
            ndvi=satellite.get("ndvi"),
            ndwi=satellite.get("ndwi"),
            vegetation_condition=satellite.get("vegetation_condition"),
            vegetation_trend=satellite.get("vegetation_trend"),
            cloud_cover_pct=satellite.get("cloud_cover_pct"),
            cloud_status=satellite.get("cloud_status"),
            status=satellite.get("status", "UNAVAILABLE"),
            processing_status=satellite.get("processing_status"),
            is_older_observation=satellite.get("is_older_observation", False),
            provenance_details=satellite.get("provenance_details"),
            retrieved_at=datetime.utcnow(),
            reason=satellite.get("reason")
        ),
        soil=SoilRecordResponse(
            field_id=field_id,
            source_type=soil_rec.source_type,
            source_name=soil_rec.source_name,
            ph=soil_rec.ph,
            nitrogen_kg_ha=soil_rec.nitrogen_kg_ha,
            phosphorus_kg_ha=soil_rec.phosphorus_kg_ha,
            potassium_kg_ha=soil_rec.potassium_kg_ha,
            organic_carbon_pct=soil_rec.organic_carbon_pct,
            electrical_conductivity=soil_rec.electrical_conductivity,
            texture=soil_rec.texture,
            test_date=soil_rec.test_date,
            laboratory_name=soil_rec.laboratory_name,
            notes=soil_rec.notes
        ),
        crops=[CropSuitabilityResponse(**c) for c in crops_eval],
        risks=risks_out,
        advisories=advisories_out,
        data_quality=data_quality,
        data_quality_reasons=quality_reasons,
        generated_at=datetime.utcnow()
    )

@router.get("/fields/{field_id}/crops", response_model=List[CropSuitabilityResponse])
async def get_crop_suitability(field_id: int, db: Session = Depends(get_db)):
    """Evaluate suitability of standard Indian crops under field's agro-climatic profile."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    weather = await weather_service.get_forecast(field.latitude, field.longitude)
    soil_rec = db.query(SoilRecord).filter(SoilRecord.field_id == field_id).order_by(SoilRecord.id.desc()).first()
    
    soil_dict = None
    if soil_rec:
        soil_dict = {
            "source_type": soil_rec.source_type,
            "source_name": soil_rec.source_name,
            "ph": soil_rec.ph,
            "texture": soil_rec.texture
        }

    return CropEngine.evaluate_all(field.state, weather, soil_dict)

@router.get("/fields/{field_id}/regenerative", response_model=List[RegenerativeAdvisoryResponse])
def get_regenerative_advisories(field_id: int, db: Session = Depends(get_db)):
    """Retrieve regenerative agriculture guidelines separating general advice from field-specific recommendations."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    soil_rec = db.query(SoilRecord).filter(SoilRecord.field_id == field_id).order_by(SoilRecord.id.desc()).first()
    
    soil_dict = None
    if soil_rec:
        soil_dict = {
            "source_type": soil_rec.source_type,
            "source_name": soil_rec.source_name,
            "ph": soil_rec.ph,
            "organic_carbon_pct": soil_rec.organic_carbon_pct,
            "texture": soil_rec.texture
        }

    guidance = AdvisoryEngine.get_regenerative_guidance(field.crop_type, soil_dict)
    return guidance
