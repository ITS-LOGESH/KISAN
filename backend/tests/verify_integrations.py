import asyncio
import httpx
import json
from datetime import datetime, timedelta

fields = [
    ("Thanjavur, Tamil Nadu", 10.7870, 79.1378),
    ("Ludhiana, Punjab", 30.9010, 75.8573),
    ("Nashik, Maharashtra", 19.9975, 73.7898),
    ("Mandya, Karnataka", 12.5218, 76.8951)
]

async def verify_weather():
    print("=" * 60)
    print("VERIFYING OPEN-METEO WEATHER FOR 4 DEMO FIELDS")
    print("=" * 60)
    async with httpx.AsyncClient(timeout=10.0) as client:
        for name, lat, lon in fields:
            url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&hourly=temperature_2m,precipitation_probability,precipitation&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=7"
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    d = resp.json()
                    curr = d.get("current", {})
                    print(f"[{name}] SUCCESS")
                    print(f"  Coordinates: ({lat}, {lon})")
                    print(f"  Time: {curr.get('time')}")
                    print(f"  Temp: {curr.get('temperature_2m')}°C, Humidity: {curr.get('relative_humidity_2m')}%")
                    print(f"  Precipitation: {curr.get('precipitation')} mm, Wind: {curr.get('wind_speed_10m')} km/h")
                    hourly = d.get("hourly", {})
                    print(f"  Hourly count: {len(hourly.get('time', []))}")
                    daily = d.get("daily", {})
                    print(f"  Daily days: {len(daily.get('time', []))}")
                else:
                    print(f"[{name}] HTTP Error: {resp.status_code}")
            except Exception as e:
                print(f"[{name}] Exception: {e}")

async def verify_geocoding():
    print("\n" + "=" * 60)
    print("VERIFYING GEOCODING FOR 4 LOCATIONS")
    print("=" * 60)
    async with httpx.AsyncClient(timeout=10.0) as client:
        for query in ["Thanjavur", "Ludhiana", "Nashik", "Mandya"]:
            url = f"https://geocoding-api.open-meteo.com/v1/search?name={query}&count=3&language=en&format=json"
            try:
                resp = await client.get(url)
                if resp.status_code == 200:
                    res = resp.json().get("results", [])
                    if res:
                        top = res[0]
                        print(f"[{query}] -> Found: {top.get('name')}, {top.get('admin1')}, {top.get('country')} at ({top.get('latitude')}, {top.get('longitude')})")
                    else:
                        print(f"[{query}] -> No results")
                else:
                    print(f"[{query}] -> HTTP Error: {resp.status_code}")
            except Exception as e:
                print(f"[{query}] Exception: {e}")

async def verify_sentinel2_stac():
    print("\n" + "=" * 60)
    print("VERIFYING SENTINEL-2 STAC QUERIES FOR 4 DEMO FIELDS")
    print("=" * 60)
    stac_url = "https://earth-search.aws.element84.com/v1/search"
    end_date = datetime.utcnow()
    # Search last 45 days
    start_date = end_date - timedelta(days=45)
    date_str = f"{start_date.strftime('%Y-%m-%dT00:00:00Z')}/{end_date.strftime('%Y-%m-%dT23:59:59Z')}"
    
    async with httpx.AsyncClient(timeout=15.0) as client:
        for name, lat, lon in fields:
            print(f"\n--- Checking Sentinel-2 STAC for {name} ({lat}, {lon}) ---")
            bbox = [lon - 0.03, lat - 0.03, lon + 0.03, lat + 0.03]
            payload = {
                "collections": ["sentinel-2-l2a"],
                "bbox": bbox,
                "datetime": date_str,
                "limit": 5,
                "sortby": [{"field": "properties.datetime", "direction": "desc"}]
            }
            try:
                resp = await client.post(stac_url, json=payload)
                print(f"STAC Response HTTP Status: {resp.status_code}")
                if resp.status_code == 200:
                    data = resp.json()
                    features = data.get("features", [])
                    print(f"Total Sentinel-2 scenes found: {len(features)}")
                    for idx, f in enumerate(features[:3]):
                        props = f.get("properties", {})
                        scene_id = f.get("id")
                        obs_dt = props.get("datetime")
                        cloud = props.get("eo:cloud_cover")
                        platform = props.get("platform")
                        assets = f.get("assets", {})
                        print(f"  Scene #{idx+1}: {scene_id}")
                        print(f"    Platform: {platform}, Observed: {obs_dt}, Cloud Cover: {cloud}%")
                        print(f"    Asset count: {len(assets)}, Assets keys: {list(assets.keys())[:8]}")
                        
                        # Inspect red and nir asset hrefs
                        red = assets.get("red") or assets.get("B04")
                        nir = assets.get("nir") or assets.get("B08") or assets.get("nir08")
                        if red and nir:
                            print(f"    Red (B04) href: {red.get('href')}")
                            print(f"    NIR (B08) href: {nir.get('href')}")
                            print(f"    Red asset type: {red.get('type')}")
                            
                            # Test if asset URL is accessible or requires auth/requester pays
                            test_url = red.get("href")
                            if test_url and test_url.startswith("http"):
                                try:
                                    # HEAD or Range request
                                    r_test = await client.head(test_url)
                                    print(f"    Red asset HEAD status: {r_test.status_code}")
                                except Exception as err:
                                    print(f"    Red asset test error: {err}")
                else:
                    print(f"STAC Error: {resp.text[:300]}")
            except Exception as e:
                print(f"STAC Exception: {e}")

async def main():
    await verify_weather()
    await verify_geocoding()
    await verify_sentinel2_stac()

if __name__ == "__main__":
    asyncio.run(main())
