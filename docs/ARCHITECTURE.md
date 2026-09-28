# KrishiNet Architecture & Technical Design

## 1. Core Architectural Pipeline

KrishiNet is **not a generic AI chatbot**. It implements a strict, data-grounded pipeline where AI operates solely on top of verified public environmental telemetry and deterministic agronomic rules:

```
┌────────────────────────────────────────────────────────┐
│                   REAL-WORLD PUBLIC DATA               │
│  - Open-Meteo (Live NWP Weather, 2m Temp, Rain Prob)   │
│  - Sentinel-2 L2A STAC (10m Optical Reflectance, NDVI) │
│  - Farmer Soil Health Card / ICAR Soil Taxonomy        │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                       DATA FUSION                      │
│  - Spatial coordinate alignment (WGS84)                │
│  - In-memory 15-minute caching layer                   │
│  - Data Provenance Tagging (MEASURED, SATELLITE, etc.) │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   AGRICULTURAL ANALYSIS                │
│  - Crop Suitability Engine (Indian Agro-Climatic Rules)│
│  - Regenerative Guidance (Soil organic carbon balance) │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                 RISK & DECISION ENGINE                 │
│  - Deterministic thresholds (Heat, Flood, Water Stress)│
│  - Explainable: WHAT, WHY, DATA USED, LIMITATIONS      │
│  - Fallback: 'CANNOT_DETERMINE' (Never fake scores)    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                   AI EXPLANATION LAYER                 │
│  - Tool Pipeline: get_field(), get_weather(), etc.     │
│  - Optional Gemini 2.5 Flash (Google AI Studio Free)   │
│  - Transparent Deterministic Fallback if key absent    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  FARMER ACTION INTERFACE               │
│  - Real-time irrigation timing advice (Postpone/Go)    │
│  - Spray drift hazard warnings                         │
│  - Multimodal plant pathology screening                │
│  - Inter-State Agricultural Intelligence Network       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Zero-Cost Technology Stack

| Layer | Technology | Cost | Rationale |
| :--- | :--- | :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS | ₹0 | Ultra-fast build, zero runtime overhead, responsive. |
| **Geospatial UI** | Leaflet + OpenStreetMap | ₹0 | Zero Google Maps Platform billing; open OSM tile server. |
| **Visual Charts** | Recharts (SVG) | ₹0 | Renders 12-hour temperature & rain probability trends. |
| **Backend API** | FastAPI, Uvicorn, Python 3.14 | ₹0 | High-performance asynchronous endpoint orchestration. |
| **Database** | SQLite + SQLAlchemy ORM | ₹0 | Zero cloud database billing; seamless drop-in for Postgres. |
| **Weather** | Open-Meteo Public API | ₹0 | Free non-commercial API without key requirements. |
| **Satellite** | Copernicus Sentinel-2 L2A STAC | ₹0 | Open science registry; real cloud-cover & scene provenance. |
| **AI Reasoning** | Gemini Free Tier / Deterministic Rules | ₹0 | Operates free; graceful deterministic fallback if absent. |

---

## 3. Data Provenance & Integrity Principle

Every piece of data presented to the farmer carries strict provenance metadata:
- **SOURCE**: API or laboratory of origin (e.g. *Open-Meteo Public API*, *Sentinel-2B*, *KVK Thanjavur Lab*).
- **DATA TYPE**: Classification (*Live Telemetry*, *User Provided*, *Modelled Baseline*).
- **TIMESTAMP**: Retrieval time or test execution date.
- **STATUS**: `LIVE`, `CACHED`, `CLOUDY`, or `UNAVAILABLE`.

### Honest Missing Data Principle:
- If satellite data is obscured by clouds: NDVI is displayed as **"Unavailable"** (Never invented).
- If weather API drops connection: Rain probability is displayed as **"Unavailable"** (Never invented).
- If soil test is not submitted: Soil type is flagged as **"UNAVAILABLE"** with an option to record verified values.

---

## 4. Federated Cross-State Cooperation Architecture

The **India Agricultural Intelligence Network** models how Indian states can exchange agricultural knowledge:
1. **Open Schema Interoperability**: Common JSON structures for crop advisories and soil records across states.
2. **Federated Node Model**: Each state agricultural department (e.g., TNAU Tamil Nadu, PAU Punjab, MPKV Maharashtra) hosts or connects an intelligence node.
3. **Cross-State Model Sharing**: Algorithmic models developed in one state (such as Punjab's terminal heat stress phenology model) can be ingested by neighboring states facing similar climatic challenges.
