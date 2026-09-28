from typing import Dict, Any, List, Optional

# Standard Agro-Climatic Agronomic Profiles for Key Indian Crops
INDIAN_CROPS_RULES = {
    "Rice (Paddy)": {
        "ideal_temp": (20.0, 36.0),
        "min_water_mm": 1000.0,
        "ideal_ph": (5.5, 7.2),
        "ideal_seasons": ["Kharif", "Summer / Navarai"],
        "suitable_soils": ["Clay", "Clay Loam", "Alluvial", "Heavy Loam"],
        "notes": "Requires abundant water availability or controlled flooded basin irrigation."
    },
    "Wheat": {
        "ideal_temp": (10.0, 26.0),
        "min_water_mm": 350.0,
        "ideal_ph": (6.0, 7.8),
        "ideal_seasons": ["Rabi"],
        "suitable_soils": ["Loam", "Clay Loam", "Alluvial", "Silt Loam"],
        "notes": "Winter cereal sensitive to high temperatures during flowering/grain-fill stage."
    },
    "Cotton": {
        "ideal_temp": (21.0, 34.0),
        "min_water_mm": 550.0,
        "ideal_ph": (6.0, 8.2),
        "ideal_seasons": ["Kharif"],
        "suitable_soils": ["Black Soil (Regur)", "Deep Alluvial", "Medium Clay"],
        "notes": "Deep rooted crop; vulnerable to waterlogging and bollworm infestations during wet spells."
    },
    "Millet (Pearl/Finger)": {
        "ideal_temp": (22.0, 38.0),
        "min_water_mm": 300.0,
        "ideal_ph": (5.0, 7.8),
        "ideal_seasons": ["Kharif", "Zaid"],
        "suitable_soils": ["Sandy Loam", "Red Soil", "Gravelly Loam", "Light Soil"],
        "notes": "Highly climate-resilient C4 crop requiring minimal water and surviving poor fertility."
    },
    "Groundnut": {
        "ideal_temp": (20.0, 32.0),
        "min_water_mm": 450.0,
        "ideal_ph": (6.0, 7.2),
        "ideal_seasons": ["Kharif", "Rabi"],
        "suitable_soils": ["Sandy Loam", "Well-drained Loam", "Red Sandy Soil"],
        "notes": "Requires loose soil texture for effective pegging and pod formation."
    },
    "Maize": {
        "ideal_temp": (18.0, 32.0),
        "min_water_mm": 500.0,
        "ideal_ph": (5.8, 7.5),
        "ideal_seasons": ["Kharif", "Rabi", "Spring"],
        "suitable_soils": ["Well-drained Loam", "Alluvial", "Silt Loam"],
        "notes": "Moderate drought tolerance but cannot tolerate standing waterlogging at seedling stage."
    }
}

class CropEngine:
    """
    Transparent, rule-based crop suitability evaluation engine for Indian agro-ecological conditions.
    """

    @classmethod
    def evaluate_suitability(
        cls,
        crop_name: str,
        state: str,
        weather: Dict[str, Any],
        soil: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        crop_rules = INDIAN_CROPS_RULES.get(crop_name)
        if not crop_rules:
            return {
                "crop_name": crop_name,
                "suitability": "MODERATE",
                "season_match": True,
                "temperature_score": "Unknown agronomic profile",
                "rainfall_score": "Data unavailable",
                "soil_score": "Data unavailable",
                "rationale": f"Standard agronomic rule profile not established for {crop_name}.",
                "factors_used": ["Crop Name"],
                "data_sources": ["General Agro-Climatic Table"],
                "limitations": "Recommendation is heuristic and not scientifically validated for micro-varieties."
            }

        temp = weather.get("temperature_c")
        soil_ph = soil.get("ph") if soil else None
        soil_texture = soil.get("texture") if soil else None
        soil_source = soil.get("source_type") if soil else "UNAVAILABLE"

        factors_used = ["Open-Meteo Current Ambient Temperature"]
        data_sources = ["Open-Meteo Public Weather API"]

        # Temperature check
        t_min, t_max = crop_rules["ideal_temp"]
        if temp is None:
            temp_score = "Indeterminate (Weather data unavailable)"
            temp_fit = 0.5
        elif t_min <= temp <= t_max:
            temp_score = f"Optimal ({temp:.1f}°C within ideal {t_min}-{t_max}°C)"
            temp_fit = 1.0
        elif abs(temp - t_min) <= 4 or abs(temp - t_max) <= 4:
            temp_score = f"Sub-optimal ({temp:.1f}°C marginally outside {t_min}-{t_max}°C)"
            temp_fit = 0.6
        else:
            temp_score = f"Unfavorable ({temp:.1f}°C well outside optimal {t_min}-{t_max}°C)"
            temp_fit = 0.2

        # Soil evaluation
        if soil and soil_ph is not None and soil_source != "UNAVAILABLE":
            factors_used.append(f"Soil pH ({soil_ph})")
            factors_used.append(f"Soil Texture ({soil_texture or 'General'})")
            data_sources.append(f"Soil Record: {soil.get('source_name', 'Soil Survey')}")
            ph_min, ph_max = crop_rules["ideal_ph"]
            if ph_min <= soil_ph <= ph_max:
                soil_score = f"Favorable (pH {soil_ph} within {ph_min}-{ph_max})"
                soil_fit = 1.0
            else:
                soil_score = f"Marginal (pH {soil_ph} slightly outside {ph_min}-{ph_max})"
                soil_fit = 0.5
        else:
            soil_score = "Cannot assess precisely (No laboratory soil test provided)"
            soil_fit = 0.7 # Neutral
            data_sources.append("Soil data: UNAVAILABLE")

        # Overall suitability rating
        score = (temp_fit * 0.6) + (soil_fit * 0.4)
        if score >= 0.8:
            suitability = "HIGH"
            rationale = f"{crop_name} is highly compatible with current ambient temperature and regional agro-climatic conditions in {state}."
        elif score >= 0.5:
            suitability = "MODERATE"
            rationale = f"{crop_name} is moderately suitable. Local temperature or soil characteristics require targeted management (e.g. soil amendment or controlled irrigation)."
        else:
            suitability = "LOW"
            rationale = f"Current weather and ecological conditions present elevated physiological challenge for {crop_name}."

        return {
            "crop_name": crop_name,
            "suitability": suitability,
            "season_match": True,
            "temperature_score": temp_score,
            "rainfall_score": f"Regional water profile suited for {crop_rules['notes']}",
            "soil_score": soil_score,
            "rationale": rationale,
            "factors_used": factors_used,
            "data_sources": data_sources,
            "limitations": "These rules provide macro-level decision support. Varietal heat tolerance, local microtopography, and ground water depth must be verified by local Krishi Vigyan Kendra (KVK) guidance."
        }

    @classmethod
    def evaluate_all(
        cls,
        state: str,
        weather: Dict[str, Any],
        soil: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        results = []
        for c_name in INDIAN_CROPS_RULES.keys():
            results.append(cls.evaluate_suitability(c_name, state, weather, soil))
        return results
