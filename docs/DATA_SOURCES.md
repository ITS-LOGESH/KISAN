# KrishiNet Verified Zero-Cost Data Sources

Every data provider used by KrishiNet operates at **₹0 cost**, requires **no credit card**, and respects all non-commercial public fair-use guidelines. KrishiNet **never fabricates or hallucinate environmental values**.

---

## 1. Open-Meteo Weather API
- **Source**: Open-Meteo GmbH
- **URL**: `https://api.open-meteo.com` & `https://open-meteo.com/en/docs`
- **Data Used**:
  - Current 2m Air Temperature, Relative Humidity, Apparent Temperature
  - Precipitation (current & cumulative)
  - Precipitation Probability (hourly & daily maximum)
  - 10m Wind Speed and Wind Direction
  - WMO Weather Codes (cloud cover, precipitation type)
  - 7-day quantitative daily forecasts & 24-hour hourly trajectory
- **License / Terms**: Open access under [Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Attribution clearly displayed on every weather telemetry card.
- **Type**: Live numerical weather predictions from ECMWF, GFS, and regional high-resolution meteorological models.
- **API Key Required**: **No**. 100% free for open-source / non-commercial usage.
- **Cost**: **₹0.00**
- **Limitations**: Up to 10,000 requests/day in non-commercial fair use. KrishiNet enforces an in-memory 15-minute coordinate cache (`weather_service.py`) to prevent redundant calls.

---

## 2. Open-Meteo Geocoding API
- **Source**: Open-Meteo Geocoding / OpenStreetMap Data
- **URL**: `https://geocoding-api.open-meteo.com/v1/search`
- **Data Used**: Forward geocoding of Indian place names (village, taluk, district, state) to decimal latitude and longitude.
- **License**: CC BY 4.0.
- **Type**: Live spatial search index.
- **API Key Required**: **No**.
- **Cost**: **₹0.00**
- **Limitations**: Rate limits respect standard HTTP retry-after protocols; returns empty array gracefully on network errors.

---

## 3. Copernicus Sentinel-2 L2A Open STAC Archive
- **Source**: European Space Agency (ESA) Copernicus Programme / AWS Open Data Registry / Element84 Earth Search STAC
- **URL**: `https://earth-search.aws.element84.com/v1`
- **Data Used**:
  - Revisit scene identification, acquisition datetime, and platform telemetry (Sentinel-2A / Sentinel-2B)
  - Cloud cover percentage (`eo:cloud_cover`)
  - Red (B4) and Near-Infrared (B8) surface reflectance indices for Normalized Difference Vegetation Index (NDVI) and Normalized Difference Water Index (NDWI)
- **License**: Free, full, and open access under the [Copernicus Sentinel Data Policy](https://sentinels.copernicus.eu/web/sentinel/sentinel-data-access/legal-background).
- **Type**: Genuine Earth Observation optical observations (5-day revisit cycle in India).
- **API Key Required**: **No**. STAC search endpoint is openly queryable.
- **Cost**: **₹0.00**
- **Limitations**: Optical sensors cannot penetrate cloud cover during the peak monsoon season. If cloud cover exceeds 75%, KrishiNet explicitly flags `status: CLOUDY` and states: *"No recent satellite observation available — cloud cover too high."* KrishiNet **never invents synthetic NDVI**.

---

## 4. OpenStreetMap Cartographic Tiles & Nominatim
- **Source**: OpenStreetMap Foundation
- **URL**: `https://www.openstreetmap.org` & `https://nominatim.openstreetmap.org`
- **Data Used**:
  - Global cartographic map tiles for Leaflet visualization
  - Reverse geocoding of coordinates into Indian administrative districts and states
- **License**: Open Data Commons Open Database License (ODbL). Tiles &copy; OpenStreetMap contributors.
- **Type**: Live spatial tile rendering & reverse geocode lookup.
- **API Key Required**: **No**.
- **Cost**: **₹0.00**
- **Limitations**: Tile usage follows OSM tile usage policy (client caching, custom User-Agent header `KrishiNet-Agricultural-Intelligence-System/1.0`).

---

## 5. Indian Council of Agricultural Research (ICAR) Agronomic Baselines
- **Source**: ICAR, National Bureau of Soil Survey & Land Use Planning (NBSS&LUP), Punjab Agricultural University (PAU), and Tamil Nadu Agricultural University (TNAU)
- **URL**: Public agricultural research extension packages
- **Data Used**:
  - Physiological temperature thresholds and water requirements for Indian crops (Rice, Wheat, Cotton, Millets, Groundnut, Maize)
  - Optimal soil pH and organic carbon benchmarks
  - Regenerative conservation agriculture guidelines (zero-burning residue retention, legume intercropping)
- **License**: Public domain agricultural scientific knowledge & university extension bulletins.
- **Type**: Deterministic agronomic baseline rules.
- **API Key Required**: **No**.
- **Cost**: **₹0.00**
- **Limitations**: Macro-level advisory rules. Farmers are prompted to consult their local Krishi Vigyan Kendra (KVK) for specialized micro-varieties.

---

## 6. Google Gemini Free Tier (Optional Multimodal & Assistant)
- **Source**: Google DeepMind / Google AI Studio
- **URL**: `https://aistudio.google.com/`
- **Data Used**: Conversational reasoning from strictly supplied telemetry (`gemini-2.5-flash`) and visual leaf screening.
- **License**: Google AI Studio Free Tier terms (rate limited to 15 RPM).
- **API Key Required**: **Optional**. Configured via `GEMINI_API_KEY` in `backend/.env`.
- **Cost**: **₹0.00** (Free tier requires no credit card).
- **Fallback Behavior**: If the key is absent or quota is exhausted, KrishiNet **never crashes**. It automatically triggers the transparent deterministic rule engine:
  - *"AI assistant unavailable — configure GEMINI_API_KEY in .env. Displaying deterministic agricultural analysis from live telemetry."*
  - For image screening: *"Image AI unavailable — configure GEMINI_API_KEY for multimodal screening."*
