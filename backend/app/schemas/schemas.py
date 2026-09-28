from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field as PydanticField

class UserBase(BaseModel):
    name: str
    phone: Optional[str] = None
    state: Optional[str] = None
    preferred_language: Optional[str] = "en"
    tamil_dialect: Optional[str] = "standard"

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    state: Optional[str] = None
    preferred_language: Optional[str] = None
    tamil_dialect: Optional[str] = None

class UserResponse(UserBase):
    id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class FieldBase(BaseModel):
    name: str
    state: str
    district: Optional[str] = None
    latitude: float
    longitude: float
    crop_type: str
    variety: Optional[str] = None
    irrigation_method: Optional[str] = None
    soil_report_status: Optional[str] = "NOT_UPLOADED"
    soil_report_url: Optional[str] = None
    area_acres: Optional[float] = None
    sowing_date: Optional[datetime] = None
    is_demo: bool = False
    demo_label: Optional[str] = None
    boundary_geojson: Optional[str] = None

class FieldCreate(FieldBase):
    pass

class FieldUpdate(BaseModel):
    name: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    crop_type: Optional[str] = None
    variety: Optional[str] = None
    irrigation_method: Optional[str] = None
    soil_report_status: Optional[str] = None
    soil_report_url: Optional[str] = None
    area_acres: Optional[float] = None
    sowing_date: Optional[datetime] = None
    boundary_geojson: Optional[str] = None

class FieldResponse(FieldBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class HourlyForecastItem(BaseModel):
    time: str
    temperature_c: float
    precipitation_probability: float
    precipitation_mm: float

class DailyForecastItem(BaseModel):
    date: str
    temp_max: float
    temp_min: float
    precipitation_sum: float
    precipitation_probability_max: float
    weather_desc: str

class WeatherDataResponse(BaseModel):
    source: str = "Open-Meteo Public API"
    retrieved_at: datetime
    temperature_c: Optional[float] = None
    apparent_temp_c: Optional[float] = None
    humidity_pct: Optional[float] = None
    precipitation_mm: Optional[float] = None
    precipitation_probability_pct: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    wind_direction_deg: Optional[float] = None
    weather_code: Optional[int] = None
    weather_desc: Optional[str] = None
    hourly_forecast: Optional[List[HourlyForecastItem]] = None
    daily_forecast: Optional[List[DailyForecastItem]] = None
    status: str = "LIVE"
    cache_status: str = "LIVE" # LIVE, FRESH, STALE, UNAVAILABLE


class SatelliteDataResponse(BaseModel):
    provider: str
    dataset: Optional[str] = "Sentinel-2 L2A"
    scene_id: Optional[str] = None
    observation_date: Optional[datetime] = None
    ndvi: Optional[float] = None
    ndwi: Optional[float] = None
    vegetation_condition: Optional[str] = None
    vegetation_trend: Optional[str] = None
    cloud_cover_pct: Optional[float] = None
    cloud_status: Optional[str] = None # CLEAR, CLOUDY, OVERCAST
    status: str # AVAILABLE, CLOUDY, UNAVAILABLE
    processing_status: Optional[str] = None # PROCESSED, BANDS_UNRETRIEVED, UNAVAILABLE
    is_older_observation: bool = False
    provenance_details: Optional[str] = None
    retrieved_at: datetime
    reason: Optional[str] = None
    thumbnail_url: Optional[str] = None


class SoilRecordCreate(BaseModel):
    source_type: str = "USER_PROVIDED" # MEASURED, USER_PROVIDED, MODELLED, SATELLITE_DERIVED, UNAVAILABLE
    source_name: Optional[str] = "Farmer Lab Report"
    ph: Optional[float] = None
    nitrogen_kg_ha: Optional[float] = None
    phosphorus_kg_ha: Optional[float] = None
    potassium_kg_ha: Optional[float] = None
    organic_carbon_pct: Optional[float] = None
    electrical_conductivity: Optional[float] = None
    texture: Optional[str] = None
    test_date: Optional[datetime] = None
    laboratory_name: Optional[str] = None
    notes: Optional[str] = None

class SoilRecordResponse(SoilRecordCreate):
    id: Optional[int] = None
    field_id: int
    created_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class RiskResultResponse(BaseModel):
    id: Optional[int] = None
    field_id: int
    category: str # HEAT_STRESS, HEAVY_RAINFALL, DROUGHT_WATER_STRESS, IRRIGATION_RISK, VEGETATION_DECLINE
    level: str # LOW, MEDIUM, HIGH, CANNOT_DETERMINE
    what_risk: str
    why_evidence: str
    data_used: str
    data_date: str
    limitations: str
    calculated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)


class AdvisoryResponse(BaseModel):
    id: int
    field_id: int
    category: str
    title: str
    recommendation: str
    priority: str
    factors_used: List[str]
    data_sources: List[str]
    limitations: str
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class CropSuitabilityResponse(BaseModel):
    crop_name: str
    suitability: str # HIGH, MODERATE, LOW, NOT_RECOMMENDED
    season_match: bool
    temperature_score: str
    rainfall_score: str
    soil_score: str
    rationale: str
    factors_used: List[str]
    data_sources: List[str]
    limitations: str


class RegenerativeAdvisoryResponse(BaseModel):
    topic: str
    general_guidance: str
    field_specific_recommendation: Optional[str] = None
    soil_benefit: str
    water_benefit: str
    data_backing: str


class DiseaseAnalysisResponse(BaseModel):
    id: Optional[int] = None
    field_id: Optional[int] = None
    crop_context: Optional[str] = None
    detected_issue: str
    visible_symptoms: str
    confidence_level: Optional[str] = None
    suggested_actions: List[str]
    limitations: str
    model_used: str
    analyzed_at: datetime
    status: str
    disclaimer: str = "AI-assisted screening — not laboratory diagnosis."
    saved_to_history: bool = False


class AssistantRequest(BaseModel):
    field_id: int
    question: str
    language: Optional[str] = "en"

class AssistantResponse(BaseModel):
    answer: str
    why: Optional[str] = None
    data_used: Optional[List[str]] = None
    recommended_action: Optional[str] = None
    limitations: Optional[str] = None
    tools_called: List[str]
    structured_data: Dict[str, Any]
    mode: str # GEMINI_AI or DETERMINISTIC_FALLBACK
    ai_status: str = "CONFIGURED" # CONFIGURED or UNAVAILABLE
    transparency_summary: Optional[List[str]] = None
    disclaimer: Optional[str] = None


class NetworkStateResponse(BaseModel):
    state_name: str
    capital: str
    agro_climatic_zone: str
    primary_crops: List[str]
    shared_datasets: List[str]
    active_fields_count: int
    risk_alerts_count: int
    node_status: str
    last_sync: str


class NetworkOverviewResponse(BaseModel):
    total_states: int
    active_monitoring_nodes: int
    public_datasets_linked: int
    shared_risk_models: int
    states: List[NetworkStateResponse]
    architecture_notes: str


class DashboardMetricsResponse(BaseModel):
    fields_monitored: int
    active_advisories: int
    current_risks: int
    data_sources_available: int


class GeocodingResult(BaseModel):
    name: str
    latitude: float
    longitude: float
    country: str
    admin1: Optional[str] = None
    admin2: Optional[str] = None


class FieldIntelligenceResponse(BaseModel):
    field: FieldResponse
    weather: WeatherDataResponse
    satellite: SatelliteDataResponse
    soil: SoilRecordResponse
    crops: List[CropSuitabilityResponse]
    risks: List[RiskResultResponse]
    advisories: List[AdvisoryResponse]
    data_quality: str # GOOD, PARTIAL, LIMITED, UNAVAILABLE
    data_quality_reasons: List[str]
    generated_at: datetime


class AlertBase(BaseModel):
    field_id: int
    type: str # weather, field_risk, advisory, satellite, crop_stage, disease
    severity: str # info, attention, warning
    title: str
    message: str
    source: str
    action: Optional[str] = None
    data_provenance: Optional[str] = None
    data_payload: Optional[str] = None
    fingerprint: str
    is_read: bool = False

class AlertCreate(AlertBase):
    pass

class AlertResponse(AlertBase):
    id: int
    created_at: datetime
    field_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class AlertCountResponse(BaseModel):
    total: int
    unread: int

class MarkAllReadResponse(BaseModel):
    updated: int
