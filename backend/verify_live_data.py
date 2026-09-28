import urllib.request
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

print("=== CHECKING REAL FARMER FIELDS VIA LIVE API ===")
for fid in [5, 6, 7, 8]:
    url = f"http://127.0.0.1:8000/api/fields/{fid}"
    f = json.loads(urllib.request.urlopen(url).read().decode('utf-8'))
    print(f"Field {fid}: {f['name']} | Crop: {f['crop_type']} ({f.get('variety') or 'N/A'}) | Area: {f['area_acres']} ac | Has GeoJSON: {bool(f.get('boundary_geojson'))}")

print("\n=== CHECKING DISEASE HISTORY FOR FIELD 7 ===")
d7 = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/disease/fields/7/history').read().decode('utf-8'))
print(f"Field 7 disease records: {len(d7)}")
for r in d7[:2]:
    print(f"  - {r['detected_issue']} ({r['analyzed_at']})")

print("\n=== CHECKING ALERTS ===")
alerts = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/alerts/count').read().decode('utf-8'))
print(f"Total alerts: {alerts['total']}, unread: {alerts['unread']}")

print("\n=== CHECKING USER PROFILE ===")
user = json.loads(urllib.request.urlopen('http://127.0.0.1:8000/api/user/profile').read().decode('utf-8'))
print(f"User: {user['name']} | Language: {user['preferred_language']} | Dialect: {user['tamil_dialect']}")
