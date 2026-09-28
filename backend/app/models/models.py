import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    state = Column(String(50), nullable=True)
    preferred_language = Column(String(20), default="en") # en, ta, hi, te, kn, ml
    tamil_dialect = Column(String(20), default="standard") # standard vs natural
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    fields = relationship("Field", back_populates="user", cascade="all, delete-orphan")


class Field(Base):
    __tablename__ = "fields"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    name = Column(String(150), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    crop_type = Column(String(100), nullable=False)
    variety = Column(String(100), nullable=True)
    irrigation_method = Column(String(100), nullable=True)
    soil_report_status = Column(String(50), default="NOT_UPLOADED")
    soil_report_url = Column(String(255), nullable=True)
    area_acres = Column(Float, nullable=True)
    sowing_date = Column(DateTime, nullable=True)
    is_demo = Column(Boolean, default=False)
    demo_label = Column(String(150), nullable=True)
    boundary_geojson = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="fields")
    soil_records = relationship("SoilRecord", back_populates="field", cascade="all, delete-orphan")
    weather_snapshots = relationship("WeatherSnapshot", back_populates="field", cascade="all, delete-orphan")
    satellite_observations = relationship("SatelliteObservation", back_populates="field", cascade="all, delete-orphan")
    risk_results = relationship("RiskResult", back_populates="field", cascade="all, delete-orphan")
    advisories = relationship("Advisory", back_populates="field", cascade="all, delete-orphan")
    disease_analyses = relationship("DiseaseAnalysis", back_populates="field", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="field", cascade="all, delete-orphan")


class Crop(Base):
    __tablename__ = "crops"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    scientific_name = Column(String(150), nullable=True)
    season = Column(String(50), nullable=False) # Kharif, Rabi, Zaid, Year-round
    water_requirement_mm = Column(Float, nullable=True)
    ideal_temp_min = Column(Float, nullable=True)
    ideal_temp_max = Column(Float, nullable=True)
    ideal_soil_ph_min = Column(Float, nullable=True)
    ideal_soil_ph_max = Column(Float, nullable=True)
    suitable_soil_types = Column(String(200), nullable=True)
    duration_days = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)


class SoilRecord(Base):
    __tablename__ = "soil_records"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    # Source type must be clearly distinguished:
    # MEASURED, USER_PROVIDED, MODELLED, SATELLITE_DERIVED, UNAVAILABLE
    source_type = Column(String(50), nullable=False, default="USER_PROVIDED")
    source_name = Column(String(100), nullable=True) # e.g. "Farmer Lab Test (KVK Thanjavur)"
    ph = Column(Float, nullable=True)
    nitrogen_kg_ha = Column(Float, nullable=True)
    phosphorus_kg_ha = Column(Float, nullable=True)
    potassium_kg_ha = Column(Float, nullable=True)
    organic_carbon_pct = Column(Float, nullable=True)
    electrical_conductivity = Column(Float, nullable=True)
    texture = Column(String(100), nullable=True)
    test_date = Column(DateTime, nullable=True)
    laboratory_name = Column(String(150), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    field = relationship("Field", back_populates="soil_records")


class WeatherSnapshot(Base):
    __tablename__ = "weather_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    source = Column(String(100), default="Open-Meteo Public API")
    retrieved_at = Column(DateTime, default=datetime.datetime.utcnow)
    temperature_c = Column(Float, nullable=True)
    apparent_temp_c = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    precipitation_mm = Column(Float, nullable=True)
    precipitation_probability_pct = Column(Float, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    wind_direction_deg = Column(Float, nullable=True)
    weather_code = Column(Integer, nullable=True)
    weather_desc = Column(String(100), nullable=True)
    hourly_forecast_json = Column(Text, nullable=True)
    daily_forecast_json = Column(Text, nullable=True)
    raw_data_json = Column(Text, nullable=True)
    
    field = relationship("Field", back_populates="weather_snapshots")


class SatelliteObservation(Base):
    __tablename__ = "satellite_observations"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    provider = Column(String(100), nullable=False) # Sentinel-2 Open Data / Landsat / MODIS / etc.
    observation_date = Column(DateTime, nullable=True)
    ndvi = Column(Float, nullable=True)
    ndwi = Column(Float, nullable=True)
    vegetation_condition = Column(String(50), nullable=True) # Healthy, Moderate, Stressed, Decline, Unavailable
    vegetation_trend = Column(String(50), nullable=True) # Improving, Stable, Declining, Insufficient Data
    cloud_cover_pct = Column(Float, nullable=True)
    status = Column(String(50), nullable=False) # AVAILABLE, CLOUDY, UNAVAILABLE
    provenance_details = Column(Text, nullable=True) # Satellite ID, Scene ID, Resolution
    retrieved_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    field = relationship("Field", back_populates="satellite_observations")


class RiskResult(Base):
    __tablename__ = "risk_results"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    category = Column(String(100), nullable=False) # HEAT_STRESS, HEAVY_RAINFALL, WATER_STRESS, IRRIGATION_RISK, VEGETATION_DECLINE
    level = Column(String(50), nullable=False) # LOW, MEDIUM, HIGH, CANNOT_DETERMINE
    what_risk = Column(Text, nullable=False)
    why_evidence = Column(Text, nullable=False)
    data_used = Column(String(200), nullable=False)
    data_date = Column(String(100), nullable=True)
    limitations = Column(Text, nullable=False)
    calculated_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    field = relationship("Field", back_populates="risk_results")


class Advisory(Base):
    __tablename__ = "advisories"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)
    category = Column(String(100), nullable=False) # IRRIGATION, SPRAYING, MONITORING, REGENERATIVE, FERTILIZATION
    title = Column(String(200), nullable=False)
    recommendation = Column(Text, nullable=False)
    priority = Column(String(50), default="MEDIUM") # LOW, MEDIUM, HIGH
    factors_used = Column(Text, nullable=True) # JSON string of factors
    data_sources = Column(Text, nullable=True) # JSON string of sources
    limitations = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    field = relationship("Field", back_populates="advisories")


class DiseaseAnalysis(Base):
    __tablename__ = "disease_analyses"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=True)
    image_filename = Column(String(255), nullable=False)
    detected_issue = Column(String(200), nullable=False)
    visible_symptoms = Column(Text, nullable=False)
    confidence_level = Column(String(50), nullable=True) # High, Moderate, Low, or Qualitative
    suggested_actions = Column(Text, nullable=False)
    limitations = Column(Text, nullable=False)
    model_used = Column(String(100), default="Gemini Multimodal / Deterministic Fallback")
    analyzed_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    field = relationship("Field", back_populates="disease_analyses")


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False, index=True)
    type = Column(String(50), nullable=False) # weather, field_risk, advisory, satellite, crop_stage, disease
    severity = Column(String(20), nullable=False, default="info") # info, attention, warning
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    source = Column(String(100), nullable=False) # Open-Meteo, Field Risk Engine, Sentinel-2, Crop Registry, Foliar Inspection
    action = Column(Text, nullable=True) # recommended action
    data_provenance = Column(String(100), nullable=True) # Forecast, Measured, Estimated, AI-Assisted
    data_payload = Column(Text, nullable=True) # JSON string of telemetry metrics
    fingerprint = Column(String(255), nullable=False, unique=True, index=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    field = relationship("Field", back_populates="alerts")
