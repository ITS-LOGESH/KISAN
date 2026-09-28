import sqlite3
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

con = sqlite3.connect('krishinet.db')
con.row_factory = sqlite3.Row
cur = con.cursor()

cur.execute('SELECT id, name, crop_type, variety, area_acres, is_demo, (boundary_geojson IS NOT NULL) as has_geojson, created_at FROM fields ORDER BY id')
fields = [dict(r) for r in cur.fetchall()]
demo_fields = [f for f in fields if f['is_demo']]
farmer_fields = [f for f in fields if not f['is_demo']]

print("=== REAL DATABASE STATUS (krishinet.db) ===")
print(f"Total fields: {len(fields)}")
print(f"Demo fields count: {len(demo_fields)}")
print(f"Farmer fields count: {len(farmer_fields)}")
print(f"Farmer field IDs: {[f['id'] for f in farmer_fields]}")
print(f"Farmer field names: {[f['name'] for f in farmer_fields]}")
print("\nFarmer field details:")
for f in farmer_fields:
    print(f"  ID {f['id']}: {f['name']} | Crop: {f['crop_type']} ({f.get('variety') or 'N/A'}) | Area: {f['area_acres']} ac | Has GeoJSON: {bool(f['has_geojson'])}")

# Check counts in other tables
print("\nRelated table counts:")
for table in ['soil_records', 'disease_analyses', 'alerts']:
    cur.execute(f"SELECT count(*) FROM {table}")
    total = cur.fetchone()[0]
    cur.execute(f"SELECT count(*) FROM {table} WHERE field_id in (5, 6, 7, 8)")
    farmer_total = cur.fetchone()[0]
    print(f"  {table}: total={total}, for farmer fields (5,6,7,8)={farmer_total}")

con.close()
