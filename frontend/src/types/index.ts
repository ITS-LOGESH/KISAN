export interface Field {
  id: number;
  user_id?: number | null;
  name: string;
  state: string;
  district?: string | null;
  latitude: number;
  longitude: number;
  crop_type: string;
  variety?: string | null;
  irrigation_method?: string | null;
  soil_report_status?: string | null;
  soil_report_url?: string | null;
  area_acres?: number | null;
  sowing_date?: string | null;
  is_demo: boolean;
  demo_label?: string | null;
  boundary_geojson?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface UserProfile {
  id?: number;
  name: string;
  phone?: string | null;
  state?: string | null;
  preferred_language: 'en' | 'ta' | 'hi' | 'te' | 'kn' | 'ml' | 'mr' | 'bn';
  tamil_dialect: 'standard' | 'natural';
  created_at?: string;
}

export interface WeatherData {
  source: string;
  retrieved_at: string;
  temperature_c: number | null;
  apparent_temp_c?: number | null;
  humidity_pct: number | null;
  precipitation_mm: number | null;
  precipitation_probability_pct: number | null;
  wind_speed_kmh: number | null;
  wind_direction_deg?: number | null;
  weather_code?: number | null;
  weather_desc?: string | null;
  hourly_forecast?: Array<{
    time: string;
    temperature_c: number;
    precipitation_probability: number;
    precipitation_mm: number;
  }>;
  daily_forecast?: Array<{
    date: string;
    temp_max: number;
    temp_min: number;
    precipitation_sum: number;
    precipitation_probability_max: number;
    weather_desc: string;
  }>;
  status: 'LIVE' | 'CACHED' | 'UNAVAILABLE';
  cache_status?: 'LIVE' | 'FRESH' | 'STALE' | 'UNAVAILABLE';
}

export interface SatelliteData {
  provider: string;
  dataset?: string;
  scene_id?: string | null;
  observation_date: string | null;
  ndvi: number | null;
  ndwi: number | null;
  vegetation_condition: string | null;
  vegetation_trend: string | null;
  cloud_cover_pct: number | null;
  cloud_status?: string | null;
  status: 'AVAILABLE' | 'CLOUDY' | 'UNAVAILABLE';
  processing_status?: string | null;
  is_older_observation?: boolean;
  provenance_details?: string | null;
  retrieved_at: string;
  reason?: string | null;
  thumbnail_url?: string | null;
}

export interface SoilData {
  source_type: 'MEASURED' | 'USER_PROVIDED' | 'MODELLED' | 'SATELLITE_DERIVED' | 'UNAVAILABLE';
  source_name: string | null;
  ph: number | null;
  nitrogen_kg_ha: number | null;
  phosphorus_kg_ha: number | null;
  potassium_kg_ha: number | null;
  organic_carbon_pct: number | null;
  electrical_conductivity: number | null;
  texture: string | null;
  test_date: string | null;
  laboratory_name: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface RiskResult {
  id?: number;
  field_id: number;
  category: 'HEAT_STRESS' | 'HEAVY_RAINFALL' | 'DROUGHT_WATER_STRESS' | 'IRRIGATION_RISK' | 'VEGETATION_DECLINE';
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CANNOT_DETERMINE';
  what_risk: string;
  why_evidence: string;
  data_used: string;
  data_date: string;
  limitations: string;
  calculated_at?: string;
}

export interface Advisory {
  id: number;
  field_id: number;
  category: 'IRRIGATION' | 'SPRAYING' | 'MONITORING' | 'REGENERATIVE' | 'FERTILIZATION';
  title: string;
  recommendation: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  factors_used: string[];
  data_sources: string[];
  limitations: string;
  is_active: boolean;
  created_at: string;
}

export interface CropSuitability {
  crop_name: string;
  suitability: 'HIGH' | 'MODERATE' | 'LOW' | 'NOT_RECOMMENDED';
  season_match: boolean;
  temperature_score: string;
  rainfall_score: string;
  soil_score: string;
  rationale: string;
  factors_used: string[];
  data_sources: string[];
  limitations: string;
}

export interface RegenerativeGuidance {
  topic: string;
  general_guidance: string;
  field_specific_recommendation: string | null;
  soil_benefit: string;
  water_benefit: string;
  data_backing: string;
}

export interface DiseaseAnalysisResult {
  id?: number;
  field_id?: number | null;
  crop_context?: string | null;
  detected_issue: string;
  visible_symptoms: string;
  confidence_level: string;
  suggested_actions: string[];
  limitations: string;
  model_used: string;
  analyzed_at: string;
  status: 'SUCCESS' | 'AI_UNAVAILABLE' | 'ERROR';
  disclaimer: string;
  saved_to_history?: boolean;
}

export interface AssistantResponse {
  answer: string;
  why?: string | null;
  data_used?: string[] | null;
  recommended_action?: string | null;
  limitations?: string | null;
  tools_called: string[];
  structured_data: {
    weather?: WeatherData | null;
    satellite?: SatelliteData | null;
    soil?: SoilData | null;
    risks?: RiskResult[];
    advisories?: Advisory[];
  };
  mode: 'GEMINI_AI' | 'DETERMINISTIC_FALLBACK';
  ai_status?: string | null;
  transparency_summary?: string[] | null;
  disclaimer?: string | null;
}

export interface NetworkState {
  state_name: string;
  capital: string;
  agro_climatic_zone: string;
  primary_crops: string[];
  shared_datasets: string[];
  active_fields_count: number;
  risk_alerts_count: number;
  node_status: 'ACTIVE_NODE' | 'CONNECTING' | 'FEDERATED_PEER';
  last_sync: string;
}

export interface NetworkOverview {
  total_states: number;
  active_monitoring_nodes: number;
  public_datasets_linked: number;
  shared_risk_models: number;
  states: NetworkState[];
  architecture_notes: string;
}

export interface DashboardMetrics {
  fields_monitored: number;
  active_advisories: number;
  current_risks: number;
  data_sources_available: number;
}

export interface FieldIntelligence {
  field: Field;
  weather: WeatherData;
  satellite: SatelliteData;
  soil: SoilData;
  crops: CropSuitability[];
  risks: RiskResult[];
  advisories: Advisory[];
  data_quality: 'GOOD' | 'PARTIAL' | 'LIMITED' | 'UNAVAILABLE';
  data_quality_reasons: string[];
  generated_at: string;
}

export type AlertSeverity = 'info' | 'attention' | 'warning';
export type AlertType = 'weather' | 'field_risk' | 'advisory' | 'satellite' | 'crop_stage' | 'disease';

export interface FarmerAlert {
  id: number;
  field_id: number;
  field_name?: string | null;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  source: string;
  action?: string | null;
  data_provenance?: string | null;
  data_payload?: Record<string, any> | null;
  fingerprint: string;
  is_read: boolean;
  created_at: string;
}

export interface AlertCount {
  total: number;
  unread: number;
}

