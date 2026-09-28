import sqlite3

con = sqlite3.connect('krishinet.db')
cur = con.cursor()

# Check if 7 already exists
cur.execute('SELECT id FROM fields WHERE id = 7')
if not cur.fetchone():
    cur.execute('''
        INSERT INTO fields (
            id, user_id, name, state, district, latitude, longitude,
            crop_type, area_acres, sowing_date, is_demo, demo_label,
            boundary_geojson, created_at, updated_at, variety,
            irrigation_method, soil_report_status, soil_report_url
        ) VALUES (
            7, NULL, 'Main Parcel', 'Tamil Nadu', 'Chengalpattu',
            12.791895451228198, 80.04004682237401, 'Cotton', 1.15,
            '2026-08-28 00:00:00.000000', 0, NULL,
            '{"type":"Polygon","coordinates":[[[80.03991002213867,12.792273717918745],[80.03970880791574,12.791628466995785],[80.04025694034691,12.7914589780994],[80.04043400886309,12.792153864107085],[80.03991002213867,12.792273717918745]]]}',
            '2026-09-27 00:40:44.417698', '2026-09-27 00:40:44.417702',
            'Bt Cotton (Bollgard II)', 'Canal', 'NOT_UPLOADED', NULL
        )
    ''')
    print('Inserted Field 7 (Cotton)')

# Check if 8 already exists
cur.execute('SELECT id FROM fields WHERE id = 8')
if not cur.fetchone():
    cur.execute('''
        INSERT INTO fields (
            id, user_id, name, state, district, latitude, longitude,
            crop_type, area_acres, sowing_date, is_demo, demo_label,
            boundary_geojson, created_at, updated_at, variety,
            irrigation_method, soil_report_status, soil_report_url
        ) VALUES (
            8, NULL, 'Main Parcel', 'Tamil Nadu', 'Chengalpattu',
            12.79681625, 80.03929525, 'Rice (Paddy)', 1.07,
            '2026-08-27 00:00:00.000000', 0, NULL,
            '{"type":"Polygon","coordinates":[[[80.04000959528507,12.793959632044036],[80.03987008675719,12.793371856857235],[80.04046299605885,12.79329608592323],[80.04061323601196,12.793862962630442],[80.04000959528507,12.793959632044036]]]}',
            '2026-09-26 12:19:04.476247', '2026-09-26 12:19:04.476251',
            NULL, 'Canal', 'NOT_UPLOADED', NULL
        )
    ''')
    print('Inserted Field 8 (Rice - original Field 6)')

# Check if soil_records exists for field 8
cur.execute('SELECT id FROM soil_records WHERE field_id = 8')
if not cur.fetchone():
    cur.execute('''
        INSERT INTO soil_records (
            field_id, source_type, source_name, ph, nitrogen_kg_ha, phosphorus_kg_ha,
            potassium_kg_ha, organic_carbon_pct, electrical_conductivity, texture,
            test_date, laboratory_name, notes, created_at
        ) VALUES (
            8, 'UNAVAILABLE', NULL, NULL, NULL, NULL,
            NULL, NULL, NULL, NULL,
            NULL, NULL, 'No soil test provided yet. Farmer can upload lab report at any time.',
            '2026-09-26 12:19:04.476251'
        )
    ''')
    print('Inserted soil_records for Field 8')

con.commit()
con.close()
print("Restoration finished successfully.")
