import pytest
from app.engines.risk_engine import RiskEngine
from app.engines.crop_engine import CropEngine
from app.engines.advisory_engine import AdvisoryEngine

def test_risk_engine_deterministic_heat():
    # Test heat stress above threshold
    weather_hot = {
        "temperature_c": 41.5,
        "retrieved_at": "2026-09-24T12:00:00Z"
    }
    risks = RiskEngine.evaluate(
        field_name="Demo Field",
        crop_type="Rice (Paddy)",
        weather=weather_hot,
        satellite={"status": "UNAVAILABLE"}
    )
    
    heat_risk = next(r for r in risks if r["category"] == "HEAT_STRESS")
    assert heat_risk["level"] == "HIGH"
    assert "41.5°C" in heat_risk["why_evidence"]

def test_risk_engine_unavailable_fallback():
    # Test unavailable weather gives CANNOT_DETERMINE, never a fake score
    weather_empty = {
        "temperature_c": None,
        "daily_forecast": []
    }
    risks = RiskEngine.evaluate(
        field_name="Demo Field",
        crop_type="Wheat",
        weather=weather_empty,
        satellite={"status": "UNAVAILABLE", "reason": "Cloud cover"}
    )
    
    heat_risk = next(r for r in risks if r["category"] == "HEAT_STRESS")
    assert heat_risk["level"] == "CANNOT_DETERMINE"

    drought_risk = next(r for r in risks if r["category"] == "DROUGHT_WATER_STRESS")
    assert drought_risk["level"] == "CANNOT_DETERMINE"

def test_crop_engine_suitability():
    weather = {"temperature_c": 28.0}
    soil = {"ph": 6.5, "texture": "Clay Loam", "source_type": "MEASURED"}
    
    res = CropEngine.evaluate_suitability("Rice (Paddy)", "Tamil Nadu", weather, soil)
    assert res["suitability"] == "HIGH"
    assert "Rice (Paddy)" in res["rationale"]

def test_advisory_engine_rain_delay():
    # When heavy rain is predicted, irrigation must be postponed
    weather_rainy = {
        "precipitation_probability_pct": 85,
        "precipitation_mm": 25.0,
        "wind_speed_kmh": 10.0,
        "daily_forecast": [{"precipitation_sum": 30.0, "precipitation_probability_max": 90}]
    }
    advisories = AdvisoryEngine.generate_advisories(
        crop_type="Cotton",
        weather=weather_rainy,
        satellite={"status": "UNAVAILABLE"}
    )
    
    irr_adv = next(a for a in advisories if a["category"] == "IRRIGATION")
    assert irr_adv["priority"] == "HIGH"
    assert "Postpone" in irr_adv["title"]
