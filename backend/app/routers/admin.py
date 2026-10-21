import logging
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.source import Source
from app.models.notice import Notice
from app.models.change_history import ChangeHistory
from app.models.alert import Alert
from app.models.collection_run import CollectionRun
from app.models.admin_user import AdminUser
from app.models.audit_log import AuditLog

from app.schemas.source import SourceResponse, SourceUpdate
from app.schemas.notice import NoticeResponse
from app.schemas.admin import (
    CollectionRunResponse, AuditLogResponse, NoticeStatusUpdate, NoticeManualDeadlineUpdate
)
from app.services.auth import get_current_user
from app.collectors.pipeline import run_collection_for_source, run_collection_all

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Operator Admin Controls"])


def log_audit(db: Session, user: AdminUser, action: str, entity: str, entity_id: Optional[int], details: str):
    audit = AuditLog(
        user_id=user.id,
        username=user.username,
        action=action,
        target_entity=entity,
        target_id=entity_id,
        details=details,
        timestamp=datetime.now(timezone.utc)
    )
    db.add(audit)
    db.commit()


@router.post("/sources/{source_id}/refresh", response_model=CollectionRunResponse)
def trigger_source_refresh(
    source_id: int,
    use_live_network: bool = True,
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found.")

    run = run_collection_for_source(source_id=source.id, db=db, use_live_network=use_live_network)
    log_audit(
        db, current_user, 
        action="manual_refresh_source", 
        entity="source", 
        entity_id=source.id, 
        details=f"Triggered manual refresh. Status: {run.status}. Records processed: {run.records_processed}."
    )
    return CollectionRunResponse(
        id=run.id,
        source_id=run.source_id,
        source_name=source.name,
        start_time=run.start_time,
        completion_time=run.completion_time,
        status=run.status,
        records_processed=run.records_processed,
        records_added=run.records_added,
        records_updated=run.records_updated,
        diagnostic_info=run.diagnostic_info
    )


@router.post("/sources/refresh-all", response_model=List[CollectionRunResponse])
def trigger_refresh_all(
    use_live_network: bool = True,
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    runs = run_collection_all(db, use_live_network=use_live_network)
    log_audit(
        db, current_user,
        action="manual_refresh_all",
        entity="system",
        entity_id=None,
        details=f"Triggered manual refresh for all sources ({len(runs)} sources)."
    )
    res = []
    for r in runs:
        s = db.query(Source).filter(Source.id == r.source_id).first()
        res.append(CollectionRunResponse(
            id=r.id,
            source_id=r.source_id,
            source_name=s.name if s else "Unknown",
            start_time=r.start_time,
            completion_time=r.completion_time,
            status=r.status,
            records_processed=r.records_processed,
            records_added=r.records_added,
            records_updated=r.records_updated,
            diagnostic_info=r.diagnostic_info
        ))
    return res


@router.patch("/sources/{source_id}", response_model=SourceResponse)
def update_source_config(
    source_id: int,
    update_data: SourceUpdate,
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found.")

    changed = []
    if update_data.enabled_status is not None:
        source.enabled_status = update_data.enabled_status
        changed.append(f"enabled_status={update_data.enabled_status}")
    if update_data.official_url is not None:
        source.official_url = update_data.official_url
        changed.append(f"official_url={update_data.official_url}")
    if update_data.name is not None:
        source.name = update_data.name
        changed.append(f"name={update_data.name}")
    if update_data.permission_status is not None:
        source.permission_status = update_data.permission_status
        changed.append(f"permission_status={update_data.permission_status}")

    source.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(source)

    log_audit(
        db, current_user,
        action="update_source",
        entity="source",
        entity_id=source.id,
        details=f"Updated source fields: {', '.join(changed)}"
    )
    return source


@router.patch("/notices/{notice_id}/status", response_model=NoticeResponse)
def update_notice_status(
    notice_id: int,
    status_update: NoticeStatusUpdate,
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    valid_statuses = ["verified", "unverified", "stale", "withdrawn"]
    if status_update.notice_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
        )

    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notice not found.")

    old_status = notice.notice_status
    notice.notice_status = status_update.notice_status
    now = datetime.now(timezone.utc)
    notice.updated_at = now
    if status_update.notice_status == "verified":
        notice.verification_timestamp = now

    # If status is withdrawn, generate an alert
    if status_update.notice_status == "withdrawn" and old_status != "withdrawn":
        dedup_key = f"alert_withdrawn_{notice.id}_{now.strftime('%Y%m%d')}"
        if not db.query(Alert).filter(Alert.deduplication_key == dedup_key).first():
            alert = Alert(
                notice_id=notice.id,
                alert_type="status_withdrawn",
                title=f"Announcement Withdrawn: {notice.title}",
                message=f"Operator marked announcement as withdrawn. Reason: {status_update.reason or 'Announcement closed or canceled by sponsor.'}",
                deduplication_key=dedup_key,
                creation_timestamp=now,
                is_read=False
            )
            db.add(alert)

    db.commit()
    db.refresh(notice)

    log_audit(
        db, current_user,
        action="update_notice_status",
        entity="notice",
        entity_id=notice.id,
        details=f"Status changed from '{old_status}' to '{notice.notice_status}'. Reason: {status_update.reason or 'None provided'}."
    )
    return notice


@router.patch("/notices/{notice_id}/deadline", response_model=NoticeResponse)
def update_notice_deadline_manually(
    notice_id: int,
    deadline_update: NoticeManualDeadlineUpdate,
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notice not found.")

    now = datetime.now(timezone.utc)
    old_deadline = notice.deadline
    old_raw = notice.deadline_raw_text

    new_deadline = deadline_update.deadline
    if new_deadline and new_deadline.tzinfo is None:
        new_deadline = new_deadline.replace(tzinfo=timezone.utc)

    notice.deadline = new_deadline
    notice.timezone = deadline_update.timezone or notice.timezone
    notice.deadline_raw_text = new_deadline.strftime("%B %d, %Y %H:%M %Z") if new_deadline else "Unspecified"
    notice.updated_at = now

    # Record ChangeHistory
    changed_fields = {
        "deadline": {
            "old": old_raw or "Unspecified",
            "new": notice.deadline_raw_text
        },
        "operator_reason": deadline_update.reason
    }
    change = ChangeHistory(
        notice_id=notice.id,
        previous_deadline=old_deadline,
        updated_deadline=new_deadline,
        changed_fields=changed_fields,
        detected_timestamp=now,
        source_reference=f"Manual operator correction by {current_user.username}"
    )
    db.add(change)
    db.flush()

    # Form deduplication key and generate single alert
    new_dl_str = new_deadline.isoformat() if new_deadline else "none"
    dedup_key = f"alert_deadline_rev_{notice.id}_{new_dl_str}"
    if not db.query(Alert).filter(Alert.deduplication_key == dedup_key).first():
        alert = Alert(
            notice_id=notice.id,
            change_id=change.id,
            alert_type="deadline_revision",
            title=f"Deadline Revised: {notice.title}",
            message=f"Operator corrected deadline to {notice.deadline_raw_text}. Reason: {deadline_update.reason}",
            deduplication_key=dedup_key,
            creation_timestamp=now,
            is_read=False
        )
        db.add(alert)

    db.commit()
    db.refresh(notice)

    log_audit(
        db, current_user,
        action="manual_deadline_revision",
        entity="notice",
        entity_id=notice.id,
        details=f"Revised deadline to '{notice.deadline_raw_text}'. Reason: {deadline_update.reason}"
    )
    return notice


@router.get("/runs", response_model=List[CollectionRunResponse])
def list_collection_runs(
    status_filter: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(CollectionRun).join(Source)
    if status_filter:
        query = query.filter(CollectionRun.status == status_filter)
    
    runs = query.order_by(CollectionRun.start_time.desc()).limit(limit).all()
    res = []
    for r in runs:
        res.append(CollectionRunResponse(
            id=r.id,
            source_id=r.source_id,
            source_name=r.source.name if r.source else "Unknown",
            start_time=r.start_time,
            completion_time=r.completion_time,
            status=r.status,
            records_processed=r.records_processed,
            records_added=r.records_added,
            records_updated=r.records_updated,
            diagnostic_info=r.diagnostic_info
        ))
    return res


@router.get("/audit-logs", response_model=List[AuditLogResponse])
def list_audit_logs(
    limit: int = Query(50, ge=1, le=100),
    current_user: AdminUser = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()
    return logs
