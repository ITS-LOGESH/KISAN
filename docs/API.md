# KrishiNet REST API Documentation

Base URL: `http://localhost:8000/api`

---

## 1. System & Metrics

### `GET /api/health`
Checks health of all underlying services, providers, and database.
```json
{
  "status": "HEALTHY",
  "service": "KrishiNet AI Agricultural Intelligence Network",
  "version": "1.0.0",
  "database": "SQLite (Local ₹0 Cost)",
  "weather_provider": "Open-Meteo Public API (Zero Key / Open Access)",
  "satellite_provider": "Copernicus Sentinel-2 Public Registry (STAC)",
  "geocoding_provider": "Open-Meteo Geocoding / OSM Nominatim",
  "gemini_status": "OPTIONAL_FALLBACK_ACTIVE"
}
```

### `GET /api/metrics`
Calculates real counts dynamically from the database. Never returns hard-coded fake counts.
- **Parameters**: `include_demo=true/false`
```json
{
  "fields_monitored": 4,
  "active_advisories": 12,
  "current_risks": 8,
  "data_sources_available": 4
}
```

---

## 2. Fields & Digital Twins

### `GET /api/fields`
Retrieves all registered fields.
- **Parameters**: `include_demo=true/false`

### `POST /api/fields`
Registers a new farmer field. Automatically reverse geocodes coordinates to district/state if omitted.
- **Request Body**:
```json
{
  "name": "Cauvery Delta Plot 4",
  "state": "Tamil Nadu",
  "district": "Thanjavur",
  "latitude": 10.7870,
  "longitude": 79.1378,
  "crop_type": "Rice (Paddy)",
  "area_acres": 3.0,
  "is_demo": false
}
```

### `GET /api/fields/{id}`
Returns field profile, crop, sowing date, and geographic coordinates.

---

## 3. Telemetry Endpoints

### `GET /api/fields/{id}/weather`
Fetches real-time weather and 7-day numerical forecast from Open-Meteo.
```json
{
  "source": "Open-Meteo Public API (Attribution: Open-Meteo.com under CC BY 4.0)",
  "retrieved_at": "2026-09-24T14:06:10Z",
  "temperature_c": 30.7,
  "humidity_pct": 39.0,
  "precipitation_mm": 0.0,
  "precipitation_probability_pct": 0.0,
  "wind_speed_kmh": 9.4,
  "weather_desc": "Overcast",
  "status": "LIVE"
}
```

### `GET /api/fields/{id}/satellite`
Fetches genuine Sentinel-2 multi-spectral observation from the public STAC registry.
```json
{
  "provider": "Copernicus sentinel-2b L2A Open Registry",
  "observation_date": "2026-09-16T05:15:46Z",
  "ndvi": 0.54,
  "ndwi": 0.24,
  "vegetation_condition": "Moderate",
  "vegetation_trend": "Stable",
  "cloud_cover_pct": 35.5,
  "status": "AVAILABLE",
  "provenance_details": "Platform: sentinel-2b | Scene ID: S2B_44PKT_20260916_0_L2A"
}
```

### `GET /api/fields/{id}/soil`
Retrieves field soil record with explicit provenance: `MEASURED`, `USER_PROVIDED`, `MODELLED`, or `UNAVAILABLE`.

### `POST /api/fields/{id}/soil`
Allows farmer to record certified Soil Health Card values.

---

## 4. Agricultural Intelligence & Risk Engines

### `GET /api/fields/{id}/risks`
Executes transparent deterministic risk engine. Evaluates:
- `HEAT_STRESS`
- `HEAVY_RAINFALL`
- `DROUGHT_WATER_STRESS`
- `IRRIGATION_RISK`
- `VEGETATION_DECLINE`
Each result returns: `what_risk`, `why_evidence`, `data_used`, `data_date`, `limitations`.

### `GET /api/fields/{id}/advisories`
Returns actionable decision-support advisories with priority levels (`HIGH`, `MEDIUM`, `LOW`).

### `GET /api/fields/{id}/crops`
Returns rule-based suitability ratings (`HIGH`, `MODERATE`, `LOW`) for Indian crops.

### `GET /api/fields/{id}/regenerative`
Returns regenerative farming protocols separating general principles from field-specific recommendations.

---

## 5. AI Assistant & Disease Screening

### `POST /api/assistant`
**Ask My Field** interface. Executes real tool pipeline (`get_field`, `get_weather`, `get_satellite`, `get_soil`, `get_risk`, `get_advisories`), then provides reasoning using Gemini Free Tier or transparent deterministic fallback.
- **Request**:
```json
{
  "field_id": 1,
  "question": "Should I irrigate today?"
}
```

### `POST /api/disease/analyze`
Accepts multipart image upload (`image/jpeg`, `image/png`, `image/webp` max 5MB).
Returns visual pathology findings with mandatory disclaimer: *"AI-assisted screening — not laboratory diagnosis."*

---

## 6. Federated Network

### `GET /api/network/states`
Returns state cooperation nodes (Tamil Nadu, Punjab, Maharashtra, Karnataka, etc.) with active field counts and shared public datasets.

### `GET /api/network/overview`
Provides high-level architectural overview of inter-state public data sharing.
