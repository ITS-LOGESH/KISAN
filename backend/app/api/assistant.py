from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Field, SoilRecord
from app.schemas.schemas import AssistantRequest, AssistantResponse
from app.services.weather_service import weather_service
from app.services.satellite_service import satellite_service
from app.services.gemini_service import gemini_service
from app.engines.risk_engine import RiskEngine
from app.engines.advisory_engine import AdvisoryEngine

router = APIRouter(prefix="/assistant", tags=["assistant"])

@router.post("", response_model=AssistantResponse)
async def ask_my_field(
    req: AssistantRequest,
    db: Session = Depends(get_db)
):
    """
    'Ask My Field' Agricultural AI Assistant.
    Retrieves real field telemetry through tool pipeline, then provides Gemini reasoning
    or a transparent deterministic fallback.
    """
    field = db.query(Field).filter(Field.id == req.field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    # Tool calling pipeline
    weather = await weather_service.get_forecast(field.latitude, field.longitude)
    satellite = await satellite_service.get_metrics(field.latitude, field.longitude)
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

    field_info = {
        "id": field.id,
        "name": field.name,
        "state": field.state,
        "district": field.district,
        "crop_type": field.crop_type,
        "area_acres": field.area_acres,
        "sowing_date": field.sowing_date.isoformat() if field.sowing_date else None,
        "is_demo": field.is_demo
    }

    risks = RiskEngine.evaluate(field.name, field.crop_type, weather, satellite, soil_dict)
    advisories = AdvisoryEngine.generate_advisories(field.crop_type, weather, satellite, soil_dict)

    result = await gemini_service.answer_field_query(
        question=req.question,
        field_id=field.id,
        field_info=field_info,
        weather=weather,
        satellite=satellite,
        soil=soil_dict,
        risks=risks,
        advisories=advisories,
        language=req.language or "en"
    )

    return result
