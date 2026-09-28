import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_url(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print(f"{url} -> status: {resp.status}, count: {len(data)}")
        for item in data:
            print(f"  ID {item['id']}: {item['name']} | Crop: {item.get('crop_type')} | Variety: {item.get('variety')} | Area: {item.get('area_acres')} ac | Demo: {item.get('is_demo')}")

print("=== 1. Default GET /api/fields ===")
test_url("http://127.0.0.1:8000/api/fields")
print("\n=== 2. GET /api/fields?include_demo=true ===")
test_url("http://127.0.0.1:8000/api/fields?include_demo=true")
print("\n=== 3. GET /api/fields?include_demo=false ===")
test_url("http://127.0.0.1:8000/api/fields?include_demo=false")
