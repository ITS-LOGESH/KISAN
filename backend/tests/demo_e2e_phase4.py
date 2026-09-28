import httpx
import json

def run_demo():
    client = httpx.Client(base_url="http://127.0.0.1:8000/api", timeout=25.0)

    print("=" * 70)
    print("STEP 1: SYSTEM HEALTH CHECK")
    print("=" * 70)
    health = client.get("/health").json()
    print(f"Service: {health.get('service')} (Status: {health.get('status')})")
    print(f"Weather Provider: {health.get('weather_provider')}")
    print(f"Satellite Provider: {health.get('satellite_provider')}")
    print(f"Gemini Status: {health.get('gemini_status')}")

    print("\n" + "=" * 70)
    print("STEPS 2-6: THANJAVUR FIELD REAL-DATA CONTEXT")
    print("=" * 70)
    field = client.get("/fields/1").json()
    print(f"Field: {field['name']} | Crop: {field['crop_type']} | State: {field['state']}")
    print(f"Coordinates: ({field['latitude']}, {field['longitude']})")

    weather = client.get("/fields/1/weather").json()
    print(f"Weather (Open-Meteo): {weather['temperature_c']}°C, Humidity: {weather['humidity_pct']}%, Wind: {weather['wind_speed_kmh']} km/h")
    print(f"Precipitation: {weather['precipitation_mm']} mm (Rain Prob: {weather['precipitation_probability_pct']}%), Status: {weather['status']} (Cache: {weather['cache_status']})")

    sat = client.get("/fields/1/satellite").json()
    print(f"Satellite: {sat['provider']} | Dataset: {sat['dataset']} | Scene ID: {sat['scene_id']}")
    print(f"Observed Date: {sat['observation_date']} | Cloud Cover: {sat['cloud_cover_pct']}% | Status: {sat['status']}")
    print(f"NDVI: {sat['ndvi']} | Reason: {sat['reason']}")

    soil = client.get("/fields/1/soil").json()
    print(f"Soil Provenance: {soil['source_type']} | Source: {soil['source_name']}")
    print(f"Lab Name: {soil['laboratory_name']} | pH: {soil['ph']} | OC: {soil['organic_carbon_pct']}% | Texture: {soil['texture']}")

    print("\n" + "=" * 70)
    print("STEPS 7-8: FULL DATA FUSION & DETERMINISTIC RISK/ADVISORY ENGINES")
    print("=" * 70)
    intel = client.post("/fields/1/analyze").json()
    print(f"Data Quality: {intel['data_quality']}")
    print(f"Quality Reasons: {intel['data_quality_reasons']}")
    print(f"Risks ({len(intel['risks'])}):")
    for r in intel["risks"]:
        print(f"  - [{r['level']}] {r['category']}: {r['what_risk']}")
    print(f"Advisories ({len(intel['advisories'])}):")
    for a in intel["advisories"]:
        print(f"  - [{a['priority']}] {a['category']}: {a['title']}")

    print("\n" + "=" * 70)
    print("STEPS 9-14: ASK MY FIELD ('Should I irrigate today?')")
    print("=" * 70)
    q = "Should I irrigate today?"
    ask_res = client.post("/assistant", json={"field_id": 1, "question": q}).json()
    print(f"Question: \"{q}\"")
    print(f"Execution Mode: {ask_res['mode']} | AI Status: {ask_res['ai_status']}")
    print(f"\n[ANSWER]\n{ask_res['answer']}")
    print(f"\n[WHY (Evidence & Rationale)]\n{ask_res['why']}")
    print(f"\n[DATA USED]\n{ask_res['data_used']}")
    print(f"\n[WHAT YOU SHOULD DO]\n{ask_res['recommended_action']}")
    print(f"\n[LIMITATIONS]\n{ask_res['limitations']}")
    print(f"\n[DISCLAIMER]\n{ask_res['disclaimer']}")
    print(f"\n[AI TRANSPARENCY PANEL]:")
    for item in ask_res.get("transparency_summary", []):
        safe_item = item.encode("ascii", errors="replace").decode()
        print(f"  {safe_item}")

    print("\n" + "=" * 70)
    print("STEPS 15-18: DISEASE SCREENING (IMAGE VALIDATION & ZERO-COST GUARDRAIL)")
    print("=" * 70)
    # 1. Invalid text file upload
    bad_file = {"file": ("notes.txt", b"plain text report", "text/plain")}
    res_bad = client.post("/disease/analyze", files=bad_file)
    print(f"Invalid format check: HTTP {res_bad.status_code} -> {res_bad.json()['detail']}")

    # 2. Valid image upload with zero-cost AI fallback
    jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xd9"
    good_file = {"file": ("leaf.jpg", jpeg_bytes, "image/jpeg")}
    res_good = client.post("/disease/analyze", files=good_file)
    g = res_good.json()
    print(f"Valid image check: HTTP {res_good.status_code}")
    print(f"  Status: {g['status']}")
    print(f"  Detected Issue: {g['detected_issue']}")
    print(f"  Symptoms: {g['visible_symptoms']}")
    print(f"  Suggested Actions: {g['suggested_actions']}")
    print(f"  Limitations: {g['limitations']}")
    print(f"  Disclaimer: {g['disclaimer']}")

if __name__ == "__main__":
    run_demo()
