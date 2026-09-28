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
# KISAN — AI-Powered Agricultural Intelligence Platform

> Real-world data. Field-level intelligence. Multilingual support. Offline access.

KISAN is an AI-powered agricultural intelligence platform designed to help farmers understand and manage their fields using real-world agricultural data.

The platform combines farmer and field information with weather, satellite, soil, crop, risk, advisory, notification, and AI-assisted capabilities in a single field-centric application.

KISAN is built around the concept of a **Farm Digital Twin**, where each registered field maintains its own agricultural context based on the data available for that field.

---

## Problem

Farmers often depend on multiple sources for agricultural decisions, including weather information, satellite data, soil information, crop guidance, disease identification, and risk alerts.

These sources are usually disconnected, making it difficult to understand what the information means for a particular field.

KISAN brings these capabilities together around the farmer's actual field and crop.

---

## What KISAN Provides

KISAN currently provides:

- Farmer registration
- Field creation and management
- Crop selection during field setup
- Farm Digital Twin
- Geospatial field view
- Real-world weather information
- Satellite-based field monitoring
- Soil information
- Agricultural risk detection
- Crop suitability information
- Regenerative farming guidance
- Ask My Field AI assistant
- AI-assisted crop disease screening
- Agricultural advisories
- Notifications and alerts
- Multilingual support
- Offline-first PWA support
- Data provenance and transparent data handling

---

# Key Features

## Farmer Registration

Farmers can register and create their agricultural profile before setting up their fields.

The registered farmer context is used throughout the application.

---

## Field Setup and Crop Selection

Farmers can create their fields and provide field information including location and crop.

The farmer selects the crop being cultivated during field setup.

The selected crop becomes the context for crop-specific features such as:

- Disease screening
- Risk analysis
- Agricultural advisories
- Crop suitability
- Ask My Field

The system does not need to identify the crop species from an uploaded image when the crop has already been registered for the field.

---

## Farm Digital Twin

KISAN creates a digital representation of the farmer's field.

The Farm Digital Twin brings together the available information for a field, including:

- Field location
- Crop
- Current weather
- Weather forecasts
- Satellite observations
- Vegetation information
- Soil information
- Agricultural risks
- Advisories
- Notifications

This allows different modules to work with the same field context.

---

## Geospatial Field View

KISAN provides a map-based field view where agricultural information is associated with the farmer's field location.

The field view can display available information such as:

- Temperature
- Humidity
- Rainfall probability
- Weather forecasts
- Satellite observations
- Satellite observation date
- Cloud coverage
- NDVI
- NDWI
- Soil information
- Field risks

NDVI and NDWI are shown only when the required satellite data is available.

---

## Multilingual Support

KISAN supports multiple Indian/local languages.

Farmers can use the platform in their selected language.

Multilingual support is integrated across the farmer experience, including:

- User interface
- Field information
- Weather information
- Agricultural advisories
- Risk information
- AI responses
- Disease screening information

The objective is to make agricultural information easier for farmers to understand and use.

---

## Real-World Weather

KISAN uses real-world weather data for the field location.

Weather information includes available data such as:

- Current temperature
- Humidity
- Rainfall probability
- Wind
- Hourly forecast
- Multi-day forecast

Weather information is clearly treated according to whether it represents current conditions or a forecast.

---

## Satellite-Based Field Monitoring

KISAN uses real satellite observations where available.

Sentinel-2 satellite data can provide field-level information including:

- Observation date
- Cloud coverage
- Spectral information
- NDVI
- NDWI
- Vegetation-related information

The platform does not fabricate satellite values.

If required satellite information is unavailable, the corresponding value is shown as unavailable.

---

## Soil Information

KISAN can maintain soil information associated with the farmer's field.

Available soil information can include:

- Soil pH
- Nitrogen
- Phosphorus
- Potassium
- Organic Carbon
- Soil texture

The system distinguishes the source of soil information rather than treating every value as a verified laboratory measurement.

Soil information can be identified as:

- Real documented data
- User-entered data
- Modelled/estimated data
- Unavailable

---

## Agricultural Risk Detection

KISAN includes a deterministic agricultural risk engine.

The current risk categories include:

- Heat Stress
- Heavy Rainfall / Waterlogging
- Drought Stress
- Irrigation Risk
- Vegetation Decline

The risk engine uses available field, weather, soil, and satellite information where relevant.

Risk results provide the reason and supporting data where available.

When required information is missing, the system does not invent a result and can return:

`CANNOT_DETERMINE`

---

## Crop Suitability

KISAN provides rule-based crop suitability information for supported crops, including:

- Rice
- Wheat
- Cotton
- Millets
- Groundnut
- Maize

The suitability information uses available field context and predefined agricultural rules.

---

## Regenerative Farming

KISAN provides regenerative farming guidance.

The platform separates general agricultural principles from recommendations that depend on available field-specific information.

This allows farmers to receive useful agricultural practices without incorrectly presenting generic information as a field measurement.

---

## Ask My Field

**Ask My Field** is KISAN's field-specific AI assistant.

Farmers can ask questions about their own field instead of receiving only generic agricultural answers.

The assistant can retrieve available information through field tools such as:

- `get_field()`
- `get_weather()`
- `get_satellite()`
- `get_soil()`
- `get_risks()`
- `get_advisories()`

The retrieved field information is used as context for the AI response.

The assistant can help explain:

- Current field conditions
- Weather
- Weather forecasts
- Satellite information
- Soil information
- Agricultural risks
- Advisories

The AI does not replace the underlying field data or deterministic risk system.

If AI services are unavailable, KISAN uses controlled fallback behavior where applicable.

---

## AI-Assisted Disease Screening

KISAN provides AI-assisted crop image screening.

Farmers can upload a crop image for visual analysis.

Supported formats include:

- PNG
- JPEG
- WebP

Maximum image size:

`10 MB`

The crop registered for the field is used as context for the screening.

The feature is intended for preliminary visual screening and does not replace laboratory diagnosis or professional agricultural inspection.

The application clearly states:

> AI-assisted screening — not laboratory diagnosis.

If the AI service is unavailable, the system does not pretend that an analysis was completed.

---

## Agricultural Advisories

KISAN generates agricultural advisories using available field information.

Advisories can consider:

- Crop
- Field
- Weather
- Soil
- Satellite information
- Vegetation information
- Agricultural risks

The platform distinguishes between actual observations, forecasts, modelled information, and AI recommendations.

This allows farmers to understand whether information represents a measured condition, expected future condition, estimated information, or recommendation.

---

## Notifications and Alerts

KISAN provides notifications based on evaluated agricultural risks and advisories.

The notification flow connects:

**Risk → Advisory → Notification → Farmer**

Notifications can inform farmers about important field conditions that may require attention.

The system separates alert evaluation from simple data retrieval so that every new data update does not automatically become a notification.

---

## Offline-First PWA

KISAN is designed as an offline-first Progressive Web App.

Previously loaded information can be cached so that the application remains useful when internet connectivity is temporarily unavailable.

Offline access can include previously cached:

- Application resources
- Field information
- Weather information
- Agricultural information

Features requiring new external data continue to require internet connectivity, including:

- New weather data
- New satellite data
- Cloud AI requests
- Disease image analysis

Cached information is not treated as newly retrieved live information.

---

# Data Handling and Provenance

KISAN follows a real-data-first and no-fabrication approach.

The platform distinguishes different types of information.

### Observed / Measured

Information obtained from an actual observation, measurement, or documented record.

### Forecast

Information representing an expected future condition.

### Modelled / Estimated

Information generated through an estimation or modelling process.

### AI Recommendation

Guidance generated or explained with AI assistance.

### Unavailable

Information that could not be obtained or cannot be reliably determined.

The system does not replace missing weather, satellite, soil, or field information with fabricated values.

---

# AI + Deterministic Intelligence

KISAN uses both deterministic agricultural logic and AI.

### Deterministic Intelligence

Used for:

- Risk detection
- Data validation
- Agricultural rules
- Advisory logic
- Alert evaluation
- Missing-data handling

### AI

Used for:

- Ask My Field
- Natural-language agricultural explanations
- Multilingual AI assistance
- Crop image screening

The basic approach is:

**Real Data → Validation → Agricultural Intelligence → AI-Assisted Explanation**

This keeps the underlying agricultural information separate from AI-generated explanations.

---

# Real-World Data Sources

KISAN is designed to use real-world data wherever possible.

### Weather

**Open-Meteo**

Used for weather and forecast information.

### Satellite

**Sentinel-2 / Copernicus**

Used for real satellite observations and vegetation-related analysis.

### Geospatial and Agricultural Information

The platform can work with relevant Indian public agricultural and geospatial resources where available, including resources such as:

- ISRO Bhuvan
- Indian government open-data resources
- Agricultural datasets
- Documented soil information

Data availability depends on the specific source and location.

---

# Data Reliability Principles

KISAN follows these principles:

1. **No fabricated live data**
2. **Explicit missing-data handling**
3. **Data provenance**
4. **Field-specific context**
5. **Deterministic risk evaluation**
6. **AI-assisted explanations**
7. **Graceful external API failures**
8. **No false certainty**

If required information is unavailable, KISAN communicates that limitation instead of generating a plausible-looking value.

---

# Data Handling

KISAN handles different types of information separately.

### Farmer Data

May include:

- Farmer profile
- Field information
- Crop selection
- User-provided agricultural information

### External Data

May include:

- Weather
- Satellite observations
- Geospatial information
- Public agricultural information

### AI Data

AI-generated responses are treated as AI-generated explanations or recommendations.

### Uploaded Images

Crop images submitted for disease screening are validated before processing.

### Cached Data

Previously retrieved information may be stored locally for offline access.

Cached information retains its original context rather than being represented as new live data.

---

# Testing and Validation

KISAN has been validated through automated and integration testing.

Current validation includes:

- 44 backend tests passed
- Production database preserved during testing
- Alert evaluation separated from retrieval
- Offline functionality tested
- Offline AI behavior tested
- Online/offline end-to-end behavior tested
- Frontend production build tested successfully

The backend has been kept stable while the frontend integrates with the existing APIs.

---

# Technology Stack

### Frontend

- React
- Vite
- Progressive Web App
- Leaflet

### Backend

- Python
- FastAPI
- REST APIs

### Data Processing

- Pandas
- NumPy
- GeoPandas
- Scikit-learn

### Database

- SQLite

### AI

- Gemini API

### Weather

- Open-Meteo

### Satellite

- Sentinel-2 / Copernicus

### Development

- Git
- GitHub
- VS Code

---

# Project Structure

```text
KISAN/
│
├── .gitignore
├── README.md
│
├── backend/
│
├── frontend/
│
├── docs/
│
└── scratch/


.

---
```
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
