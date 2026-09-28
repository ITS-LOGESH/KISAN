from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.models import Field, Alert
from app.schemas.schemas import AlertResponse, AlertCountResponse, MarkAllReadResponse
from app.services.alert_service import alert_service

router = APIRouter(tags=["alerts"])

def _to_alert_response(alert: Alert, field_name: Optional[str] = None) -> AlertResponse:
    fname = field_name or (alert.field.name if alert.field else None)
    return AlertResponse(
        id=alert.id,
        field_id=alert.field_id,
        type=alert.type,
        severity=alert.severity,
        title=alert.title,
        message=alert.message,
        source=alert.source,
        action=alert.action,
        data_provenance=alert.data_provenance,
        data_payload=alert.data_payload,
        fingerprint=alert.fingerprint,
        is_read=alert.is_read,
        created_at=alert.created_at,
        field_name=fname
    )

@router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(
    field_id: Optional[int] = Query(None, description="Optional field ID filter"),
    unread_only: bool = Query(False, description="Filter only unread alerts"),
    evaluate: bool = Query(True, description="Whether to trigger deterministic evaluation before querying"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieve real-data driven farmer alerts.
    Triggers deterministic evaluation of live environmental telemetry if evaluate=True.
    Zero fabricated data: Returns empty list if no conditions crossed threshold.
    """
    if evaluate:
        if field_id is not None:
            field = db.query(Field).filter(Field.id == field_id).first()
            if field:
                await alert_service.evaluate_field_alerts(field, db)
        else:
            fields = db.query(Field).all()
            for f in fields:
                await alert_service.evaluate_field_alerts(f, db)

    alerts = alert_service.get_alerts(db, field_id=field_id, unread_only=unread_only, limit=limit)
    return [_to_alert_response(a) for a in alerts]

@router.get("/fields/{field_id}/alerts", response_model=List[AlertResponse])
async def get_field_alerts(
    field_id: int,
    unread_only: bool = Query(False, description="Filter only unread alerts"),
    evaluate: bool = Query(True, description="Whether to trigger deterministic evaluation before querying"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Retrieve alerts specifically belonging to a single field.
    """
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")

    if evaluate:
        await alert_service.evaluate_field_alerts(field, db)

    alerts = alert_service.get_alerts(db, field_id=field_id, unread_only=unread_only, limit=limit)
    return [_to_alert_response(a, field_name=field.name) for a in alerts]

@router.get("/alerts/count", response_model=AlertCountResponse)
def get_alerts_count(
    field_id: Optional[int] = Query(None, description="Optional field ID filter"),
    db: Session = Depends(get_db)
):
    """Return total and unread alert counts."""
    counts = alert_service.get_alert_counts(db, field_id=field_id)
    return AlertCountResponse(total=counts["total"], unread=counts["unread"])

@router.post("/alerts/{alert_id}/read", response_model=AlertResponse)
def mark_alert_as_read(alert_id: int, db: Session = Depends(get_db)):
    """Mark a single alert as read."""
    alert = alert_service.mark_as_read(alert_id, db)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return _to_alert_response(alert)

@router.post("/alerts/mark-all-read", response_model=MarkAllReadResponse)
def mark_all_alerts_as_read(
    field_id: Optional[int] = Query(None, description="Optional field ID filter"),
    db: Session = Depends(get_db)
):
    """Mark all alerts as read."""
    count = alert_service.mark_all_read(db, field_id=field_id)
    return MarkAllReadResponse(updated=count)
