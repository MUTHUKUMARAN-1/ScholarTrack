from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.alert import Alert
from app.models.notice import Notice
from app.schemas.alert import AlertResponse

router = APIRouter(prefix="/alerts", tags=["Alerts & Revisions"])


@router.get("", response_model=List[AlertResponse])
def list_alerts(
    alert_type: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Alert).join(Notice)
    if alert_type:
        query = query.filter(Alert.alert_type == alert_type)
    
    alerts = query.order_by(Alert.creation_timestamp.desc()).limit(limit).all()
    res = []
    for a in alerts:
        res.append(AlertResponse(
            id=a.id,
            notice_id=a.notice_id,
            change_id=a.change_id,
            alert_type=a.alert_type,
            title=a.title,
            message=a.message,
            deduplication_key=a.deduplication_key,
            is_read=a.is_read,
            creation_timestamp=a.creation_timestamp,
            notice_title=a.notice.title if a.notice else None,
            canonical_url=a.notice.canonical_url if a.notice else None,
        ))
    return res


@router.post("/{alert_id}/read", response_model=AlertResponse)
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found.")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    return AlertResponse(
        id=alert.id,
        notice_id=alert.notice_id,
        change_id=alert.change_id,
        alert_type=alert.alert_type,
        title=alert.title,
        message=alert.message,
        deduplication_key=alert.deduplication_key,
        is_read=alert.is_read,
        creation_timestamp=alert.creation_timestamp,
        notice_title=alert.notice.title if alert.notice else None,
        canonical_url=alert.notice.canonical_url if alert.notice else None,
    )
