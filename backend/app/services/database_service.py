import datetime
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.models.models import Field, Crop, SoilRecord, User
from app.core.database import SessionLocal, engine, Base

def _migrate_sqlite_columns():
    """Ensure newly added columns exist in SQLite database without losing data."""
    with engine.connect() as conn:
        try:
            result = conn.execute(text("PRAGMA table_info(users)"))
            cols = [row[1] for row in result.fetchall()]
            if cols:
                if "preferred_language" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN preferred_language VARCHAR(20) DEFAULT 'en'"))
                if "tamil_dialect" not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN tamil_dialect VARCHAR(20) DEFAULT 'standard'"))
                conn.commit()
        except Exception:
            pass

        try:
            result = conn.execute(text("PRAGMA table_info(fields)"))
            cols = [row[1] for row in result.fetchall()]
            if cols:
                if "variety" not in cols:
                    conn.execute(text("ALTER TABLE fields ADD COLUMN variety VARCHAR(100)"))
                if "irrigation_method" not in cols:
                    conn.execute(text("ALTER TABLE fields ADD COLUMN irrigation_method VARCHAR(100)"))
                if "soil_report_status" not in cols:
                    conn.execute(text("ALTER TABLE fields ADD COLUMN soil_report_status VARCHAR(50) DEFAULT 'NOT_UPLOADED'"))
                if "soil_report_url" not in cols:
                    conn.execute(text("ALTER TABLE fields ADD COLUMN soil_report_url VARCHAR(255)"))
                conn.commit()
        except Exception:
            pass

def init_db():
    """Create all tables in SQLite and apply lightweight column migrations."""
    Base.metadata.create_all(bind=engine)
    _migrate_sqlite_columns()
    
    db = SessionLocal()
    try:
        # Check if default user profile exists
        existing_user = db.query(User).first()
        if not existing_user:
            default_user = User(
                name="Farmer",
                phone="",
                state="Tamil Nadu",
                preferred_language="en",
                tamil_dialect="standard"
            )
            db.add(default_user)
            db.commit()

        # Check if fields already seeded
        existing_fields = db.query(Field).count()
        if existing_fields == 0:
            seed_demonstration_data(db)
    finally:
        db.close()

def seed_demonstration_data(db: Session):
    """Seed clearly labelled demonstration fields across India with real coordinates."""
    
    # Standard Indian crops
    crops_data = [
        {
            "name": "Rice (Paddy)",
            "scientific_name": "Oryza sativa",
            "season": "Kharif",
            "water_requirement_mm": 1200.0,
            "ideal_temp_min": 20.0,
            "ideal_temp_max": 35.0,
            "ideal_soil_ph_min": 5.5,
            "ideal_soil_ph_max": 7.0,
            "suitable_soil_types": "Clay, Clay Loam, Alluvial",
            "duration_days": 135,
            "description": "Staple cereal crop of India, requiring standing water and warm humid conditions."
        },
        {
            "name": "Wheat",
            "scientific_name": "Triticum aestivum",
            "season": "Rabi",
            "water_requirement_mm": 450.0,
            "ideal_temp_min": 10.0,
            "ideal_temp_max": 25.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 7.5,
            "suitable_soil_types": "Loam, Clay Loam, Alluvial",
            "duration_days": 120,
            "description": "Key winter crop in northern and central India, sensitive to terminal heat stress."
        },
        {
            "name": "Cotton",
            "scientific_name": "Gossypium hirsutum",
            "season": "Kharif",
            "water_requirement_mm": 700.0,
            "ideal_temp_min": 21.0,
            "ideal_temp_max": 32.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 8.0,
            "suitable_soil_types": "Black Soil (Regur), Deep Alluvial",
            "duration_days": 160,
            "description": "Fiber cash crop widely cultivated in Deccan and Western India."
        },
        {
            "name": "Millet (Pearl/Finger)",
            "scientific_name": "Pennisetum glaucum / Eleusine coracana",
            "season": "Kharif",
            "water_requirement_mm": 350.0,
            "ideal_temp_min": 25.0,
            "ideal_temp_max": 35.0,
            "ideal_soil_ph_min": 5.5,
            "ideal_soil_ph_max": 7.5,
            "suitable_soil_types": "Sandy Loam, Red Soil, Light Soils",
            "duration_days": 90,
            "description": "Drought-hardy nutrient-rich coarse grain ideal for rainfed semi-arid zones."
        },
        {
            "name": "Groundnut",
            "scientific_name": "Arachis hypogaea",
            "season": "Kharif / Rabi",
            "water_requirement_mm": 500.0,
            "ideal_temp_min": 22.0,
            "ideal_temp_max": 30.0,
            "ideal_soil_ph_min": 6.0,
            "ideal_soil_ph_max": 7.0,
            "suitable_soil_types": "Sandy Loam, Well-drained Loam",
            "duration_days": 110,
            "description": "Important oilseed crop with legume nitrogen-fixing properties."
        },
        {
            "name": "Maize",
            "scientific_name": "Zea mays",
            "season": "Kharif / Rabi",
            "water_requirement_mm": 600.0,
            "ideal_temp_min": 18.0,
            "ideal_temp_max": 30.0,
            "ideal_soil_ph_min": 5.8,
            "ideal_soil_ph_max": 7.2,
            "suitable_soil_types": "Well-drained Fertile Loam",
            "duration_days": 105,
            "description": "Versatile cereal crop requiring adequate soil moisture and good drainage."
        }
    ]
    
    for c_data in crops_data:
        crop = Crop(**c_data)
        db.add(crop)
    
    # Demonstration fields with real geographic coordinates
    demo_fields = [
        {
            "name": "DEMO FIELD — TAMIL NADU",
            "state": "Tamil Nadu",
            "district": "Thanjavur",
            "latitude": 10.7870,
            "longitude": 79.1378,
            "crop_type": "Rice (Paddy)",
            "area_acres": 3.5,
            "sowing_date": datetime.datetime.utcnow() - datetime.timedelta(days=45),
            "is_demo": True,
            "demo_label": "DEMO FIELD — TAMIL NADU (Cauvery Delta)",
            "soil": {
                "source_type": "USER_PROVIDED",
                "source_name": "DEMO / USER-ENTERED EXAMPLE (Cauvery Delta)",
                "ph": 6.4,
                "nitrogen_kg_ha": 210.0,
                "phosphorus_kg_ha": 18.5,
                "potassium_kg_ha": 280.0,
                "organic_carbon_pct": 0.58,
                "electrical_conductivity": 0.35,
                "texture": "Clay Loam",
                "test_date": datetime.datetime.utcnow() - datetime.timedelta(days=90),
                "laboratory_name": "Demonstration Record (Illustrative Values, Not Lab Certificate)",
                "notes": "Demonstration soil card profile for software evaluation. Farmer should enter actual Soil Health Card values."
            }
        },
        {
            "name": "DEMO FIELD — PUNJAB",
            "state": "Punjab",
            "district": "Ludhiana",
            "latitude": 30.9010,
            "longitude": 75.8573,
            "crop_type": "Wheat",
            "area_acres": 5.0,
            "sowing_date": datetime.datetime.utcnow() - datetime.timedelta(days=75),
            "is_demo": True,
            "demo_label": "DEMO FIELD — PUNJAB (Indo-Gangetic Plain)",
            "soil": {
                "source_type": "USER_PROVIDED",
                "source_name": "DEMO / USER-ENTERED EXAMPLE (Indo-Gangetic)",
                "ph": 7.8,
                "nitrogen_kg_ha": 180.0,
                "phosphorus_kg_ha": 24.0,
                "potassium_kg_ha": 310.0,
                "organic_carbon_pct": 0.42,
                "electrical_conductivity": 0.45,
                "texture": "Sandy Loam",
                "test_date": datetime.datetime.utcnow() - datetime.timedelta(days=120),
                "laboratory_name": "Demonstration Record (Illustrative Values, Not Lab Certificate)",
                "notes": "Demonstration soil card profile for software evaluation. Farmer should enter actual Soil Health Card values."
            }
        },
        {
            "name": "DEMO FIELD — MAHARASHTRA",
            "state": "Maharashtra",
            "district": "Nashik",
            "latitude": 19.9975,
            "longitude": 73.7898,
            "crop_type": "Cotton",
            "area_acres": 4.0,
            "sowing_date": datetime.datetime.utcnow() - datetime.timedelta(days=60),
            "is_demo": True,
            "demo_label": "DEMO FIELD — MAHARASHTRA (Deccan Plateau)",
            "soil": {
                "source_type": "UNAVAILABLE",
                "source_name": "SOIL DATA UNAVAILABLE",
                "ph": None,
                "nitrogen_kg_ha": None,
                "phosphorus_kg_ha": None,
                "potassium_kg_ha": None,
                "organic_carbon_pct": None,
                "electrical_conductivity": None,
                "texture": None,
                "test_date": None,
                "laboratory_name": None,
                "notes": "No laboratory soil test has been uploaded for this field. Farmer can record test values at any time."
            }
        },
        {
            "name": "DEMO FIELD — KARNATAKA",
            "state": "Karnataka",
            "district": "Mandya",
            "latitude": 12.5218,
            "longitude": 76.8951,
            "crop_type": "Millet (Pearl/Finger)",
            "area_acres": 2.5,
            "sowing_date": datetime.datetime.utcnow() - datetime.timedelta(days=30),
            "is_demo": True,
            "demo_label": "DEMO FIELD — KARNATAKA (Southern Dry Zone)",
            "soil": {
                "source_type": "MODELLED",
                "source_name": "MODELLED (Regional Agro-Climatic Survey Estimate)",
                "ph": 6.1,
                "nitrogen_kg_ha": 195.0,
                "phosphorus_kg_ha": 14.0,
                "potassium_kg_ha": 220.0,
                "organic_carbon_pct": 0.50,
                "electrical_conductivity": 0.28,
                "texture": "Red Sandy Loam",
                "test_date": datetime.datetime.utcnow() - datetime.timedelta(days=180),
                "laboratory_name": "ICAR-NBSS&LUP Regional Survey Model (Coarse Grid, Not Lab Test)",
                "notes": "Coarse regional grid model estimate. Not a laboratory soil health certificate."
            }
        }
    ]
    
    for item in demo_fields:
        soil_info = item.pop("soil")
        field = Field(**item)
        db.add(field)
        db.flush() # obtain field.id
        
        soil_record = SoilRecord(
            field_id=field.id,
            **soil_info
        )
        db.add(soil_record)
    
    db.commit()
