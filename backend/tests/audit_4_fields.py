import httpx
import json

base_url = "http://127.0.0.1:8000/api"

fields = [
    (1, "Thanjavur, Tamil Nadu", "Rice (Paddy)"),
    (2, "Ludhiana, Punjab", "Wheat"),
    (3, "Nashik, Maharashtra", "Cotton"),
    (4, "Mandya, Karnataka", "Millet (Pearl/Finger)")
]

def audit():
    with httpx.Client(timeout=25.0) as client:
        for fid, name, crop in fields:
            print("=" * 70)
            print(f"FIELD #{fid}: {name} ({crop})")
            print("=" * 70)
            
            # 1. Weather
            w_res = client.get(f"{base_url}/fields/{fid}/weather")
            w = w_res.json()
            print("WEATHER:")
            print(f"  Source: {w.get('source')}")
            print(f"  Status: {w.get('status')}, Cache Status: {w.get('cache_status')}")
            print(f"  Temperature: {w.get('temperature_c')}°C (Apparent: {w.get('apparent_temp_c')}°C)")
            print(f"  Humidity: {w.get('humidity_pct')}%, Wind: {w.get('wind_speed_kmh')} km/h")
            print(f"  Precipitation: {w.get('precipitation_mm')} mm (Prob: {w.get('precipitation_probability_pct')}%)")
            print(f"  Weather Condition: {w.get('weather_desc')}")
            
            # 2. Satellite
            s_res = client.get(f"{base_url}/fields/{fid}/satellite")
            s = s_res.json()
            print("\nSATELLITE:")
            print(f"  Provider: {s.get('provider')}, Dataset: {s.get('dataset')}")
            print(f"  Status: {s.get('status')}, Cloud Status: {s.get('cloud_status')}")
            print(f"  Observed Date: {s.get('observation_date')}")
            print(f"  Scene ID: {s.get('scene_id')}")
            print(f"  Cloud Cover: {s.get('cloud_cover_pct')}%")
            print(f"  Is Older Observation: {s.get('is_older_observation')}")
            print(f"  NDVI: {s.get('ndvi')} (Processing Status: {s.get('processing_status')})")
            print(f"  Reason: {s.get('reason')}")
            print(f"  Provenance: {s.get('provenance_details')}")
            
            # 3. Soil
            soil_res = client.get(f"{base_url}/fields/{fid}/soil")
            soil = soil_res.json()
            print("\nSOIL:")
            print(f"  Source Type: {soil.get('source_type')}")
            print(f"  Source Name: {soil.get('source_name')}")
            print(f"  pH: {soil.get('ph')}, OC: {soil.get('organic_carbon_pct')}%, Texture: {soil.get('texture')}")
            
            # 4. Full Analysis & Data Quality
            a_res = client.post(f"{base_url}/fields/{fid}/analyze")
            intel = a_res.json()
            print("\nDATA QUALITY:")
            print(f"  Quality Rating: {intel.get('data_quality')}")
            print(f"  Quality Reasons: {intel.get('data_quality_reasons')}")
            
            # 5. Risks
            print("\nRISKS (Deterministic Engine):")
            for r in intel.get("risks", []):
                print(f"  - [{r.get('level')}] {r.get('category')}: {r.get('what_risk')}")
                print(f"      Evidence: {r.get('why_evidence')}")
                print(f"      Data Used: {r.get('data_used')} (Date: {r.get('data_date')})")
                print(f"      Limitation: {r.get('limitations')}")
                
            # 6. Advisories
            print("\nADVISORIES (Actionable Signals):")
            for adv in intel.get("advisories", []):
                print(f"  - [{adv.get('priority')}] {adv.get('category')}: {adv.get('title')}")
                print(f"      Recommendation: {adv.get('recommendation')}")
                print(f"      Factors: {adv.get('factors_used')}")
                print(f"      Limitations: {adv.get('limitations')}")
            print("\n")

if __name__ == "__main__":
    audit()
