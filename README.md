# KrishiNet: AI Agricultural Intelligence Network

> **Empowering Indian Farmers with Real-World Public Data, Geospatial Intelligence, and Explainable AI at ₹0 Cost.**

[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB.svg)](https://react.dev)
[![Cost](https://img.shields.io/badge/Cost-%E2%82%B90%20Zero%20Paid%20APIs-brightgreen.svg)](#zero-cost-architecture)

---

## 🌾 Absolute Cost Requirement: ₹0 Guarantee

KrishiNet is designed and built to be **100% buildable, demonstrable, and operational at ₹0 cost**:
- ❌ **No Google Cloud billing required**
- ❌ **No Google Maps Platform paid APIs** (Uses Leaflet + OpenStreetMap)
- ❌ **No Google Weather API** (Uses Open-Meteo free public API)
- ❌ **No paid cloud database** (Uses local SQLite with SQLAlchemy ORM)
- ❌ **No paid AI API required** (Gemini 2.5 Flash operates via the free tier; if unconfigured, transparent deterministic agronomic rule fallbacks execute automatically)

KrishiNet **never depends on a paid API to function**.

---

## 🚀 Core Philosophy: Not a Generic Chatbot

Smallholder farmers do not need generic hallucinated chatbot text. KrishiNet implements a data-first decision pipeline:

```
REAL PUBLIC DATA
       ↓
  DATA FUSION
       ↓
AGRICULTURAL ANALYSIS
       ↓
RISK & DECISION ENGINE
       ↓
  AI EXPLANATION
       ↓
  FARMER ACTION
```

---

## 🛰️ Zero-Cost Data Stack & Provenance

KrishiNet **never fabricates environmental data**:
- **Weather**: [Open-Meteo](https://open-meteo.com) public numerical weather prediction (CC BY 4.0).
- **Satellite**: Real [Copernicus Sentinel-2 L2A](https://sentinels.copernicus.eu) surface reflectance via AWS Public STAC archive. If cloud cover is high or data is unavailable, it explicitly states *"No recent satellite observation available"* instead of inventing fake NDVI.
- **Soil Data**: Distinguishes `MEASURED`, `USER_PROVIDED`, `MODELLED`, and `UNAVAILABLE`.
- **Cartography**: Leaflet + OpenStreetMap cartographic tiles.
- **Geocoding**: Open-Meteo Geocoding API + OSM Nominatim.

---

## 📂 Project Structure

```
krishinet/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints (fields, weather, satellite, soil, etc.)
│   │   ├── core/            # Settings & SQLite database engine
│   │   ├── engines/         # Deterministic risk, crop suitability & advisory engines
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── schemas/         # Pydantic v2 schemas
│   │   ├── services/        # Weather, satellite, geocoding, and Gemini services
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/               # Pytest test suite
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment template
├── frontend/
│   ├── src/
│   │   ├── components/      # IndiaMap, WeatherCard, SatelliteCard, SoilCard, AskField, etc.
│   │   ├── pages/           # Dashboard, Field, Disease, Network
│   │   ├── services/        # Frontend API client
│   │   └── types/           # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   ├── ARCHITECTURE.md      # Detailed system architecture
│   ├── DATA_SOURCES.md      # Verified public data licenses and terms
│   ├── API.md               # Full REST API specification
│   └── DEMO.md              # Step-by-step demonstration walkthrough
└── README.md
```

---

## ⚡ Quickstart Guide

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ and npm

### 1. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On Linux/macOS:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Run unit and integration tests
pytest -v tests

# Start FastAPI backend
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Backend API docs available at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Start development server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌟 Key Modules

### 1. Geospatial India Map & Digital Twin
Interactive Leaflet map showing demonstration fields across Tamil Nadu, Punjab, Maharashtra, and Karnataka. Select any field to inspect its Digital Twin:
- Live 2m air temperature, humidity, rainfall probability, and 12-hour hourly forecasts.
- Genuine Sentinel-2 optical observation with NDVI, NDWI, and cloud cover metrics.
- Verified Soil Health Card nutrient profiles (pH, N, P, K, Organic Carbon).

### 2. Deterministic Agricultural Risk Engine
Evaluates Heat Stress, Heavy Rainfall / Waterlogging, Drought Stress, Irrigation Risk, and Vegetation Decline. Each output includes **WHAT**, **WHY (Evidence)**, **DATA USED**, **DATA DATE**, and **LIMITATIONS**. If input data is missing, it displays `CANNOT_DETERMINE` rather than generating arbitrary risk scores.

### 3. Crop Suitability & Regenerative Farming
- Rule-based suitability assessment for standard Indian crops (Rice, Wheat, Cotton, Millets, Groundnut, Maize).
- Regenerative module with strict separation between **General Agricultural Principles** and **Field-Specific Recommendations** based on verified soil carbon.

### 4. "Ask My Field" Ground-Truth AI
Farmers can ask practical questions like *"Should I irrigate today?"* or *"Why is my field at risk?"*. The engine invokes real data tools (`get_weather()`, `get_satellite()`, `get_soil()`, `get_risk()`, `get_advisories()`) before generating an explanation via Gemini Free Tier or a deterministic fallback.

### 5. Crop Disease Image Screening
Allows farmers to upload foliage photographs for visual symptom screening with the mandatory disclaimer:
> **"AI-assisted screening — not laboratory diagnosis."**

### 6. India Agricultural Intelligence Network
Demonstrates the cooperation architecture for sharing public datasets, agronomic heuristics, and risk models across Indian states (Tamil Nadu, Punjab, Maharashtra, Karnataka, Andhra Pradesh, Uttar Pradesh) without proprietary lock-in.

---

## 🧪 Testing

KrishiNet includes a comprehensive test suite covering API endpoints, weather fallbacks, and deterministic risk logic:
```bash
cd backend
pytest -v tests
```
All tests pass with 100% deterministic reproducibility.

---

## 📜 Documentation

- [Detailed Architecture](docs/ARCHITECTURE.md)
- [Zero-Cost Verified Data Sources](docs/DATA_SOURCES.md)
- [REST API Reference](docs/API.md)
- [Judge & Evaluator Demo Script](docs/DEMO.md)

---

## 📄 License
This project is licensed under the MIT License. Public meteorological data courtesy of Open-Meteo under CC BY 4.0. Satellite imagery courtesy of Copernicus Sentinel Data. Map tiles &copy; OpenStreetMap contributors.
