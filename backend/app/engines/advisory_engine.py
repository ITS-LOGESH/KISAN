from typing import Dict, Any, List, Optional
from datetime import datetime

class AdvisoryEngine:
    """
    Agricultural Advisory Engine translating meteorological and environmental signals
    into actionable farmer decision support, while clearly separating general guidance
    from field-specific recommendations.
    """

    @classmethod
    def generate_advisories(
        cls,
        crop_type: str,
        weather: Dict[str, Any],
        satellite: Dict[str, Any],
        soil: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        advisories = []
        
        # 1. Irrigation Advisory
        advisories.append(cls._irrigation_advisory(crop_type, weather))
        
        # 2. Spraying & Agrochemical Application Advisory
        advisories.append(cls._spraying_advisory(weather))
        
        # 3. Heat & Canopy Management Advisory
        advisories.append(cls._thermal_management_advisory(crop_type, weather))
        
        # 4. Nutrient & Soil Management Advisory
        advisories.append(cls._soil_nutrient_advisory(crop_type, weather, soil))
        
        return [adv for adv in advisories if adv is not None]

    @classmethod
    def _irrigation_advisory(cls, crop_type: str, weather: Dict[str, Any]) -> Dict[str, Any]:
        precip_prob = weather.get("precipitation_probability_pct") or 0
        precip_mm = weather.get("precipitation_mm") or 0.0
        daily = weather.get("daily_forecast", [])
        next_day_rain = daily[0].get("precipitation_sum", 0.0) if daily else 0.0
        next_day_prob = daily[0].get("precipitation_probability_max", 0) if daily else 0
        
        max_prob = max(precip_prob, next_day_prob)
        total_rain = precip_mm + next_day_rain

        if max_prob >= 60 or total_rain >= 15.0:
            return {
                "category": "IRRIGATION",
                "title": "Postpone Irrigation Due to Expected Rain",
                "recommendation": f"Postpone field irrigation for the next 24-48 hours. Numerical forecast indicates {total_rain:.1f} mm rain with {max_prob}% probability. Delaying irrigation prevents waterlogging, root asphyxiation, and energy waste.",
                "priority": "HIGH",
                "factors_used": [
                    f"Forecast Precipitation: {total_rain:.1f} mm",
                    f"Rain Probability: {max_prob}%"
                ],
                "data_sources": ["Open-Meteo Short-Range Meteorological Forecast"],
                "limitations": "Summer convective storms may be patchy; verify darkening skies and local barometer if available."
            }
        elif max_prob >= 35:
            return {
                "category": "IRRIGATION",
                "title": "Light / Controlled Irrigation Recommended",
                "recommendation": "Maintain moderate soil moisture. Marginal chance of rain exists; avoid deep canal inundation to allow capacity for possible showers.",
                "priority": "MEDIUM",
                "factors_used": [f"Precipitation Probability: {max_prob}%"],
                "data_sources": ["Open-Meteo Hourly Forecast"],
                "limitations": "Crop root depth and field slope determine exact water retention."
            }
        else:
            return {
                "category": "IRRIGATION",
                "title": "Proceed With Standard Crop Irrigation Cycle",
                "recommendation": f"Low probability of rain ({max_prob}%). Proceed with standard irrigation schedule for {crop_type}, preferably during early morning or evening hours to minimize evapotranspiration losses.",
                "priority": "LOW",
                "factors_used": [f"Low Rain Probability: {max_prob}%", "Favorable Evaporation Window"],
                "data_sources": ["Open-Meteo Forecast"],
                "limitations": "Ensure irrigation volume matches current crop phenological stage."
            }

    @classmethod
    def _spraying_advisory(cls, weather: Dict[str, Any]) -> Dict[str, Any]:
        wind_speed = weather.get("wind_speed_kmh")
        precip_prob = weather.get("precipitation_probability_pct") or 0
        
        if wind_speed is None:
            return {
                "category": "SPRAYING",
                "title": "Spray Conditions Indeterminate",
                "recommendation": "Wind speed data unavailable. Test localized wind with a windsock or leaf drift before applying any foliar spray.",
                "priority": "LOW",
                "factors_used": ["Wind Speed: Unavailable"],
                "data_sources": ["Open-Meteo"],
                "limitations": "Local terrain creates wind turbulence not captured at grid scale."
            }

        if wind_speed > 16.0:
            return {
                "category": "SPRAYING",
                "title": "Suspend Chemical Spraying (Drift Hazard)",
                "recommendation": f"Wind speed is currently {wind_speed:.1f} km/h, which exceeds the safe threshold (15 km/h). Suspend all pesticide/herbicide spraying to avoid off-target drift, chemical wastage, and environmental contamination.",
                "priority": "HIGH",
                "factors_used": [f"Wind Speed: {wind_speed:.1f} km/h (>15 km/h threshold)"],
                "data_sources": ["Open-Meteo 10m Wind Telemetry"],
                "limitations": "Wind gusts may spike higher than mean hourly speed."
            }
        elif precip_prob > 50:
            return {
                "category": "SPRAYING",
                "title": "Avoid Foliar Spraying (Wash-off Risk)",
                "recommendation": f"Rain probability is {precip_prob}%. Avoid applying foliar fertilizers or systemic fungicides, as rainfall within 4 hours will wash off active ingredients.",
                "priority": "MEDIUM",
                "factors_used": [f"Rain Probability: {precip_prob}%"],
                "data_sources": ["Open-Meteo Precipitation Forecast"],
                "limitations": "Systemic products with rain-fast stickers may have specific manufacturer windows."
            }
        else:
            return {
                "category": "SPRAYING",
                "title": "Safe Window for Agro-Chemical / Foliar Applications",
                "recommendation": f"Wind speeds are calm ({wind_speed:.1f} km/h) and rainfall probability is low ({precip_prob}%). Suitable window for foliar nourishment or bio-pesticide application.",
                "priority": "LOW",
                "factors_used": [f"Wind Speed: {wind_speed:.1f} km/h", f"Rain Probability: {precip_prob}%"],
                "data_sources": ["Open-Meteo Current Conditions"],
                "limitations": "Wear appropriate personal protective equipment (PPE) during all chemical handling."
            }

    @classmethod
    def _thermal_management_advisory(cls, crop_type: str, weather: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        temp = weather.get("temperature_c")
        if temp is None:
            return None

        if temp >= 37.0:
            return {
                "category": "MONITORING",
                "title": "Heat Stress Mitigation Required",
                "recommendation": f"Extreme daytime temperature ({temp:.1f}°C) detected. Apply light frequent sprinkler irrigations during peak afternoon hours to suppress canopy temperature. Maintain organic mulch on bed ridges.",
                "priority": "HIGH",
                "factors_used": [f"High Ambient Temperature: {temp:.1f}°C"],
                "data_sources": ["Open-Meteo Real-Time Telemetry"],
                "limitations": "Over-irrigating under heat can induce root oxygen starvation."
            }
        return None

    @classmethod
    def _soil_nutrient_advisory(
        cls,
        crop_type: str,
        weather: Dict[str, Any],
        soil: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        soil_source = soil.get("source_type") if soil else "UNAVAILABLE"
        oc = soil.get("organic_carbon_pct") if soil else None
        
        if soil_source in ("MEASURED", "USER_PROVIDED") and oc is not None:
            if oc < 0.50:
                rec = f"Soil test indicates low organic carbon ({oc}%). Apply 5-8 tonnes/ha farmyard manure (FYM) or vermicompost before next sowing to restore microbial biomass and cation exchange capacity."
                prio = "MEDIUM"
            else:
                rec = f"Soil organic carbon is satisfactory ({oc}%). Continue crop residue incorporation and balanced NPK dosing as per soil health test."
                prio = "LOW"
            return {
                "category": "FERTILIZATION",
                "title": "Soil Health & Nutrient Balancing",
                "recommendation": rec,
                "priority": prio,
                "factors_used": [f"Organic Carbon: {oc}%", f"Data Type: {soil_source}"],
                "data_sources": [f"Soil Health Card: {soil.get('source_name', 'Lab Test')}"],
                "limitations": "Soil tests reflect sample date and should be refreshed every 2 crop cycles."
            }
        else:
            return {
                "category": "FERTILIZATION",
                "title": "Soil Nutrient Advisory (General Basal Guidance)",
                "recommendation": "No lab soil test on record. Apply standardized state university basal NPK package for your district. We strongly recommend conducting a laboratory soil test at your nearest KVK or Soil Testing Lab to avoid wasteful fertilizer application.",
                "priority": "LOW",
                "factors_used": ["Soil Data: UNAVAILABLE (Generic regional profile applied)"],
                "data_sources": ["ICAR General Agronomy Guidelines"],
                "limitations": "Specific dosage cannot be personalized without actual soil chemical analysis."
            }

    @classmethod
    def get_regenerative_guidance(
        cls,
        crop_type: str,
        soil: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Regenerative agriculture advisory module.
        Strictly distinguishes GENERAL GUIDANCE from FIELD-SPECIFIC RECOMMENDATION.
        """
        has_field_soil = soil and soil.get("source_type") in ("MEASURED", "USER_PROVIDED")
        oc = soil.get("organic_carbon_pct") if has_field_soil else None
        texture = soil.get("texture") if has_field_soil else None

        guidance_modules = [
            {
                "topic": "Crop Residue Management (Zero-Burning)",
                "general_guidance": "Incorporate harvest stubbles using a Happy Seeder or Super Seeder instead of open-field residue burning. Retaining residue on soil surface cuts evaporation by 20-30% and recycles ~15-20 kg/ha potassium.",
                "field_specific_recommendation": (
                    f"For your {crop_type} crop: After harvest, chop and mulch straw across the soil bed. In {texture or 'this soil'}, surface residue will preserve residual moisture for the succeeding crop."
                    if has_field_soil else
                    "Field-specific residue recommendation requires verified soil texture and rotation history."
                ),
                "soil_benefit": "Enhances soil organic carbon, prevents surface crusting, and fosters earthworm populations.",
                "water_benefit": "Reduces solar soil evaporation and increases rainwater infiltration rate.",
                "data_backing": "ICAR-CSSRI Conservation Agriculture Research Findings."
            },
            {
                "topic": "Legume Intercropping & Biological Nitrogen Fixation",
                "general_guidance": "Introduce pulse intercrops (e.g. cowpea, green gram, black gram) in wider row plantings. Rhizobium symbiosis fixes 30-50 kg atmospheric nitrogen per hectare.",
                "field_specific_recommendation": (
                    f"Given your current soil test (OC: {oc or 'N/A'}%), intercropping short-duration cowpea with {crop_type} will supplement nitrogen naturally while providing an additional cash harvest."
                    if has_field_soil else
                    "General principle: Intercrop legumes where row spacing allows."
                ),
                "soil_benefit": "Fixes atmospheric nitrogen into bioavailable ammonium; improves micro-nutrient availability.",
                "water_benefit": "Living canopy cover intercepts raindrops, reducing soil erosion during heavy downpours.",
                "data_backing": "Indian Institute of Pulses Research (IIPR) Agronomy Trials."
            },
            {
                "topic": "Reduced Tillage & Cover Cropping",
                "general_guidance": "Minimize excessive deep ploughing. Intensive tillage destroys soil aggregate stability and oxidizes organic carbon into atmospheric CO2.",
                "field_specific_recommendation": (
                    "Switching to zero-till or strip-till will conserve moisture and fuel costs."
                    if has_field_soil else
                    "Field-specific tillage protocol depends on previous compaction depth and weed pressure."
                ),
                "soil_benefit": "Protects mycorrhizal fungal networks and maintains natural pore connectivity.",
                "water_benefit": "Improves soil hydraulic conductivity and drought resilience.",
                "data_backing": "FAO Global Soil Partnership & ICAR Guidelines."
            },
            {
                "topic": "Bio-Fertilizer & Organic Manuring",
                "general_guidance": "Inoculate seeds with Azotobacter / Azospirillum and Phosphate Solubilizing Bacteria (PSB) before sowing. Apply composted FYM enriched with Trichoderma.",
                "field_specific_recommendation": (
                    f"Your field test shows pH {soil.get('ph', 'N/A')}. PSB inoculation will solubilize fixed phosphorus in this soil range."
                    if has_field_soil and soil.get('ph') else
                    "Standard recommendation: Inoculate seeds with bio-fertilizers at 250g per 10kg seed."
                ),
                "soil_benefit": "Mobilizes bound phosphorus and balances biological soil microbial flora.",
                "water_benefit": "Higher organic matter increases field water holding capacity by up to 20%.",
                "data_backing": "National Centre of Organic Farming (NCOF) Technical Standards."
            }
        ]
        
        return guidance_modules
