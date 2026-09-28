from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.models.models import Field, SoilRecord
from app.schemas.schemas import FieldCreate, FieldUpdate, FieldResponse, SoilRecordResponse
from app.services.geocoding_service import geocoding_service

router = APIRouter(prefix="/fields", tags=["fields"])

@router.get("", response_model=List[FieldResponse])
def get_fields(
    include_demo: bool = Query(True, description="Whether to include demonstration fields"),
    db: Session = Depends(get_db)
):
    """Retrieve list of fields. Filter demo fields if requested."""
    query = db.query(Field)
    if not include_demo:
        query = query.filter(Field.is_demo == False)
    return query.order_by(Field.id.asc()).all()

@router.post("", response_model=FieldResponse, status_code=201)
async def create_field(
    field_in: FieldCreate,
    db: Session = Depends(get_db)
):
    """Register a new farmer field with automatic reverse geocoding if state/district missing."""
    # Check max limit of 4 registered fields per farmer (excluding demo fields)
    farmer_fields_count = db.query(Field).filter(Field.is_demo == False).count()
    if farmer_fields_count >= 4 and not field_in.is_demo:
        raise HTTPException(
            status_code=400,
            detail="Maximum limit of 4 registered fields reached for this farmer profile."
        )

    state = field_in.state
    district = field_in.district
    
    # If state is generic or missing, reverse geocode coordinates
    if not state or state == "Unknown":
        geo = await geocoding_service.reverse_geocode(field_in.latitude, field_in.longitude)
        state = geo.get("state") or "India"
        district = district or geo.get("district")

    field = Field(
        name=field_in.name,
        state=state,
        district=district,
        latitude=field_in.latitude,
        longitude=field_in.longitude,
        crop_type=field_in.crop_type,
        variety=field_in.variety,
        irrigation_method=field_in.irrigation_method,
        soil_report_status=field_in.soil_report_status or "NOT_UPLOADED",
        soil_report_url=field_in.soil_report_url,
        area_acres=field_in.area_acres,
        sowing_date=field_in.sowing_date,
        is_demo=field_in.is_demo,
        demo_label=field_in.demo_label,
        boundary_geojson=field_in.boundary_geojson
    )
    db.add(field)
    db.commit()
    db.refresh(field)

    # Initialize soil record entry as UNAVAILABLE until user uploads test
    soil = SoilRecord(
        field_id=field.id,
        source_type="UNAVAILABLE",
        notes="No soil test provided yet. Farmer can upload lab report at any time."
    )
    db.add(soil)
    db.commit()

    return field

@router.get("/{field_id}", response_model=FieldResponse)
def get_field(field_id: int, db: Session = Depends(get_db)):
    """Retrieve single field digital profile."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
    return field

@router.put("/{field_id}", response_model=FieldResponse)
def update_field(
    field_id: int,
    field_in: FieldUpdate,
    db: Session = Depends(get_db)
):
    """Update existing field metadata."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    update_data = field_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(field, key, value)

    db.commit()
    db.refresh(field)
    return field

@router.delete("/{field_id}", status_code=204)
def delete_field(field_id: int, db: Session = Depends(get_db)):
    """Delete a field and its associated soil records."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    db.query(SoilRecord).filter(SoilRecord.field_id == field_id).delete()
    db.delete(field)
    db.commit()
    return None
