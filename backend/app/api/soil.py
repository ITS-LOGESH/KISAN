from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Field, SoilRecord
from app.schemas.schemas import SoilRecordCreate, SoilRecordResponse

router = APIRouter(tags=["soil"])

@router.get("/fields/{field_id}/soil", response_model=SoilRecordResponse)
def get_field_soil(field_id: int, db: Session = Depends(get_db)):
    """Retrieve field soil profile with transparent provenance (MEASURED, USER_PROVIDED, MODELLED, UNAVAILABLE)."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    soil = db.query(SoilRecord).filter(SoilRecord.field_id == field_id).order_by(SoilRecord.id.desc()).first()
    if not soil:
        # Default explicit unavailable record
        return SoilRecordResponse(
            field_id=field_id,
            source_type="UNAVAILABLE",
            notes="No soil record logged for this field."
        )
    return soil

@router.post("/fields/{field_id}/soil", response_model=SoilRecordResponse, status_code=201)
def record_field_soil(
    field_id: int,
    soil_in: SoilRecordCreate,
    db: Session = Depends(get_db)
):
    """Log or update a farmer-provided or laboratory soil test for a field."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    soil = SoilRecord(
        field_id=field_id,
        source_type=soil_in.source_type,
        source_name=soil_in.source_name,
        ph=soil_in.ph,
        nitrogen_kg_ha=soil_in.nitrogen_kg_ha,
        phosphorus_kg_ha=soil_in.phosphorus_kg_ha,
        potassium_kg_ha=soil_in.potassium_kg_ha,
        organic_carbon_pct=soil_in.organic_carbon_pct,
        electrical_conductivity=soil_in.electrical_conductivity,
        texture=soil_in.texture,
        test_date=soil_in.test_date,
        laboratory_name=soil_in.laboratory_name,
        notes=soil_in.notes
    )
    db.add(soil)
    db.commit()
    db.refresh(soil)
    return soil
