# KrishiNet Complete Hackathon Demonstration Script

Follow this step-by-step script to demonstrate KrishiNet to hackathon judges or evaluators.

---

### Step 1: Open the KrishiNet Dashboard
- Open `http://localhost:5173` in your browser.
- Observe the top banner displaying:
  - **KRISHINET**
  - **₹0 COST Badge** (Verifying zero paid cloud APIs)
  - **Demo Mode Toggle** (Allows toggling curated demo fields on or off)
  - Real database metrics: *Fields Monitored*, *Active Advisories*, *Current Risks*, *Public Data Sources* (Zero fake statistics).

---

### Step 2: Explore the Interactive India Map
- The central Leaflet map displays real geographic coordinates across India.
- Color-coded pins indicate crop categories:
  - Green: Rice/Paddy (Cauvery Delta, Tamil Nadu)
  - Amber: Wheat (Ludhiana, Punjab)
  - Indigo: Cotton (Nashik, Maharashtra)
  - Brown: Millets (Mandya, Karnataka)
- Click on any marker to open its popup with exact coordinates and crop information.

---

### Step 3: Select Demonstration Field — Tamil Nadu
- Click on the marker for **DEMO FIELD — TAMIL NADU** (or select it from the right-hand switcher).
- Note the clear **DEMO DATA** badge to ensure no synthetic claims.
- The telemetry cards automatically update in real time:
  1. **Meteorological Intelligence**: Live 2m temperature, humidity, precipitation probability, and wind speed retrieved directly from **Open-Meteo Public API** at ₹0 cost.
  2. **12-Hour Forecast Chart**: Interactive Recharts curve showing temperature and rain probability trajectory.
  3. **Data Provenance Badge**: Displays exact source (*Open-Meteo Public API under CC BY 4.0*), timestamp, and `LIVE` status.

---

### Step 4: Inspect Genuine Satellite Intelligence
- Review the **Earth Observation Intelligence** card:
  - Shows real Sentinel-2 platform identification (*Platform: sentinel-2b*).
  - Displays genuine cloud cover percentage.
  - Optical NDVI index (e.g. 0.54) with condition classification (*Moderate / Healthy*).
  - **Honest Missing Data Demonstration**: Select Field 3 (Maharashtra) or an obscured coordinate to observe that KrishiNet displays *"No recent satellite observation available"* instead of inventing fake NDVI!

---

### Step 5: Inspect Soil Health & Chemical Profile
- Review the **Soil Intelligence** card:
  - Field 1 displays `USER_PROVIDED` from *KVK Thanjavur ICAR Lab* with verified pH (6.4), N (210 kg/ha), P (18.5 kg/ha), and K (280 kg/ha).
  - Field 3 displays `UNAVAILABLE` — demonstrating that KrishiNet never invents fake laboratory numbers.
  - Click **Record Test** to demonstrate how a farmer can input their Soil Health Card numbers directly into SQLite.

---

### Step 6: Evaluate Deterministic Agricultural Risks
- Review the **Deterministic Agricultural Risk Engine**:
  - Highlights risks evaluated under transparent rules:
    - *Heat Stress Hazard*
    - *Heavy Rainfall / Waterlogging*
    - *Crop Drought Stress*
    - *Irrigation Timing Risk*
    - *Vegetation Decline*
  - Each risk explicitly discloses **WHAT**, **WHY (Evidence)**, **DATA USED**, **DATA DATE**, and **LIMITATIONS**.
  - Notice the **CANNOT DETERMINE** badge when input telemetry is incomplete, proving zero hallucinated arbitrary risk percentages.

---

### Step 7: View Field Digital Twin
- Click **Full Digital Twin** in the top-right corner of the field card (or switch to the **Field Digital Twin** tab).
- Switch through the sub-tabs:
  - **Crop Suitability Engine**: Shows transparent ratings for Rice, Wheat, Cotton, Millets, Groundnut, and Maize with factors used and data sources.
  - **Regenerative Agriculture**: Demonstrates rigorous separation of *General Guidance* from *Field-Specific Recommendations* based on verified soil organic carbon.

---

### Step 8: Test "Ask My Field" Ground-Truth AI Assistant
- Switch to the **Ask My Field** tab.
- Click the preset question: **"Should I irrigate today?"**
- Watch the AI tool pipeline trigger:
  - `get_field()`
  - `get_weather()`
  - `get_satellite()`
  - `get_soil()`
  - `get_risk()`
  - `get_advisories()`
- The assistant evaluates live precipitation probability from Open-Meteo.
- If `GEMINI_API_KEY` is configured in `backend/.env`, it returns Gemini 2.5 Flash reasoning grounded strictly in telemetry.
- If `GEMINI_API_KEY` is empty, it returns the transparent deterministic fallback without crashing!

---

### Step 9: Demonstrate Disease Screening
- Click the **Disease Screening** tab in the top navigation.
- Drag & drop or upload any crop leaf image (JPG/PNG/WebP).
- Click **Screen Crop Image**.
- Observe the mandatory disclaimer banner:
  - *"AI-ASSISTED SCREENING — NOT LABORATORY DIAGNOSIS"*
- The screening outputs Detected Issue, Visible Symptoms, Confidence Level, Suggested Agronomic Actions, and Limitations.

---

### Step 10: Open the India Agricultural Intelligence Network
- Click the **Cooperation Network** tab in the top navigation.
- Observe the **DEMONSTRATION / PUBLIC DATA ARCHITECTURE** badge.
- Review the cross-state cooperation pipeline:
  - Tamil Nadu: Cauvery Delta telemetry & TNAU agronomic rules.
  - Punjab: PAU Terminal Heat Stress Phenology Model.
  - Maharashtra: Marathwada Drought Early Warning Patterns.
  - Karnataka: Millets cultivar suitability and dryland water conservation.
- Explains how interoperable open standards allow Indian states to collaborate without proprietary lock-in.
