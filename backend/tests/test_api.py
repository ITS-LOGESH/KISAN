import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.database_service import init_db

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_health_check():
    with TestClient(app) as client:
        response = client.get("/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "HEALTHY"
        assert "Open-Meteo" in data["weather_provider"]
        assert "Sentinel-2" in data["satellite_provider"]

def test_get_fields():
    with TestClient(app) as client:
        response = client.get("/api/fields")
        assert response.status_code == 200
        fields = response.json()
        assert len(fields) >= 4
        demo_fields = [f for f in fields if f["is_demo"]]
        assert len(demo_fields) >= 4

def test_get_field_by_id():
    with TestClient(app) as client:
        response = client.get("/api/fields/1")
        assert response.status_code == 200
        field = response.json()
        assert field["id"] == 1
        assert "Tamil Nadu" in field["state"]

def test_get_field_weather():
    with TestClient(app) as client:
        response = client.get("/api/fields/1/weather")
        assert response.status_code == 200
        weather = response.json()
        assert "source" in weather
        assert weather["status"] in ("LIVE", "CACHED", "UNAVAILABLE")
        assert "cache_status" in weather

def test_get_field_satellite():
    with TestClient(app) as client:
        response = client.get("/api/fields/1/satellite")
        assert response.status_code == 200
        sat = response.json()
        assert "provider" in sat
        assert sat["status"] in ("AVAILABLE", "CLOUDY", "UNAVAILABLE")
        # In zero-cost mode without GDAL raster pipeline, NDVI must be None or uncalculated
        if sat["status"] == "AVAILABLE":
            assert "Sentinel-2" in sat["dataset"]
            assert sat["reason"] == "Required satellite bands could not be retrieved."

def test_get_field_soil_provenance():
    with TestClient(app) as client:
        response = client.get("/api/fields/1/soil")
        assert response.status_code == 200
        soil = response.json()
        assert soil["source_type"] in ("MEASURED", "USER_PROVIDED", "MODELLED", "UNAVAILABLE")

def test_record_user_soil_test():
    with TestClient(app) as client:
        payload = {
            "source_type": "USER_PROVIDED",
            "source_name": "Farmer Soil Health Card (KVK Test)",
            "ph": 6.8,
            "nitrogen_kg_ha": 240.0,
            "phosphorus_kg_ha": 22.5,
            "potassium_kg_ha": 180.0,
            "organic_carbon_pct": 0.65,
            "texture": "Clay Loam"
        }
        post_res = client.post("/api/fields/1/soil", json=payload)
        assert post_res.status_code == 201
        saved = post_res.json()
        assert saved["ph"] == 6.8
        assert saved["source_type"] == "USER_PROVIDED"
        
        # Verify persistence
        get_res = client.get("/api/fields/1/soil")
        assert get_res.status_code == 200
        assert get_res.json()["ph"] == 6.8

def test_field_risks():
    with TestClient(app) as client:
        response = client.get("/api/fields/1/risks")
        assert response.status_code == 200
        risks = response.json()
        assert len(risks) == 5
        categories = [r["category"] for r in risks]
        assert "HEAT_STRESS" in categories
        assert "HEAVY_RAINFALL" in categories
        assert "DROUGHT_WATER_STRESS" in categories
        assert "IRRIGATION_RISK" in categories
        assert "VEGETATION_DECLINE" in categories
        for r in risks:
            assert "what_risk" in r
            assert "why_evidence" in r
            assert "data_used" in r
            assert "limitations" in r

def test_field_advisories():
    with TestClient(app) as client:
        response = client.get("/api/fields/1/advisories")
        assert response.status_code == 200
        advisories = response.json()
        assert len(advisories) >= 3
        for a in advisories:
            assert "recommendation" in a
            assert "factors_used" in a
            assert "limitations" in a

def test_field_crops():
    with TestClient(app) as client:
        response = client.get("/api/fields/1/crops")
        assert response.status_code == 200
        crops = response.json()
        assert len(crops) == 6
        crop_names = [c["crop_name"] for c in crops]
        assert "Rice (Paddy)" in crop_names
        assert "Wheat" in crop_names

def test_field_analyze_pipeline():
    with TestClient(app) as client:
        response = client.post("/api/fields/1/analyze")
        assert response.status_code == 200
        intel = response.json()
        assert "field" in intel
        assert "weather" in intel
        assert "satellite" in intel
        assert "soil" in intel
        assert "crops" in intel
        assert "risks" in intel
        assert "advisories" in intel
        assert intel["data_quality"] in ("GOOD", "PARTIAL", "LIMITED", "UNAVAILABLE")
        assert len(intel["data_quality_reasons"]) > 0

def test_metrics():
    with TestClient(app) as client:
        response = client.get("/api/metrics")
        assert response.status_code == 200
        metrics = response.json()
        assert "fields_monitored" in metrics
        assert metrics["data_sources_available"] >= 4

def test_network_states():
    with TestClient(app) as client:
        response = client.get("/api/network/states")
        assert response.status_code == 200
        states = response.json()
        state_names = [s["state_name"] for s in states]
        assert "Tamil Nadu" in state_names
        assert "Punjab" in state_names
        assert "Maharashtra" in state_names
        assert "Karnataka" in state_names

def test_user_profile_endpoints():
    with TestClient(app) as client:
        # Get profile
        get_res = client.get("/api/user/profile")
        assert get_res.status_code == 200
        profile = get_res.json()
        assert "name" in profile
        assert "preferred_language" in profile
        assert "tamil_dialect" in profile

        # Update profile
        update_res = client.post("/api/user/profile", json={
            "name": "Murugan",
            "phone": "9876543210",
            "state": "Tamil Nadu",
            "preferred_language": "ta",
            "tamil_dialect": "natural"
        })
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["name"] == "Murugan"
        assert updated["preferred_language"] == "ta"
        assert updated["tamil_dialect"] == "natural"

def test_create_field_with_farmer_attributes():
    with TestClient(app) as client:
        new_field = {
            "name": "Thanjavur Delta Field 1",
            "state": "Tamil Nadu",
            "district": "Thanjavur",
            "latitude": 10.7870,
            "longitude": 79.1378,
            "crop_type": "Rice (Paddy)",
            "variety": "CR-1009 Sub 1",
            "irrigation_method": "Canal",
            "soil_report_status": "NOT_UPLOADED",
            "area_acres": 2.45,
            "is_demo": False,
            "boundary_geojson": '{"type":"Polygon","coordinates":[[[79.13,10.78],[79.14,10.78],[79.14,10.79],[79.13,10.78]]]}'
        }
        res = client.post("/api/fields", json=new_field)
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "Thanjavur Delta Field 1"
        assert data["variety"] == "CR-1009 Sub 1"
        assert data["irrigation_method"] == "Canal"
        assert data["soil_report_status"] == "NOT_UPLOADED"
        assert data["area_acres"] == 2.45

        # Cleanup test field
        del_res = client.delete(f"/api/fields/{data['id']}")
        assert del_res.status_code == 204

def test_farmer_fields_quota_limit():
    """Verify that a farmer can register up to 4 real fields, and the 5th is rejected."""
    with TestClient(app) as client:
        created_ids = []
        try:
            # Clean any existing non-demo test fields in test database
            existing_fields = client.get("/api/fields?include_demo=false").json()
            for f in existing_fields:
                client.delete(f"/api/fields/{f['id']}")

            # Step 1: 0 -> 1 allowed
            res1 = client.post("/api/fields", json={
                "name": "Test Field 1", "state": "Tamil Nadu", "district": "Thanjavur",
                "latitude": 10.78, "longitude": 79.13, "crop_type": "Rice (Paddy)", "is_demo": False
            })
            assert res1.status_code == 201
            created_ids.append(res1.json()["id"])

            # Step 2: 1 -> 2 allowed
            res2 = client.post("/api/fields", json={
                "name": "Test Field 2", "state": "Tamil Nadu", "district": "Thanjavur",
                "latitude": 10.79, "longitude": 79.14, "crop_type": "Cotton", "is_demo": False
            })
            assert res2.status_code == 201
            created_ids.append(res2.json()["id"])

            # Step 3: 2 -> 3 allowed
            res3 = client.post("/api/fields", json={
                "name": "Test Field 3", "state": "Tamil Nadu", "district": "Thanjavur",
                "latitude": 10.80, "longitude": 79.15, "crop_type": "Groundnut", "is_demo": False
            })
            assert res3.status_code == 201
            created_ids.append(res3.json()["id"])

            # Step 4: 3 -> 4 allowed
            res4 = client.post("/api/fields", json={
                "name": "Test Field 4", "state": "Tamil Nadu", "district": "Thanjavur",
                "latitude": 10.81, "longitude": 79.16, "crop_type": "Wheat", "is_demo": False
            })
            assert res4.status_code == 201
            created_ids.append(res4.json()["id"])

            # Verify currently 4 farmer fields
            current = client.get("/api/fields?include_demo=false").json()
            assert len(current) == 4

            # Step 5: 4 -> 5 rejected with HTTP 400
            res5 = client.post("/api/fields", json={
                "name": "Test Field 5 (Exceeds Quota)", "state": "Tamil Nadu", "district": "Thanjavur",
                "latitude": 10.82, "longitude": 79.17, "crop_type": "Sugarcane", "is_demo": False
            })
            assert res5.status_code == 400
            assert "Maximum limit of 4 registered fields reached" in res5.json()["detail"]

        finally:
            for fid in created_ids:
                client.delete(f"/api/fields/{fid}")


