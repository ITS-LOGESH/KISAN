import json
import datetime
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Field, DiseaseAnalysis
from app.schemas.schemas import DiseaseAnalysisResponse
from app.services.gemini_service import gemini_service

router = APIRouter(prefix="/disease", tags=["disease"])

# Allowed MIME types
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 # 10 MB limit

@router.post("/analyze", response_model=DiseaseAnalysisResponse)
async def analyze_crop_image(
    file: UploadFile = File(...),
    field_id: Optional[int] = Form(None),
    crop_type: Optional[str] = Form(None),
    language: Optional[str] = Form("en"),
    db: Session = Depends(get_db)
):
    """
    Multimodal visual screening for plant pathology symptoms.
    Uses registered crop and parcel agro-climatic context when provided.
    Saves screening result to field history if field_id is present.
    Enforces clear disclaimer: 'AI-assisted screening — not laboratory diagnosis.'
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported image format: {file.content_type}. Please upload JPG, PNG, or WebP."
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"Image size exceeds 10MB limit ({len(content) / (1024*1024):.1f}MB)."
        )

    crop_context: Optional[str] = crop_type
    field_context: Optional[dict] = None
    target_field: Optional[Field] = None

    if field_id is not None:
        target_field = db.query(Field).filter(Field.id == field_id).first()
        if target_field:
            crop_context = target_field.crop_type or crop_type
            field_context = {
                "variety": target_field.variety,
                "state": target_field.state,
                "district": target_field.district,
                "sowing_date": target_field.sowing_date.strftime("%Y-%m-%d") if target_field.sowing_date else None,
                "irrigation_method": target_field.irrigation_method
            }

    res = await gemini_service.analyze_crop_image(
        image_bytes=content,
        mime_type=file.content_type,
        crop_context=crop_context,
        field_context=field_context,
        language=language or "en"
    )

    # Save to Field History if associated with a real registered field
    saved_to_history = False
    record_id = None

    if target_field:
        try:
            suggested_actions_str = json.dumps(res.get("suggested_actions", []))
            record = DiseaseAnalysis(
                field_id=target_field.id,
                image_filename=file.filename or "foliar_inspection.jpg",
                detected_issue=res.get("detected_issue", "Visual Screening"),
                visible_symptoms=res.get("visible_symptoms", ""),
                confidence_level=res.get("confidence_level", "Moderate"),
                suggested_actions=suggested_actions_str,
                limitations=res.get("limitations", "Visual screening — not laboratory diagnosis."),
                model_used=res.get("model_used", "KrishiNet Pathology Engine"),
                analyzed_at=datetime.datetime.utcnow()
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            record_id = record.id
            saved_to_history = True
        except Exception as e:
            # Non-blocking if database write fails
            db.rollback()

    res["id"] = record_id
    res["field_id"] = target_field.id if target_field else None
    res["crop_context"] = crop_context
    res["saved_to_history"] = saved_to_history

    return res

@router.get("/fields/{field_id}/history", response_model=List[DiseaseAnalysisResponse])
def get_field_disease_history(field_id: int, db: Session = Depends(get_db)):
    """Retrieve chronologically ordered disease inspection history for a field."""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    records = db.query(DiseaseAnalysis).filter(
        DiseaseAnalysis.field_id == field_id
    ).order_by(DiseaseAnalysis.analyzed_at.desc()).all()

    results = []
    for r in records:
        actions = []
        if r.suggested_actions:
            try:
                actions = json.loads(r.suggested_actions)
                if not isinstance(actions, list):
                    actions = [str(actions)]
            except Exception:
                actions = [r.suggested_actions]

        results.append(
            DiseaseAnalysisResponse(
                id=r.id,
                field_id=r.field_id,
                crop_context=field.crop_type,
                detected_issue=r.detected_issue,
                visible_symptoms=r.visible_symptoms,
                confidence_level=r.confidence_level,
                suggested_actions=actions,
                limitations=r.limitations,
                model_used=r.model_used,
                analyzed_at=r.analyzed_at,
                status="SUCCESS",
                disclaimer="AI-assisted screening — not laboratory diagnosis.",
                saved_to_history=True
            )
        )

    return results
