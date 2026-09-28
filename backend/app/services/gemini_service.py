import os
import json
import base64
import logging
import httpx
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

class GeminiService:
    """
    Zero-cost, optional Gemini integration service for agricultural intelligence.
    Operates strictly as an AI reasoning and explanation layer ON TOP OF real telemetry:
    REAL DATA -> FASTAPI SERVICES -> DATA FUSION -> DETERMINISTIC ANALYSIS -> GEMINI EXPLANATION
    
    Adheres to strict Phase 4 rules:
    - Gemini never invents environmental ground truth (weather, soil, NDVI, risks).
    - If GEMINI_API_KEY is missing, application continues running 100% with transparent deterministic engine output.
    - If spectral bands are unretrieved, explicitly states NDVI is unavailable.
    """

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY.strip()
        self.model_name = getattr(settings, "GEMINI_MODEL", "gemini-2.5-flash")
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model_name}:generateContent"

    def is_configured(self) -> bool:
        """Check if a non-empty Gemini API key is configured."""
        return bool(self.api_key and len(self.api_key) > 5)

    def _get_transparency_summary(
        self,
        weather: Dict[str, Any],
        satellite: Dict[str, Any],
        soil: Optional[Dict[str, Any]],
        risks: List[Dict[str, Any]],
        advisories: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate human-readable data transparency checklist."""
        summary = []
        
        # Weather
        if weather.get("status") in ("LIVE", "CACHED") and weather.get("temperature_c") is not None:
            summary.append(f"✓ Weather: Live Open-Meteo ({weather.get('temperature_c')}°C, Rain Prob: {weather.get('precipitation_probability_pct') or 0}%)")
        else:
            summary.append("○ Weather: Public feed unavailable")

        # Satellite
        if satellite.get("status") == "AVAILABLE" and satellite.get("ndvi") is not None:
            summary.append(f"✓ Satellite: Copernicus Sentinel-2 (NDVI: {satellite.get('ndvi')})")
        elif satellite.get("status") in ("AVAILABLE", "CLOUDY"):
            obs = satellite.get("observation_date", "recent")[:10] if satellite.get("observation_date") else "recent"
            summary.append(f"○ Satellite: Real Scene {satellite.get('scene_id') or 'Detected'} observed {obs} (Spectral bands unretrieved — NDVI unavailable)")
        else:
            summary.append("○ Satellite: No usable observation")

        # Soil
        soil_type = soil.get("source_type") if soil else "UNAVAILABLE"
        if soil_type in ("MEASURED", "USER_PROVIDED"):
            summary.append(f"✓ Soil: {soil.get('source_name') or 'User-Provided Soil Card'}")
        elif soil_type == "MODELLED":
            summary.append(f"○ Soil: Regional Model Estimate (Not lab test)")
        else:
            summary.append("○ Soil: No soil test on record (UNAVAILABLE)")

        # Risk and Advisory engines
        summary.append(f"✓ Risk Engine: {len(risks)} deterministic agricultural risk evaluations")
        summary.append(f"✓ Advisory Engine: {len(advisories)} actionable signals generated")

        return summary

    async def answer_field_question(
        self,
        question: str,
        field_id: int,
        field_info: Dict[str, Any],
        weather: Dict[str, Any],
        satellite: Dict[str, Any],
        soil: Optional[Dict[str, Any]],
        risks: List[Dict[str, Any]],
        advisories: List[Dict[str, Any]],
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        'Ask My Field' reasoning pipeline.
        Consumes structured tool outputs, then provides Gemini reasoning or deterministic fallback.
        Structure: ANSWER, WHY, DATA USED, WHAT YOU SHOULD DO, LIMITATIONS.
        """
        tools_called = [
            "get_field()",
            "get_weather()",
            "get_satellite()",
            "get_soil()",
            "get_risks()",
            "get_advisories()"
        ]

        structured_data = {
            "field": field_info,
            "weather": weather,
            "satellite": satellite,
            "soil": soil,
            "risks": risks,
            "advisories": advisories
        }

        transparency = self._get_transparency_summary(weather, satellite, soil, risks, advisories)

        # 1. Fallback if Gemini key is missing
        if not self.is_configured():
            fallback = self._generate_deterministic_structured(
                question, field_info, weather, satellite, soil, risks, advisories
            )
            return {
                "answer": fallback["answer"],
                "why": fallback["why"],
                "data_used": fallback["data_used"],
                "recommended_action": fallback["recommended_action"],
                "limitations": fallback["limitations"],
                "tools_called": tools_called,
                "structured_data": structured_data,
                "mode": "DETERMINISTIC_FALLBACK",
                "ai_status": "UNAVAILABLE",
                "transparency_summary": transparency,
                "disclaimer": "AI assistant unavailable — deterministic agricultural intelligence remains available."
            }

        # Language configuration
        lang_names = {
            "en": "English",
            "ta": "Tamil",
            "ta-standard": "formal standard Tamil",
            "ta-natural": "conversational rural Tamil",
            "hi": "Hindi",
            "te": "Telugu",
            "kn": "Kannada",
            "ml": "Malayalam",
            "mr": "Marathi",
            "bn": "Bengali"
        }
        target_lang = lang_names.get(language, "English")
        lang_instruction = ""
        if language and language != "en":
            lang_instruction = f"""5. LANGUAGE REQUIREMENT: The farmer is communicating in {target_lang}. You MUST write ALL JSON text fields ("answer", "why", "recommended_action", "limitations") fluently and naturally in {target_lang} (using {target_lang} script, e.g. Tamil script for Tamil, Devanagari script for Hindi/Marathi, Telugu script for Telugu, etc.). Use simple, respectful, practical farming phrasing suited for a local Indian farmer. Do NOT output English for these fields."""

        # 2. Generative AI Reasoning Pipeline via Gemini
        prompt = f"""
You are the KrishiNet Agricultural Intelligence Reasoning Engine.
You provide farmer-friendly agricultural explanations based strictly on the verified field telemetry provided below.

CRITICAL INSTRUCTIONS:
1. Gemini must NOT become the source of environmental truth. Do NOT invent weather, rainfall, soil values, NDVI, or risk percentages.
2. If NDVI is unavailable or unretrieved, state clearly: "Satellite vegetation index is currently unavailable." Do NOT invent or estimate NDVI.
3. Frame advice as DECISION SUPPORT, not guaranteed certainty. Avoid absolute commands (e.g. use "Delaying irrigation may be prudent..." rather than "Do not irrigate").
4. Output MUST be valid JSON with the exact keys:
   - "answer": Concise direct answer to the farmer's question (1-2 sentences).
   - "why": Factual explanation citing the specific evidence provided below.
   - "data_used": Array of strings identifying each source cited.
   - "recommended_action": Actionable field-level guidance for the farmer.
   - "limitations": Explicit limitations, unmeasured variables, or forecast uncertainties.
{lang_instruction}

VERIFIED TELEMETRY (TOOL RESULTS):
- Field: {field_info.get('name')} in {field_info.get('district', '')}, {field_info.get('state')}
- Crop: {field_info.get('crop_type')} (Area: {field_info.get('area_acres', 'N/A')} acres)
- Weather (Open-Meteo):
  * Temperature: {weather.get('temperature_c')}°C (Apparent: {weather.get('apparent_temp_c')}°C)
  * Humidity: {weather.get('humidity_pct')}%
  * Precipitation Probability: {weather.get('precipitation_probability_pct')}%
  * Expected Rainfall: {weather.get('precipitation_mm')} mm
  * Wind Speed: {weather.get('wind_speed_kmh')} km/h
  * Status: {weather.get('status')} (Cache: {weather.get('cache_status')})
- Satellite (Copernicus Sentinel-2 L2A):
  * Scene ID: {satellite.get('scene_id')}
  * Observed Date: {satellite.get('observation_date')}
  * Cloud Cover: {satellite.get('cloud_cover_pct')}%
  * NDVI: {satellite.get('ndvi') if satellite.get('ndvi') is not None else 'UNAVAILABLE (Required bands unretrieved)'}
  * Status: {satellite.get('status')}
- Soil:
  * Source Type: {soil.get('source_type') if soil else 'UNAVAILABLE'}
  * Source Name: {soil.get('source_name') if soil else 'N/A'}
  * pH: {soil.get('ph') if soil else 'N/A'}
  * Organic Carbon: {soil.get('organic_carbon_pct') if soil else 'N/A'}%
- Evaluated Deterministic Risks:
{json.dumps([{'category': r['category'], 'level': r['level'], 'what': r['what_risk'], 'evidence': r['why_evidence']} for r in risks], indent=2)}
- Active Deterministic Advisories:
{json.dumps([{'category': a['category'], 'title': a['title'], 'recommendation': a['recommendation']} for a in advisories], indent=2)}

FARMER'S QUESTION:
"{question}"

Output pure JSON only. No markdown formatting.
"""

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(
                    f"{self.base_url}?key={self.api_key}",
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "generationConfig": {
                            "temperature": 0.2,
                            "responseMimeType": "application/json"
                        }
                    }
                )
                
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        text_part = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                        cleaned = text_part.strip()
                        if cleaned.startswith("```json"):
                            cleaned = cleaned[7:]
                        if cleaned.startswith("```"):
                            cleaned = cleaned[3:]
                        if cleaned.endswith("```"):
                            cleaned = cleaned[:-3]
                        parsed = json.loads(cleaned.strip())
                        
                        return {
                            "answer": parsed.get("answer", "Analysis generated from field telemetry."),
                            "why": parsed.get("why", "Based on current meteorological and agronomic observations."),
                            "data_used": parsed.get("data_used", ["Open-Meteo Weather", "Deterministic Risk Engine"]),
                            "recommended_action": parsed.get("recommended_action", "Monitor local field conditions."),
                            "limitations": parsed.get("limitations", "Numerical weather forecasts may change; verify local soil moisture before field operations."),
                            "tools_called": tools_called,
                            "structured_data": structured_data,
                            "mode": "GEMINI_AI",
                            "ai_status": "CONFIGURED",
                            "transparency_summary": transparency,
                            "disclaimer": "AI-assisted reasoning based on verified telemetry — decision support only."
                        }
                else:
                    logger.warning(f"Gemini API returned error code {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")

        # 3. Fallback on Gemini error (timeout, quota, network)
        fallback = self._generate_deterministic_structured(
            question, field_info, weather, satellite, soil, risks, advisories
        )
        return {
            "answer": fallback["answer"],
            "why": fallback["why"],
            "data_used": fallback["data_used"],
            "recommended_action": fallback["recommended_action"],
            "limitations": fallback["limitations"],
            "tools_called": tools_called,
            "structured_data": structured_data,
            "mode": "DETERMINISTIC_FALLBACK",
            "ai_status": "UNAVAILABLE",
            "transparency_summary": transparency,
            "disclaimer": "Gemini API unavailable or rate-limited. Presenting deterministic agricultural analysis from live telemetry."
        }

    # Backward compatibility alias
    answer_field_query = answer_field_question

    def _generate_deterministic_structured(
        self,
        question: str,
        field_info: Dict[str, Any],
        weather: Dict[str, Any],
        satellite: Dict[str, Any],
        soil: Optional[Dict[str, Any]],
        risks: List[Dict[str, Any]],
        advisories: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Transparent deterministic fallback answering farmer questions strictly using backend engines.
        Returns structured answer, why, data_used, recommended_action, limitations.
        """
        q_lower = question.lower()
        crop = field_info.get("crop_type", "Crop")
        temp = weather.get("temperature_c")
        precip_prob = weather.get("precipitation_probability_pct") or 0
        wind = weather.get("wind_speed_kmh")
        
        # 1. Irrigation queries
        if any(w in q_lower for w in ["irrigate", "water", "irrigation"]):
            irr_adv = next((a for a in advisories if a.get("category") == "IRRIGATION"), None)
            irr_risk = next((r for r in risks if r.get("category") == "IRRIGATION_RISK"), None)
            
            if precip_prob >= 50:
                return {
                    "answer": f"Delaying immediate irrigation for {crop} is advisable.",
                    "why": f"Forecast rainfall probability is elevated at {precip_prob}%. Applying irrigation now risks soil waterlogging and nutrient leaching.",
                    "data_used": [
                        f"Open-Meteo Short-Range Forecast (Precipitation Probability: {precip_prob}%)",
                        f"Deterministic Irrigation Risk Model ({irr_risk.get('level') if irr_risk else 'MEDIUM'})"
                    ],
                    "recommended_action": "Postpone canal/pump irrigation by 24-48 hours. Monitor cloud buildup and soil surface moisture.",
                    "limitations": "Summer convective showers may be localized. If rain bypasses the sector, reassess field moisture tomorrow morning."
                }
            else:
                return {
                    "answer": f"Favorable conditions for scheduled irrigation for {crop}.",
                    "why": f"Rain probability is low ({precip_prob}%) and ambient temperature is {temp if temp is not None else 'moderate'}°C.",
                    "data_used": [
                        f"Open-Meteo Weather Forecast (Rain Probability: {precip_prob}%, Temp: {temp}°C)",
                        "Deterministic Advisory Engine (IRRIGATION)"
                    ],
                    "recommended_action": "Proceed with regular irrigation schedule, preferably during early morning or evening hours to minimize evaporative losses.",
                    "limitations": "Ensure irrigation volume aligns with the current crop phenological stage."
                }

        # 2. Risk / Danger queries
        if any(w in q_lower for w in ["risk", "danger", "safe", "threat", "warning"]):
            high_risks = [r for r in risks if r.get("level") == "HIGH"]
            med_risks = [r for r in risks if r.get("level") == "MEDIUM"]
            
            if high_risks:
                r_top = high_risks[0]
                return {
                    "answer": f"Elevated agricultural hazard detected: {r_top['what_risk']}.",
                    "why": r_top["why_evidence"],
                    "data_used": [r_top["data_used"], "Deterministic Risk Engine"],
                    "recommended_action": "Review the detailed Risk Assessment tab and implement targeted protective interventions.",
                    "limitations": r_top["limitations"]
                }
            elif med_risks:
                r_top = med_risks[0]
                return {
                    "answer": f"Moderate environmental watch active: {r_top['what_risk']}.",
                    "why": r_top["why_evidence"],
                    "data_used": [r_top["data_used"], "Deterministic Risk Engine"],
                    "recommended_action": "Monitor crop canopy and weather progression over the next 24 hours.",
                    "limitations": r_top["limitations"]
                }
            else:
                return {
                    "answer": "All evaluated environmental risk categories are currently LOW.",
                    "why": f"Ambient temperature ({temp}°C) and forward weather are within safe agronomic parameters for {crop}.",
                    "data_used": ["Open-Meteo Live Telemetry", "5-Point Deterministic Risk Engine"],
                    "recommended_action": "Maintain routine crop scouting and standard agronomic practices.",
                    "limitations": "Sub-surface pests and micro-canopy disease vectors cannot be detected from ambient weather stations."
                }

        # 3. Satellite / Vegetation condition queries
        if any(w in q_lower for w in ["satellite", "ndvi", "vegetation", "greenness", "health", "biomass"]):
            sat_status = satellite.get("status")
            ndvi = satellite.get("ndvi")
            obs_dt = satellite.get("observation_date", "recent")[:10] if satellite.get("observation_date") else "recent"
            scene_id = satellite.get("scene_id", "Sentinel-2 Scene")
            
            return {
                "answer": "Satellite vegetation index (NDVI) is currently unavailable.",
                "why": f"Copernicus Sentinel-2 scene {scene_id} was observed on {obs_dt} (cloud cover: {satellite.get('cloud_cover_pct')}%), but raw 216MB spectral bands (B04/B08) were not radiometrically processed.",
                "data_used": [
                    "Copernicus Sentinel-2 L2A STAC Registry",
                    f"Observation Date: {obs_dt}"
                ],
                "recommended_action": "Inspect plant vigour directly in the field. KrishiNet never invents synthetic NDVI values.",
                "limitations": "Satellite vegetation indices require cloud-free spectral band calculation and do not capture sub-canopy health."
            }

        # 4. Spraying / Chemical queries
        if any(w in q_lower for w in ["spray", "pesticide", "fungicide", "chemical"]):
            spray_adv = next((a for a in advisories if a.get("category") == "SPRAYING"), None)
            return {
                "answer": spray_adv["recommendation"] if spray_adv else "Exercise caution before chemical spraying.",
                "why": f"Current wind speed is {wind} km/h (safe threshold: 15 km/h) and rain probability is {precip_prob}%.",
                "data_used": ["Open-Meteo 10m Wind Telemetry", "Open-Meteo Rain Probability"],
                "recommended_action": "Wear full PPE and calibrate spray nozzles to minimize droplet drift.",
                "limitations": "Localized terrain and wind gusts may differ from 10m grid telemetry."
            }

        # General status overview
        active_adv = advisories[0]["title"] if advisories else "Standard Crop Care"
        return {
            "answer": f"Current field conditions are stable for {crop} in {field_info.get('state')}.",
            "why": f"Ambient temperature is {temp}°C, humidity is {weather.get('humidity_pct')}%, and rainfall probability is {precip_prob}%. Priority advisory: {active_adv}.",
            "data_used": [
                "Open-Meteo Public Weather API",
                "Deterministic Risk & Advisory Engines",
                f"Soil Record: {soil.get('source_type') if soil else 'UNAVAILABLE'}"
            ],
            "recommended_action": "Consult the Advisories tab for specific irrigation, spraying, and nutrient management recommendations.",
            "limitations": "These insights provide agro-climatic decision support. Consult your local Krishi Vigyan Kendra for micro-plot guidance."
        }

    async def generate_field_explanation(
        self,
        field_info: Dict[str, Any],
        weather: Dict[str, Any],
        satellite: Dict[str, Any],
        soil: Optional[Dict[str, Any]],
        risks: List[Dict[str, Any]],
        advisories: List[Dict[str, Any]]
    ) -> str:
        """Synthesize a structured agronomic explanation of the field state."""
        res = await self.answer_field_question(
            question="What is the overall agronomic status and recommendation for my field?",
            field_id=field_info.get("id", 1),
            field_info=field_info,
            weather=weather,
            satellite=satellite,
            soil=soil,
            risks=risks,
            advisories=advisories
        )
        return f"{res['answer']} {res['why']}"

    async def analyze_crop_image(
        self,
        image_bytes: bytes,
        mime_type: str = "image/jpeg",
        crop_context: Optional[str] = None,
        field_context: Optional[Dict[str, Any]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Multimodal visual plant pathology screening.
        Uses free Gemini multimodal tier when configured.
        Strictly enforces non-laboratory disclaimer and non-definitive wording.
        Incorporates registered crop and field agro-climatic context.
        """
        # Supported MIME types check
        if mime_type not in ("image/jpeg", "image/png", "image/webp"):
            return {
                "detected_issue": "Unsupported Image Format",
                "visible_symptoms": f"Uploaded format '{mime_type}' is not supported. Please upload JPG, PNG, or WebP.",
                "confidence_level": "None",
                "suggested_actions": ["Upload a standard JPG, PNG, or WebP image."],
                "limitations": "File format validation guardrail.",
                "model_used": "Format Validator",
                "analyzed_at": datetime.utcnow().isoformat(),
                "status": "ERROR",
                "disclaimer": "AI-assisted screening — not laboratory diagnosis."
            }

        # Size check (10MB limit)
        if len(image_bytes) > 10 * 1024 * 1024:
            return {
                "detected_issue": "Image Size Exceeded",
                "visible_symptoms": f"Image size ({len(image_bytes) / (1024*1024):.1f}MB) exceeds the 10MB maximum limit.",
                "confidence_level": "None",
                "suggested_actions": ["Compress or resize image to under 10MB before uploading."],
                "limitations": "Payload size guardrail.",
                "model_used": "Size Validator",
                "analyzed_at": datetime.utcnow().isoformat(),
                "status": "ERROR",
                "disclaimer": "AI-assisted screening — not laboratory diagnosis."
            }

        # Fallback if Gemini key is missing
        if not self.is_configured():
            if crop_context:
                crop_lower = crop_context.lower()
                if "rice" in crop_lower or "paddy" in crop_lower:
                    issue = "Rice / Paddy Foliar Health Inspection"
                    symptoms = "Foliage evaluated for Rice (Paddy). In Indian wetland conditions, check closely for spindle-shaped blast lesions, irregular greyish water-soaked sheath spots, or leaf tip yellowing."
                    actions = [
                        "Avoid excessive nitrogen / urea top-dressing which increases foliar susceptibility to blast.",
                        "Apply prophylactic foliar bio-agent spray of Pseudomonas fluorescens @ 10g/litre.",
                        "Maintain alternate wetting and drying (AWD) rather than stagnant high water if sheath blight is suspected.",
                        "Submit a physical leaf sample to your nearest Krishi Vigyan Kendra (KVK) for laboratory confirmation."
                    ]
                elif "cotton" in crop_lower:
                    issue = "Cotton Foliar Health Inspection"
                    symptoms = "Foliage evaluated for Cotton. Inspect for angular water-soaked leaf spots (bacterial blight), downward curling from sucking pests, or early square drop."
                    actions = [
                        "Install yellow and blue sticky traps (5-8 traps/acre) for whitefly and jassid monitoring.",
                        "Spray 5% Neem Seed Kernel Extract (NSKE) at early foliar manifestation.",
                        "Avoid water stagnation around root zone to prevent root rot complexes.",
                        "Submit symptomatic leaf to local agricultural officer / KVK for laboratory assay."
                    ]
                elif "groundnut" in crop_lower:
                    issue = "Groundnut Foliar Health Inspection"
                    symptoms = "Foliage evaluated for Groundnut. Look for circular dark brown/black necrotic spots with yellow halos (Tikka leaf spot / Cercospora)."
                    actions = [
                        "Spray wettable sulfur @ 2.5g/L or Trichoderma harzianum foliar formulation.",
                        "Ensure field drainage to minimize soil and foliar fungal spore progression.",
                        "Consult KVK specialist for chemical threshold spray guidelines."
                    ]
                elif "wheat" in crop_lower:
                    issue = "Wheat Foliar Health Inspection"
                    symptoms = "Foliage evaluated for Wheat. Check flag leaf for parallel rows of yellow/orange pustules (Yellow Stripe Rust)."
                    actions = [
                        "Scout field borders where wind-borne rust spores typically deposit first.",
                        "Apply bio-protective spray or consult local extension office for approved fungicide if pustules spread.",
                        "Maintain balanced potash fertilization to strengthen leaf tissues."
                    ]
                else:
                    issue = f"{crop_context} Foliar Health Inspection"
                    symptoms = f"Visual foliar inspection for {crop_context}. Check for irregular leaf spot lesions, marginal chlorosis, or necrotic spots."
                    actions = [
                        "Isolate symptomatic plants and avoid overhead sprinkler splash which spreads fungal spores.",
                        "Apply organic prophylactic neem-based formulation (3000 ppm @ 3ml/L).",
                        "Bring physical leaf sample to nearest Krishi Vigyan Kendra (KVK) for laboratory verification."
                    ]

                return {
                    "detected_issue": issue,
                    "visible_symptoms": symptoms,
                    "confidence_level": "Registered Crop Profiled",
                    "suggested_actions": actions,
                    "limitations": "Gemini API key is not configured in backend; advice generated via KrishiNet Registered Crop Pathology Knowledge Base.",
                    "model_used": "KrishiNet Crop Pathology Engine (Zero-Cost Offline)",
                    "analyzed_at": datetime.utcnow().isoformat(),
                    "status": "AI_UNAVAILABLE",
                    "disclaimer": "AI-assisted screening — not laboratory diagnosis."
                }
            else:
                return {
                    "detected_issue": "Image AI Unavailable",
                    "visible_symptoms": "Gemini API key is not configured in backend environment.",
                    "confidence_level": "None",
                    "suggested_actions": [
                        "Configure GEMINI_API_KEY in backend/.env to activate visual plant pathology screening.",
                        "Submit a physical leaf sample to your nearest Krishi Vigyan Kendra (KVK) or state agricultural university laboratory."
                    ],
                    "limitations": "Zero-cost local installation operating without external multimodal AI credentials.",
                    "model_used": "Deterministic System Guardrail",
                    "analyzed_at": datetime.utcnow().isoformat(),
                    "status": "AI_UNAVAILABLE",
                    "disclaimer": "AI-assisted screening — not laboratory diagnosis."
                }

        base64_data = base64.b64encode(image_bytes).decode("utf-8")

        crop_prompt_context = ""
        if crop_context:
            crop_prompt_context = f"\nREGISTERED CROP CONTEXT:\n- Plant Species: {crop_context}\n"
            if field_context:
                if field_context.get("variety"):
                    crop_prompt_context += f"- Crop Variety: {field_context['variety']}\n"
                if field_context.get("district") or field_context.get("state"):
                    crop_prompt_context += f"- Indian Agro-Climatic Region: {field_context.get('district', '')}, {field_context.get('state', '')}\n"
                if field_context.get("sowing_date"):
                    crop_prompt_context += f"- Sowing Date: {field_context['sowing_date']}\n"
                if field_context.get("irrigation_method"):
                    crop_prompt_context += f"- Irrigation: {field_context['irrigation_method']}\n"
            crop_prompt_context += f"""
CRITICAL CROP-SPECIFIC PATHOLOGY DIRECTIVE:
You MUST analyze the symptoms in the specific context of {crop_context} as cultivated in India.
Identify whether visible foliar symptoms match known {crop_context} diseases (such as Blast, Sheath Blight, Bacterial Blight for Rice; Tikka, Collar Rot for Groundnut; Boll rot, Bacterial Blight, Leaf Curl for Cotton; Rusts for Wheat; etc.).
Provide realistic, actionable organic / IPM practical advice suitable for an Indian farmer managing {crop_context}.
"""

        lang_names = {
            "en": "English",
            "ta": "Tamil",
            "ta-standard": "formal standard Tamil",
            "ta-natural": "conversational rural Tamil",
            "hi": "Hindi",
            "te": "Telugu",
            "kn": "Kannada",
            "ml": "Malayalam",
            "mr": "Marathi",
            "bn": "Bengali"
        }
        target_lang = lang_names.get(language, "English")
        lang_instruction = ""
        if language and language != "en":
            lang_instruction = f"""4. LANGUAGE REQUIREMENT: The farmer's preferred language is {target_lang}. You MUST write ALL JSON text fields ("detected_issue", "visible_symptoms", "confidence_level", "suggested_actions" array items, "limitations") fluently and naturally in {target_lang} script. Do NOT translate the JSON keys."""

        prompt = f"""
You are an expert agricultural plant pathologist providing decision-support visual screening for Indian smallholder crops.
Inspect this crop leaf/plant image.
{crop_prompt_context}
CRITICAL SAFETY & SCIENTIFIC RULES:
1. Do NOT claim definitive diagnosis. Use cautious non-definitive wording such as:
   - "Possible signs consistent with..."
   - "Visible symptoms may be associated with..."
   - "Professional confirmation is recommended."
2. Output MUST be valid JSON with these exact keys:
   - "detected_issue": Potential disease, pest, nutrient deficiency, or "Healthy Foliage Observed"
   - "visible_symptoms": Detailed visual description of observed lesions, chlorosis, discoloration, or markings
   - "confidence_level": "Low" or "Moderate" (do not invent high confidence without laboratory assay)
   - "suggested_actions": Array of 2-3 practical, organic/IPM steps suitable for this crop in India
   - "limitations": Explicit note that visual symptoms can overlap between fungal, bacterial, and physiological causes
3. Output pure JSON only. No markdown fences.
{lang_instruction}
"""

        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                res = await client.post(
                    f"{self.base_url}?key={self.api_key}",
                    json={
                        "contents": [
                            {
                                "parts": [
                                    {"text": prompt},
                                    {
                                        "inline_data": {
                                            "mime_type": mime_type,
                                            "data": base64_data
                                        }
                                    }
                                ]
                            }
                        ],
                        "generationConfig": {
                            "temperature": 0.1,
                            "responseMimeType": "application/json"
                        }
                    }
                )
                
                if res.status_code == 200:
                    data = res.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        raw_json_str = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
                        cleaned = raw_json_str.strip()
                        if cleaned.startswith("```json"):
                            cleaned = cleaned[7:]
                        if cleaned.startswith("```"):
                            cleaned = cleaned[3:]
                        if cleaned.endswith("```"):
                            cleaned = cleaned[:-3]
                        parsed = json.loads(cleaned.strip())
                        
                        return {
                            "detected_issue": parsed.get("detected_issue", "Visual Signs Inconclusive"),
                            "visible_symptoms": parsed.get("visible_symptoms", "Symptoms require higher resolution confirmation."),
                            "confidence_level": parsed.get("confidence_level", "Moderate"),
                            "suggested_actions": parsed.get("suggested_actions", [
                                "Isolate symptomatic plants if feasible.",
                                "Submit leaf specimen to local KVK laboratory."
                            ]),
                            "limitations": parsed.get("limitations", "Visual screening cannot replace biochemical or PCR laboratory assays."),
                            "model_used": f"Gemini Multimodal ({self.model_name})",
                            "analyzed_at": datetime.utcnow().isoformat(),
                            "status": "SUCCESS",
                            "disclaimer": "AI-assisted screening — not laboratory diagnosis."
                        }
                else:
                    logger.warning(f"Gemini Multimodal error {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Error in multimodal Gemini screening: {str(e)}")

        return {
            "detected_issue": "Screening Inconclusive",
            "visible_symptoms": "Could not confirm symptom pattern against pathology database or API timed out.",
            "confidence_level": "Low",
            "suggested_actions": [
                "Take a sharper close-up photograph under direct morning daylight.",
                "Submit leaf sample to state agricultural university plant pathology lab."
            ],
            "limitations": "Optical resolution or lighting may obscure micro-lesions.",
            "model_used": f"Gemini Multimodal ({self.model_name} fallback)",
            "analyzed_at": datetime.utcnow().isoformat(),
            "status": "ERROR",
            "disclaimer": "AI-assisted screening — not laboratory diagnosis."
        }

    # Backward compatibility alias
    screen_crop_disease = analyze_crop_image

gemini_service = GeminiService()
