from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Field
from app.schemas.schemas import WeatherDataResponse
from app.services.weather_service import weather_service

router = APIRouter(tags=["weather"])

@router.get("/fields/{field_id}/weather", response_model=WeatherDataResponse)
async def get_field_weather(field_id: int, db: Session = Depends(get_db)):
    """Fetch live meteorological observations and forecast for a field from Open-Meteo."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    
    data = await weather_service.get_forecast(field.latitude, field.longitude)
    return data

@router.get("/weather/live", response_model=WeatherDataResponse)
async def get_live_weather(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180)
):
    """Fetch live Open-Meteo forecast directly by geographic coordinates."""
    data = await weather_service.get_forecast(latitude, longitude)
    return data
