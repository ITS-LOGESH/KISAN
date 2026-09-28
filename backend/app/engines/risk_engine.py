from typing import Dict, Any, List, Optional
from datetime import datetime

class RiskEngine:
    """
    Transparent, deterministic agricultural risk engine.
    Zero fabricated numbers: uses strictly explicit evidence and honest 'CANNOT_DETERMINE' fallbacks.
    """

    @classmethod
    def evaluate(
        cls,
        field_name: str,
        crop_type: str,
        weather: Dict[str, Any],
        satellite: Dict[str, Any],
        soil: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        risks = []
        
        # 1. Heat Stress Risk
        risks.append(cls._evaluate_heat_stress(crop_type, weather))
        
        # 2. Heavy Rainfall / Waterlogging Risk
        risks.append(cls._evaluate_rainfall_risk(crop_type, weather))
        
        # 3. Drought / Water Stress Risk
        risks.append(cls._evaluate_water_stress(crop_type, weather, satellite, soil))
        
        # 4. Irrigation Decision Risk
        risks.append(cls._evaluate_irrigation_risk(weather))
        
        # 5. Vegetation Decline Risk
        risks.append(cls._evaluate_vegetation_decline(satellite))

        return risks

    @classmethod
    def _evaluate_heat_stress(cls, crop_type: str, weather: Dict[str, Any]) -> Dict[str, Any]:
        temp = weather.get("temperature_c")
        retrieved_at = weather.get("retrieved_at", "Recent")
        
        if temp is None:
            return {
                "category": "HEAT_STRESS",
                "level": "CANNOT_DETERMINE",
                "what_risk": "Heat Stress Status Indeterminate",
                "why_evidence": "Current temperature observation is unavailable from the meteorological provider.",
                "data_used": "Open-Meteo 2m Air Temperature",
                "data_date": retrieved_at,
                "limitations": "Requires live air temperature telemetry."
            }

        # Crop specific sensitivities
        high_threshold = 36.0 if "wheat" in crop_type.lower() else 39.0
        med_threshold = 31.0 if "wheat" in crop_type.lower() else 34.0

        if temp >= high_threshold:
            return {
                "category": "HEAT_STRESS",
                "level": "HIGH",
                "what_risk": f"Severe Heat Stress Threat for {crop_type}",
                "why_evidence": f"Ambient temperature is {temp}°C, exceeding the physiological tolerance threshold ({high_threshold}°C) for {crop_type}.",
                "data_used": "Open-Meteo Current 2m Temperature",
                "data_date": retrieved_at,
                "limitations": "Crop micro-canopy temperature may vary based on soil moisture and wind turbulence."
            }
        elif temp >= med_threshold:
            return {
                "category": "HEAT_STRESS",
                "level": "MEDIUM",
                "what_risk": f"Moderate Heat Stress Alert for {crop_type}",
                "why_evidence": f"Current temperature is {temp}°C. Prolonged midday exposure may induce stomatal closure and pollen sterility.",
                "data_used": "Open-Meteo Current 2m Temperature",
                "data_date": retrieved_at,
                "limitations": "Solar radiation intensity and relative humidity also modulate actual crop thermal load."
            }
        else:
            return {
                "category": "HEAT_STRESS",
                "level": "LOW",
                "what_risk": "Thermal Conditions Within Safe Agronomic Envelope",
                "why_evidence": f"Current temperature of {temp}°C is within standard physiological growing range.",
                "data_used": "Open-Meteo Current 2m Temperature",
                "data_date": retrieved_at,
                "limitations": "Night-time temperature fluctuations are not factored into this single-point check."
            }

    @classmethod
    def _evaluate_rainfall_risk(cls, crop_type: str, weather: Dict[str, Any]) -> Dict[str, Any]:
        daily_forecast = weather.get("daily_forecast", [])
        retrieved_at = weather.get("retrieved_at", "Recent")
        
        if not daily_forecast:
            return {
                "category": "HEAVY_RAINFALL",
                "level": "CANNOT_DETERMINE",
                "what_risk": "Precipitation Risk Indeterminate",
                "why_evidence": "Multi-day quantitative precipitation forecast is currently unavailable.",
                "data_used": "Open-Meteo Daily Numerical Forecast",
                "data_date": retrieved_at,
                "limitations": "Forecast model run unavailable or connection timed out."
            }

        # Check next 48h expected rain
        rain_48h = sum([d.get("precipitation_sum", 0.0) for d in daily_forecast[:2]])
        max_prob = max([d.get("precipitation_probability_max", 0) for d in daily_forecast[:2]], default=0)

        # Paddy is flood tolerant; pulses, wheat, cotton are sensitive to waterlogging
        is_waterlogging_sensitive = any(c in crop_type.lower() for c in ["wheat", "cotton", "groundnut", "millet", "gram"])

        if rain_48h >= 45.0 or (rain_48h >= 30.0 and is_waterlogging_sensitive):
            return {
                "category": "HEAVY_RAINFALL",
                "level": "HIGH",
                "what_risk": f"Waterlogging & Leaching Hazard for {crop_type}",
                "why_evidence": f"Next 48-hour cumulative precipitation forecast is {rain_48h:.1f} mm (peak probability: {max_prob}%).",
                "data_used": "Open-Meteo 48-hour Cumulative Forecast",
                "data_date": retrieved_at,
                "limitations": "Localized topography, field drainage channels, and soil infiltration capacity govern on-ground waterlogging severity."
            }
        elif rain_48h >= 15.0 or max_prob >= 65:
            return {
                "category": "HEAVY_RAINFALL",
                "level": "MEDIUM",
                "what_risk": "Moderate Precipitation Expected",
                "why_evidence": f"Forecast indicates {rain_48h:.1f} mm rain over 48 hours (max probability {max_prob}%).",
                "data_used": "Open-Meteo Precipitation Forecast",
                "data_date": retrieved_at,
                "limitations": "Spatial distribution of convective precipitation may differ between village plots."
            }
        else:
            return {
                "category": "HEAVY_RAINFALL",
                "level": "LOW",
                "what_risk": "Minimal Heavy Rainfall Hazard",
                "why_evidence": f"Negligible or light precipitation forecast ({rain_48h:.1f} mm over 48h).",
                "data_used": "Open-Meteo Precipitation Forecast",
                "data_date": retrieved_at,
                "limitations": "Unpredicted localized cloud formations may still cause sudden showers."
            }

    @classmethod
    def _evaluate_water_stress(
        cls,
        crop_type: str,
        weather: Dict[str, Any],
        satellite: Dict[str, Any],
        soil: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        sat_status = satellite.get("status")
        ndvi = satellite.get("ndvi")
        sat_date = satellite.get("observation_date", "N/A")
        
        daily_forecast = weather.get("daily_forecast", [])
        expected_rain_7d = sum([d.get("precipitation_sum", 0.0) for d in daily_forecast])

        if sat_status != "AVAILABLE" or ndvi is None:
            return {
                "category": "DROUGHT_WATER_STRESS",
                "level": "CANNOT_DETERMINE",
                "what_risk": "Crop Water Stress Cannot Be Conclusively Determined",
                "why_evidence": f"Satellite optical observation unavailable ({satellite.get('reason', 'cloud cover or archive gap')}). In-situ soil moisture sensors absent.",
                "data_used": "Sentinel-2 / Landsat Registry",
                "data_date": sat_date or "Unavailable",
                "limitations": "Accurate crop drought stress requires either clear spectral index or calibrated capacitance soil moisture probe."
            }

        # If satellite NDVI is available
        if ndvi < 0.35 and expected_rain_7d < 10.0:
            return {
                "category": "DROUGHT_WATER_STRESS",
                "level": "HIGH",
                "what_risk": f"High Crop Water Deficit / Canopy Stress in {crop_type}",
                "why_evidence": f"Sentinel-2 NDVI is depressed at {ndvi:.2f} and next 7-day precipitation forecast is only {expected_rain_7d:.1f} mm.",
                "data_used": f"Sentinel-2 L2A (NDVI: {ndvi:.2f}) + Open-Meteo 7-day Forecast",
                "data_date": str(sat_date),
                "limitations": "Low NDVI can also occur during early vegetative emergence or post-harvest residue periods."
            }
        elif ndvi < 0.50 and expected_rain_7d < 15.0:
            return {
                "category": "DROUGHT_WATER_STRESS",
                "level": "MEDIUM",
                "what_risk": "Potential Incipient Moisture Stress",
                "why_evidence": f"NDVI is {ndvi:.2f} with modest forward precipitation ({expected_rain_7d:.1f} mm).",
                "data_used": "Sentinel-2 Surface Reflectance + Forecast",
                "data_date": str(sat_date),
                "limitations": "Field soil type water retention modifies stress emergence."
            }
        else:
            return {
                "category": "DROUGHT_WATER_STRESS",
                "level": "LOW",
                "what_risk": "Adequate Canopy Hydration & Greenness",
                "why_evidence": f"Vegetation index (NDVI: {ndvi:.2f}) reflects healthy photosynthetic canopy activity.",
                "data_used": "Sentinel-2 Optical NDVI",
                "data_date": str(sat_date),
                "limitations": "Surface canopy greenness can trail deep root zone moisture depletion by several days."
            }

    @classmethod
    def _evaluate_irrigation_risk(cls, weather: Dict[str, Any]) -> Dict[str, Any]:
        precip_prob = weather.get("precipitation_probability_pct")
        precip_mm = weather.get("precipitation_mm", 0.0)
        daily_forecast = weather.get("daily_forecast", [])
        tomorrow_prob = daily_forecast[0].get("precipitation_probability_max", 0) if daily_forecast else 0
        tomorrow_rain = daily_forecast[0].get("precipitation_sum", 0.0) if daily_forecast else 0.0
        retrieved_at = weather.get("retrieved_at", "Recent")

        if precip_prob is None and not daily_forecast:
            return {
                "category": "IRRIGATION_RISK",
                "level": "CANNOT_DETERMINE",
                "what_risk": "Irrigation Timing Risk Cannot Be Determined",
                "why_evidence": "Short-term precipitation probability telemetry is currently missing.",
                "data_used": "Open-Meteo Forecast",
                "data_date": retrieved_at,
                "limitations": "Irrigation recommendations require reliable precipitation forecast data."
            }

        effective_prob = max(precip_prob or 0, tomorrow_prob)
        effective_rain = max(precip_mm or 0.0, tomorrow_rain)

        if effective_prob >= 70 and effective_rain >= 10.0:
            return {
                "category": "IRRIGATION_RISK",
                "level": "HIGH",
                "what_risk": "High Risk of Wasteful / Detrimental Immediate Irrigation",
                "why_evidence": f"Imminent rainfall predicted ({effective_rain:.1f} mm, {effective_prob}% probability). Irrigating today risks water wastage and root rot.",
                "data_used": "Open-Meteo Short-Term Precipitation Probability",
                "data_date": retrieved_at,
                "limitations": "Timing of shower bursts may shift; monitor sky conditions before starting pumps."
            }
        elif effective_prob >= 40:
            return {
                "category": "IRRIGATION_RISK",
                "level": "MEDIUM",
                "what_risk": "Moderate Irrigation Timing Uncertainty",
                "why_evidence": f"Precipitation probability is {effective_prob}%. Delaying non-critical irrigation by 24 hours is advisable.",
                "data_used": "Open-Meteo Hourly Probability",
                "data_date": retrieved_at,
                "limitations": "Scattered showers may bypass field boundary."
            }
        else:
            return {
                "category": "IRRIGATION_RISK",
                "level": "LOW",
                "what_risk": "Favorable Window for Scheduled Irrigation",
                "why_evidence": f"Rain probability is low ({effective_prob}%). Irrigation water will be efficiently utilized without displacement.",
                "data_used": "Open-Meteo Forecast",
                "data_date": retrieved_at,
                "limitations": "Ensure irrigation matches specific crop growth stage water requirements."
            }

    @classmethod
    def _evaluate_vegetation_decline(cls, satellite: Dict[str, Any]) -> Dict[str, Any]:
        sat_status = satellite.get("status")
        sat_date = satellite.get("observation_date", "N/A")
        trend = satellite.get("vegetation_trend")
        condition = satellite.get("vegetation_condition")
        ndvi = satellite.get("ndvi")

        if sat_status != "AVAILABLE" or ndvi is None:
            return {
                "category": "VEGETATION_DECLINE",
                "level": "CANNOT_DETERMINE",
                "what_risk": "Vegetation Biomass Trend Indeterminate",
                "why_evidence": f"No recent cloud-free satellite observation. Status: {sat_status}. {satellite.get('reason', '')}",
                "data_used": "Sentinel-2 / Landsat Public STAC Archive",
                "data_date": str(sat_date or "Unavailable"),
                "limitations": "Optical Earth observation cannot penetrate dense monsoon cloud layers without SAR (Sentinel-1)."
            }

        if trend == "Declining" or (ndvi is not None and ndvi < 0.30):
            return {
                "category": "VEGETATION_DECLINE",
                "level": "HIGH",
                "what_risk": "Rapid Decline in Canopy Vigour",
                "why_evidence": f"Observed NDVI has dropped to {ndvi:.2f}. Condition is classified as {condition}.",
                "data_used": "Sentinel-2 Multi-Spectral Surface Reflectance",
                "data_date": str(sat_date),
                "limitations": "Index decline may also reflect planned harvesting, pest infestation, or natural senescence."
            }
        else:
            return {
                "category": "VEGETATION_DECLINE",
                "level": "LOW",
                "what_risk": "Vegetation Vigour Maintained",
                "why_evidence": f"Vegetation index (NDVI {ndvi:.2f}) indicates steady photosynthetic activity and canopy density.",
                "data_used": "Sentinel-2 Multi-Spectral Surface Reflectance",
                "data_date": str(sat_date),
                "limitations": "Sub-canopy pest or weed dynamics cannot be resolved by 10m satellite pixels."
            }
