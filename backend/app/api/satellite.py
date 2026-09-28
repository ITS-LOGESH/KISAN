from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Field
from app.schemas.schemas import SatelliteDataResponse
from app.services.satellite_service import satellite_service

router = APIRouter(tags=["satellite"])

@router.get("/fields/{field_id}/satellite", response_model=SatelliteDataResponse)
async def get_field_satellite(field_id: int, db: Session = Depends(get_db)):
    """Fetch genuine Sentinel-2/public satellite telemetry for field coordinates."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    metrics = await satellite_service.get_metrics(field.latitude, field.longitude)
    return metrics
