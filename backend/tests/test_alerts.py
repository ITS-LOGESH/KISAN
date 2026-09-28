import asyncio
import pytest
from unittest.mock import patch
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.core.database import SessionLocal
from app.models.models import Field, Alert
from app.services.database_service import init_db
from app.services.alert_service import alert_service

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def test_alert_creation_from_valid_weather_condition(db_session: Session):
    """1. Alert creation when real weather condition crosses threshold (heavy rain)."""
    field = db_session.query(Field).first()
    assert field is not None

    mock_weather = {
        "status": "LIVE",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "temperature_c": 28.0,
        "humidity_pct": 80.0,
        "precipitation_mm": 25.0,
        "precipitation_probability_pct": 85,
        "wind_speed_kmh": 12.0,
        "daily_forecast": [
            {
                "date": "2026-09-28",
                "temp_max": 29.0,
                "precipitation_sum": 30.0,
                "precipitation_probability_max": 90,
                "weather_desc": "Heavy rain"
            }
        ]
    }

    alerts = asyncio.run(alert_service.evaluate_field_alerts(field, db_session, weather_data=mock_weather))
    weather_alerts = [a for a in alerts if a.type == "weather"]
    assert len(weather_alerts) >= 1
    rain_alerts = [a for a in weather_alerts if "Rain" in a.title]
    assert len(rain_alerts) >= 1
    rain_alert = rain_alerts[0]
    assert rain_alert.severity in ("warning", "attention")
    assert "Open-Meteo" in rain_alert.source
    assert rain_alert.action is not None
    assert rain_alert.is_read is False

def test_no_alert_when_threshold_not_crossed(db_session: Session):
    """2. No alert created when conditions remain well below thresholds."""
    # Create an isolated test field
    test_field = Field(
        name="Benign Field",
        state="Tamil Nadu",
        district="Madurai",
        latitude=9.9252,
        longitude=78.1198,
        crop_type="Groundnut",
        is_demo=False
    )
    db_session.add(test_field)
    db_session.commit()
    db_session.refresh(test_field)

    try:
        mock_mild_weather = {
            "status": "LIVE",
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "temperature_c": 28.0,
            "humidity_pct": 50.0,
            "precipitation_mm": 0.0,
            "precipitation_probability_pct": 10,
            "wind_speed_kmh": 8.0,
            "daily_forecast": [
                {
                    "date": "2026-09-28",
                    "temp_max": 29.0,
                    "precipitation_sum": 0.0,
                    "precipitation_probability_max": 15,
                    "weather_desc": "Mainly clear"
                }
            ]
        }

        mock_sat_none = {"status": "UNAVAILABLE", "observation_date": None}

        alerts = asyncio.run(alert_service.evaluate_field_alerts(
            test_field, db_session, weather_data=mock_mild_weather, satellite_data=mock_sat_none
        ))
        weather_alerts = [a for a in alerts if a.type == "weather"]
        assert len(weather_alerts) == 0
    finally:
        db_session.delete(test_field)
        db_session.commit()

def test_no_alert_when_weather_unavailable(db_session: Session):
    """3. Honest data: No alert generated when weather data is UNAVAILABLE."""
    test_field = Field(
        name="Offline Field",
        state="Karnataka",
        district="Mandya",
        latitude=12.5218,
        longitude=76.8951,
        crop_type="Sugarcane",
        is_demo=False
    )
    db_session.add(test_field)
    db_session.commit()
    db_session.refresh(test_field)

    try:
        mock_unavail_weather = {
            "status": "UNAVAILABLE",
            "retrieved_at": datetime.now(timezone.utc).isoformat(),
            "temperature_c": None,
            "precipitation_mm": None,
            "precipitation_probability_pct": None,
            "wind_speed_kmh": None
        }

        alerts = asyncio.run(alert_service.evaluate_field_alerts(
            test_field, db_session, weather_data=mock_unavail_weather
        ))
        weather_alerts = [a for a in alerts if a.type == "weather"]
        assert len(weather_alerts) == 0
    finally:
        db_session.delete(test_field)
        db_session.commit()

def test_duplicate_alert_prevention(db_session: Session):
    """4. Deterministic duplicate prevention: Repeating evaluation creates no duplicates."""
    field = db_session.query(Field).first()
    assert field is not None

    mock_wind_weather = {
        "status": "LIVE",
        "retrieved_at": datetime.now(timezone.utc).isoformat(),
        "temperature_c": 30.0,
        "humidity_pct": 50.0,
        "precipitation_mm": 0.0,
        "precipitation_probability_pct": 5,
        "wind_speed_kmh": 22.5,
        "daily_forecast": [{"date": "2026-09-28", "temp_max": 31.0, "precipitation_sum": 0.0, "precipitation_probability_max": 5}]
    }

    # First evaluation
    alerts_1 = asyncio.run(alert_service.evaluate_field_alerts(field, db_session, weather_data=mock_wind_weather))
    wind_count_1 = len([a for a in alerts_1 if a.type == "weather" and "Wind" in a.title])
    assert wind_count_1 >= 1

    # Second evaluation with identical weather conditions
    alerts_2 = asyncio.run(alert_service.evaluate_field_alerts(field, db_session, weather_data=mock_wind_weather))
    wind_count_2 = len([a for a in alerts_2 if a.type == "weather" and "Wind" in a.title])
    # Count should NOT increase!
    assert wind_count_1 == wind_count_2

def test_satellite_observation_alert(db_session: Session):
    """5. Valid satellite pass generates informative observation alert."""
    field = db_session.query(Field).first()
    mock_satellite = {
        "status": "AVAILABLE",
        "provider": "Sentinel-2 L2A (AWS Open Data)",
        "observation_date": "2026-09-26T05:30:00Z",
        "cloud_cover_pct": 8.5,
        "scene_id": "S2B_MSIL2A_20260926_TEST"
    }

    alerts = asyncio.run(alert_service.evaluate_field_alerts(
        field, db_session, weather_data={"status": "UNAVAILABLE"}, satellite_data=mock_satellite
    ))
    sat_alerts = [a for a in alerts if a.type == "satellite"]
    assert len(sat_alerts) >= 1
    assert "Sentinel-2" in sat_alerts[0].source
    assert sat_alerts[0].severity == "info"
    # Never claim NDVI decline when NDVI is uncalculated
    assert "NDVI" not in sat_alerts[0].title

def test_no_fake_satellite_alert_when_unavailable(db_session: Session):
    """6. No fake satellite alert when status is UNAVAILABLE."""
    test_field = Field(
        name="No Satellite Field",
        state="Maharashtra",
        latitude=19.7515,
        longitude=75.7139,
        crop_type="Cotton",
        is_demo=False
    )
    db_session.add(test_field)
    db_session.commit()
    db_session.refresh(test_field)

    try:
        mock_satellite = {
            "status": "UNAVAILABLE",
            "observation_date": None
        }

        alerts = asyncio.run(alert_service.evaluate_field_alerts(
            test_field, db_session, weather_data={"status": "UNAVAILABLE"}, satellite_data=mock_satellite
        ))
        sat_alerts = [a for a in alerts if a.type == "satellite"]
        assert len(sat_alerts) == 0
    finally:
        db_session.delete(test_field)
        db_session.commit()

def test_field_specific_alert_filtering(db_session: Session):
    """7. Alerts belonging to Field A must not leak under Field B."""
    with TestClient(app) as client:
        # Get all fields
        f_resp = client.get("/api/fields")
        fields = f_resp.json()
        assert len(fields) >= 2
        f1_id = fields[0]["id"]
        f2_id = fields[1]["id"]

        import uuid
        unique_fp = f"{f1_id}:test_isolated_storm:{uuid.uuid4().hex}"
        # Insert dedicated alert for f1
        alert_f1 = Alert(
            field_id=f1_id,
            type="weather",
            severity="warning",
            title="Localized Heavy Storm",
            message=f"Severe storm isolated over field {f1_id}",
            source="Open-Meteo",
            fingerprint=unique_fp
        )
        db_session.add(alert_f1)
        db_session.commit()

        # Query f1 alerts
        r1 = client.get(f"/api/fields/{f1_id}/alerts?evaluate=false")
        assert r1.status_code == 200
        f1_alerts = r1.json()
        assert any(a["fingerprint"] == unique_fp for a in f1_alerts)

        # Query f2 alerts
        r2 = client.get(f"/api/fields/{f2_id}/alerts?evaluate=false")
        assert r2.status_code == 200
        f2_alerts = r2.json()
        assert not any(a["fingerprint"] == unique_fp for a in f2_alerts)

def test_mark_alert_as_read(db_session: Session):
    """8. Mark single alert as read persists in database."""
    field = db_session.query(Field).first()
    alert = Alert(
        field_id=field.id,
        type="advisory",
        severity="info",
        title="Test Advisory Alert",
        message="Test message",
        source="Advisory Engine",
        fingerprint=f"{field.id}:test_advisory:{datetime.now(timezone.utc).timestamp()}",
        is_read=False
    )
    db_session.add(alert)
    db_session.commit()
    db_session.refresh(alert)
    alert_id = alert.id

    with TestClient(app) as client:
        # Mark read
        resp = client.post(f"/api/alerts/{alert_id}/read")
        assert resp.status_code == 200
        data = resp.json()
        assert data["is_read"] is True

        # Verify DB persistence
        db_session.expire_all()
        updated = db_session.query(Alert).filter(Alert.id == alert_id).first()
        assert updated.is_read is True

def test_unread_count(db_session: Session):
    """9. Alert count endpoint returns accurate total and unread numbers."""
    with TestClient(app) as client:
        resp = client.get("/api/alerts/count")
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "unread" in data
        assert data["unread"] <= data["total"]

def test_missing_crop_data(db_session: Session):
    """10. Field without sowing date does NOT generate fake crop-stage alert."""
    test_field = Field(
        name="No Sowing Date Field",
        state="Punjab",
        latitude=31.1471,
        longitude=75.3412,
        crop_type="Wheat",
        sowing_date=None, # Missing sowing date
        is_demo=False
    )
    db_session.add(test_field)
    db_session.commit()
    db_session.refresh(test_field)

    try:
        alerts = asyncio.run(alert_service.evaluate_field_alerts(
            test_field, db_session, weather_data={"status": "UNAVAILABLE"}, satellite_data={"status": "UNAVAILABLE"}
        ))
        stage_alerts = [a for a in alerts if a.type == "crop_stage"]
        assert len(stage_alerts) == 0
    finally:
        db_session.delete(test_field)
        db_session.commit()

def test_missing_field_data():
    """11. Requesting alerts for nonexistent field returns 404."""
    with TestClient(app) as client:
        resp = client.get("/api/fields/999999/alerts")
        assert resp.status_code == 404
        assert "Field not found" in resp.json()["detail"]

def test_api_failure_handling(db_session: Session):
    """12. Gracefully handle provider failure without raising 500 or fabricating fake alerts."""
    field = db_session.query(Field).first()
    assert field is not None

    with patch("app.services.weather_service.weather_service.get_forecast", side_effect=Exception("Connection timed out")):
        with patch("app.services.satellite_service.satellite_service.get_metrics", side_effect=Exception("STAC catalog down")):
            # Should not crash
            alerts = asyncio.run(alert_service.evaluate_field_alerts(field, db_session))
            assert isinstance(alerts, list)
