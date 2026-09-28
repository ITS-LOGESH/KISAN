import json
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.models import Field, Alert, SoilRecord, DiseaseAnalysis
from app.services.weather_service import weather_service
from app.services.satellite_service import satellite_service
from app.engines.risk_engine import RiskEngine

logger = logging.getLogger(__name__)

class AlertService:
    """
    Deterministic, real-data driven Farmer Alert Engine.
    Zero fabricated numbers: Alerts are generated strictly from real weather thresholds,
    modelled risk levels, verified satellite passes, actual crop sowing dates, and recorded foliar tests.
    Every alert is deduplicated via a deterministic unique fingerprint.
    """

    @classmethod
    async def evaluate_field_alerts(
        cls,
        field: Field,
        db: Session,
        weather_data: Optional[Dict[str, Any]] = None,
        satellite_data: Optional[Dict[str, Any]] = None
    ) -> List[Alert]:
        """
        Evaluate real environmental and agronomic triggers for a single field,
        storing any newly qualified alerts without duplicating existing ones.
        """
        now = datetime.utcnow()
        today_str = now.strftime("%Y-%m-%d")
        candidate_alerts: List[Dict[str, Any]] = []

        # ----------------------------------------------------
        # 1. Real Weather Alerts (Rain, High Temp, Strong Wind)
        # ----------------------------------------------------
        weather = weather_data
        if weather is None:
            try:
                weather = await weather_service.get_forecast(field.latitude, field.longitude)
            except Exception as e:
                logger.warning(f"Could not fetch weather for field {field.id} alert evaluation: {e}")
                weather = None

        if weather and weather.get("status") != "UNAVAILABLE":
            # Date of forecast
            daily = weather.get("daily_forecast") or []
            forecast_date = daily[0].get("date") if daily else today_str

            # A. Rainfall Alert
            current_prob = weather.get("precipitation_probability_pct") or 0
            current_mm = weather.get("precipitation_mm") or 0.0
            next_day_rain = daily[0].get("precipitation_sum", 0.0) if daily else 0.0
            next_day_prob = daily[0].get("precipitation_probability_max", 0) if daily else 0

            max_rain_prob = max(current_prob, next_day_prob)
            total_rain_mm = current_mm + next_day_rain

            # Threshold: Rain prob >= 70% OR Forecast Rain >= 20.0 mm
            if max_rain_prob >= 70 or total_rain_mm >= 20.0:
                is_warning = total_rain_mm >= 35.0 or max_rain_prob >= 85
                candidate_alerts.append({
                    "field_id": field.id,
                    "type": "weather",
                    "severity": "warning" if is_warning else "attention",
                    "title": "Heavy Rain Approaching" if total_rain_mm >= 25.0 else "High Rain Probability",
                    "message": f"Numerical forecast indicates {total_rain_mm:.1f} mm rain ({max_rain_prob}% probability) for {field.name}.",
                    "source": "Open-Meteo Weather Forecast",
                    "action": "Postpone field irrigation, pesticide spraying, and fertilizer broadcast to prevent runoff and waterlogging.",
                    "data_provenance": "Forecast",
                    "data_payload": json.dumps({
                        "precipitation_mm": round(total_rain_mm, 1),
                        "precipitation_probability_pct": max_rain_prob,
                        "forecast_date": forecast_date
                    }),
                    "fingerprint": f"{field.id}:weather:rain:{forecast_date}"
                })

            # B. High Temperature / Heat Stress Alert
            curr_temp = weather.get("temperature_c")
            max_daily_temp = daily[0].get("temp_max", curr_temp or 0.0) if daily else (curr_temp or 0.0)
            peak_temp = max(curr_temp or 0.0, max_daily_temp)

            is_wheat = "wheat" in (field.crop_type or "").lower()
            heat_threshold = 35.0 if is_wheat else 38.0

            if peak_temp >= heat_threshold:
                is_severe = peak_temp >= (heat_threshold + 3.0)
                candidate_alerts.append({
                    "field_id": field.id,
                    "type": "weather",
                    "severity": "warning" if is_severe else "attention",
                    "title": "High Temperature Heat Stress",
                    "message": f"Forecast peak temperature of {peak_temp:.1f}°C detected for {field.name}.",
                    "source": "Open-Meteo Weather Forecast",
                    "action": "Apply light frequent irrigation during cooler morning/evening hours and maintain soil mulching.",
                    "data_provenance": "Forecast",
                    "data_payload": json.dumps({
                        "temperature_c": round(peak_temp, 1),
                        "threshold_c": heat_threshold,
                        "forecast_date": forecast_date
                    }),
                    "fingerprint": f"{field.id}:weather:heat:{forecast_date}"
                })

            # C. High Wind Speed Alert
            curr_wind = weather.get("wind_speed_kmh") or 0.0
            if curr_wind >= 18.0:
                is_high_wind = curr_wind >= 28.0
                candidate_alerts.append({
                    "field_id": field.id,
                    "type": "weather",
                    "severity": "warning" if is_high_wind else "attention",
                    "title": "High Wind Speed Advisory",
                    "message": f"Wind speeds forecast at {curr_wind:.1f} km/h on {field.name}.",
                    "source": "Open-Meteo Weather Forecast",
                    "action": "Suspend all chemical and foliar pesticide spraying to prevent severe off-target drift.",
                    "data_provenance": "Forecast",
                    "data_payload": json.dumps({
                        "wind_speed_kmh": round(curr_wind, 1),
                        "forecast_date": forecast_date
                    }),
                    "fingerprint": f"{field.id}:weather:wind:{forecast_date}"
                })

        # ----------------------------------------------------
        # 2. Field Risk Engine Alerts
        # ----------------------------------------------------
        satellite = satellite_data
        if satellite is None:
            try:
                satellite = await satellite_service.get_metrics(field.latitude, field.longitude)
            except Exception:
                satellite = None

        soil_rec = db.query(SoilRecord).filter(SoilRecord.field_id == field.id).order_by(SoilRecord.id.desc()).first()
        soil_dict = None
        if soil_rec:
            soil_dict = {
                "source_type": soil_rec.source_type,
                "source_name": soil_rec.source_name,
                "ph": soil_rec.ph,
                "organic_carbon_pct": soil_rec.organic_carbon_pct,
                "texture": soil_rec.texture
            }

        if weather:
            try:
                risks = RiskEngine.evaluate(field.name, field.crop_type, weather, satellite or {}, soil_dict)
                for r in risks:
                    lvl = r.get("level")
                    cat = r.get("category")
                    if lvl == "HIGH":
                        candidate_alerts.append({
                            "field_id": field.id,
                            "type": "field_risk",
                            "severity": "warning",
                            "title": r.get("what_risk", "High Agricultural Risk"),
                            "message": r.get("why_evidence", "Risk factors exceed acceptable safety thresholds."),
                            "source": "Field Risk Engine",
                            "action": "Review risk mitigation steps and adjust field practices accordingly.",
                            "data_provenance": "Modeled",
                            "data_payload": json.dumps({
                                "category": cat,
                                "level": lvl,
                                "data_used": r.get("data_used")
                            }),
                            "fingerprint": f"{field.id}:risk:{cat}:{today_str}"
                        })
                    elif lvl == "MEDIUM" and cat in ("HEAT_STRESS", "HEAVY_RAINFALL", "WATER_STRESS", "IRRIGATION_RISK"):
                        candidate_alerts.append({
                            "field_id": field.id,
                            "type": "field_risk",
                            "severity": "attention",
                            "title": r.get("what_risk", "Moderate Field Risk"),
                            "message": r.get("why_evidence", "Environmental indicators require monitoring."),
                            "source": "Field Risk Engine",
                            "action": "Review recommended irrigation and canopy management actions.",
                            "data_provenance": "Modeled",
                            "data_payload": json.dumps({
                                "category": cat,
                                "level": lvl,
                                "data_used": r.get("data_used")
                            }),
                            "fingerprint": f"{field.id}:risk:{cat}:{today_str}"
                        })
            except Exception as e:
                logger.warning(f"Risk engine evaluation error for field {field.id}: {e}")

        # ----------------------------------------------------
        # 3. New Sentinel-2 Satellite Observation Alert
        # ----------------------------------------------------
        if satellite and satellite.get("status") in ("AVAILABLE", "CLOUDY"):
            obs_date = satellite.get("observation_date")
            if obs_date:
                # Format to short date if ISO string
                short_obs = obs_date.split("T")[0] if "T" in obs_date else str(obs_date)[:10]
                cloud_cover = satellite.get("cloud_cover_pct", 0.0)
                candidate_alerts.append({
                    "field_id": field.id,
                    "type": "satellite",
                    "severity": "info",
                    "title": "New Satellite Observation Available",
                    "message": f"New Sentinel-2 satellite observation ({short_obs}) available for {field.name} (cloud cover: {cloud_cover:.1f}%).",
                    "source": "Sentinel-2 Open Data",
                    "action": "View field parcel imagery in the Satellite section.",
                    "data_provenance": "Observed",
                    "data_payload": json.dumps({
                        "observation_date": short_obs,
                        "cloud_cover_pct": cloud_cover,
                        "scene_id": satellite.get("scene_id")
                    }),
                    "fingerprint": f"{field.id}:satellite:{short_obs}"
                })

        # ----------------------------------------------------
        # 4. Crop-Stage Alert (Honest milestone reminder)
        # ----------------------------------------------------
        if field.sowing_date and field.crop_type:
            age_days = (now - field.sowing_date).days
            if 0 <= age_days <= 365:
                # Milestone interval every 15 days
                milestone_period = age_days // 15
                if milestone_period > 0:
                    candidate_alerts.append({
                        "field_id": field.id,
                        "type": "crop_stage",
                        "severity": "info",
                        "title": f"Crop Stage Milestone (~{age_days} Days)",
                        "message": f"Your {field.crop_type} on {field.name} is approximately {age_days} days from recorded sowing date ({field.sowing_date.strftime('%d %b %Y')}).",
                        "source": "Crop Registry Record",
                        "action": "Inspect crop tillering, vegetative growth, and weed management for this growth stage.",
                        "data_provenance": "Estimated from Sowing Date",
                        "data_payload": json.dumps({
                            "crop_type": field.crop_type,
                            "age_days": age_days,
                            "sowing_date": field.sowing_date.strftime("%Y-%m-%d")
                        }),
                        "fingerprint": f"{field.id}:crop_stage:period_{milestone_period}"
                    })

        # ----------------------------------------------------
        # 5. Disease / Foliar Screening Alert (Recent real test)
        # ----------------------------------------------------
        latest_disease = (
            db.query(DiseaseAnalysis)
            .filter(DiseaseAnalysis.field_id == field.id)
            .order_by(DiseaseAnalysis.analyzed_at.desc())
            .first()
        )
        if latest_disease and latest_disease.analyzed_at:
            # Within past 7 days
            if (now - latest_disease.analyzed_at).days <= 7:
                issue = latest_disease.detected_issue or ""
                if issue and issue.lower() not in ("healthy", "no critical abnormality identified"):
                    action_txt = "Consult local Krishi Vigyan Kendra (KVK) for verified IPM recommendations."
                    try:
                        actions = json.loads(latest_disease.suggested_actions)
                        if isinstance(actions, list) and len(actions) > 0:
                            action_txt = actions[0]
                    except Exception:
                        if latest_disease.suggested_actions:
                            action_txt = latest_disease.suggested_actions[:200]

                    conf = latest_disease.confidence_level or "Moderate"
                    is_att = conf in ("High", "Moderate")

                    candidate_alerts.append({
                        "field_id": field.id,
                        "type": "disease",
                        "severity": "attention" if is_att else "info",
                        "title": f"Foliar Screening Alert: {issue}",
                        "message": f"Visual screening for {field.name} identified {issue} ({conf} confidence).",
                        "source": "Foliar Pathology Inspection",
                        "action": action_txt,
                        "data_provenance": "AI-Assisted Screening (Non-diagnostic)",
                        "data_payload": json.dumps({
                            "detected_issue": issue,
                            "confidence_level": conf,
                            "analyzed_at": latest_disease.analyzed_at.isoformat()
                        }),
                        "fingerprint": f"{field.id}:disease:{latest_disease.id}"
                    })

        # ----------------------------------------------------
        # Deduplication & Persistence
        # ----------------------------------------------------
        for cand in candidate_alerts:
            existing = db.query(Alert).filter(Alert.fingerprint == cand["fingerprint"]).first()
            if not existing:
                alert_obj = Alert(
                    field_id=cand["field_id"],
                    type=cand["type"],
                    severity=cand["severity"],
                    title=cand["title"],
                    message=cand["message"],
                    source=cand["source"],
                    action=cand.get("action"),
                    data_provenance=cand.get("data_provenance"),
                    data_payload=cand.get("data_payload"),
                    fingerprint=cand["fingerprint"],
                    is_read=False,
                    created_at=now
                )
                db.add(alert_obj)

        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to commit alerts for field {field.id}: {e}")

        # Return all alerts for field
        return (
            db.query(Alert)
            .filter(Alert.field_id == field.id)
            .order_by(Alert.created_at.desc())
            .all()
        )

    @classmethod
    def get_alerts(
        cls,
        db: Session,
        field_id: Optional[int] = None,
        unread_only: bool = False,
        limit: int = 50
    ) -> List[Alert]:
        """Query persistent alerts with optional field and read filters."""
        query = db.query(Alert)
        if field_id is not None:
            query = query.filter(Alert.field_id == field_id)
        if unread_only:
            query = query.filter(Alert.is_read == False)
        
        return query.order_by(Alert.is_read.asc(), Alert.created_at.desc()).limit(limit).all()

    @classmethod
    def get_alert_counts(cls, db: Session, field_id: Optional[int] = None) -> Dict[str, int]:
        """Return total and unread alert counts."""
        query = db.query(Alert)
        if field_id is not None:
            query = query.filter(Alert.field_id == field_id)
        
        total = query.count()
        unread = query.filter(Alert.is_read == False).count()
        return {"total": total, "unread": unread}

    @classmethod
    def mark_as_read(cls, alert_id: int, db: Session) -> Optional[Alert]:
        """Mark a single alert as read."""
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.is_read = True
            db.commit()
            db.refresh(alert)
        return alert

    @classmethod
    def mark_all_read(cls, db: Session, field_id: Optional[int] = None) -> int:
        """Mark all alerts (optionally filtered by field) as read."""
        query = db.query(Alert).filter(Alert.is_read == False)
        if field_id is not None:
            query = query.filter(Alert.field_id == field_id)
        
        alerts = query.all()
        for a in alerts:
            a.is_read = True
        
        count = len(alerts)
        db.commit()
        return count

alert_service = AlertService()
