from datetime import datetime, timezone, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.database import get_db
from app.models.notice import Notice
from app.models.source import Source
from app.models.change_history import ChangeHistory
from app.schemas.notice import (
    NoticeResponse, NoticeDetailResponse, NoticeListResponse, DashboardStatsResponse
)
from app.schemas.admin import EligibilityMatchRequest, EligibilityMatchResult
from app.services.eligibility_matcher import evaluate_eligibility

router = APIRouter(prefix="/notices", tags=["Student Notices"])


def enrich_notice(notice: Notice, now: datetime) -> dict:
    data = {
        "id": notice.id,
        "source_id": notice.source_id,
        "canonical_url": notice.canonical_url,
        "title": notice.title,
        "provider": notice.provider,
        "notice_type": notice.notice_type,
        "education_level": notice.education_level,
        "discipline": notice.discipline,
        "region": notice.region,
        "benefit_text": notice.benefit_text,
        "eligibility_text": notice.eligibility_text,
        "eligibility_tags": notice.eligibility_tags or [],
        "deadline": notice.deadline,
        "timezone": notice.timezone,
        "deadline_raw_text": notice.deadline_raw_text,
        "capture_timestamp": notice.capture_timestamp,
        "verification_timestamp": notice.verification_timestamp,
        "content_hash": notice.content_hash,
        "notice_status": notice.notice_status,
        "excerpt": notice.excerpt,
        "is_demo": notice.is_demo,
        "created_at": notice.created_at,
        "updated_at": notice.updated_at,
        "source_name": notice.source.name if notice.source else None,
        "source_last_checked": notice.source.last_checked if notice.source else None,
        "is_closing_soon": False,
        "days_remaining": None,
    }

    if notice.deadline:
        # Timezone-aware deadline comparison
        target_dl = notice.deadline
        if target_dl.tzinfo is None:
            target_dl = target_dl.replace(tzinfo=timezone.utc)
        
        diff = target_dl - now
        data["days_remaining"] = diff.days
        # Closing soon if between 0 and 30 days
        if 0 <= diff.days <= 30:
            data["is_closing_soon"] = True

    return data


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    notices = db.query(Notice).all()
    sources = db.query(Source).all()

    total_opportunities = len(notices)
    upcoming_deadlines = 0
    closing_soon = 0
    recently_updated = 0
    verified_count = 0
    unverified_count = 0
    stale_count = 0
    withdrawn_count = 0

    seven_days_ago = now - timedelta(days=7)
    thirty_days_future = now + timedelta(days=30)

    for n in notices:
        # Status counts
        if n.notice_status == "verified":
            verified_count += 1
        elif n.notice_status == "unverified":
            unverified_count += 1
        elif n.notice_status == "stale":
            stale_count += 1
        elif n.notice_status == "withdrawn":
            withdrawn_count += 1

        # Deadline counts
        if n.deadline:
            dl = n.deadline
            if dl.tzinfo is None:
                dl = dl.replace(tzinfo=timezone.utc)
            if dl >= now:
                upcoming_deadlines += 1
                if dl <= thirty_days_future:
                    closing_soon += 1

        # Recently updated
        upd = n.updated_at
        if upd and upd.tzinfo is None:
            upd = upd.replace(tzinfo=timezone.utc)
        if upd and upd >= seven_days_ago:
            recently_updated += 1

    last_collection = None
    if sources:
        check_times = [s.last_checked for s in sources if s.last_checked]
        if check_times:
            last_collection = max(check_times)

    return DashboardStatsResponse(
        total_opportunities=total_opportunities,
        upcoming_deadlines=upcoming_deadlines,
        closing_soon=closing_soon,
        recently_updated=recently_updated,
        verified_count=verified_count,
        unverified_count=unverified_count,
        stale_count=stale_count,
        withdrawn_count=withdrawn_count,
        sources_count=len(sources),
        last_collection_timestamp=last_collection
    )


@router.get("", response_model=NoticeListResponse)
def list_notices(
    search: Optional[str] = None,
    provider: Optional[str] = None,
    education_level: Optional[str] = None,
    discipline: Optional[str] = None,
    region: Optional[str] = None,
    notice_type: Optional[str] = None,
    notice_status: Optional[str] = None,
    deadline_status: Optional[str] = "all",  # upcoming, closing_soon, rolling, past, all
    sort_by: Optional[str] = "deadline_asc",  # deadline_asc, deadline_desc, updated_desc, title_asc
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    query = db.query(Notice).join(Source)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Notice.title.ilike(search_filter),
                Notice.provider.ilike(search_filter),
                Notice.discipline.ilike(search_filter),
                Notice.eligibility_text.ilike(search_filter),
                Notice.benefit_text.ilike(search_filter)
            )
        )

    if provider:
        query = query.filter(Notice.provider.ilike(f"%{provider}%"))

    if education_level and education_level != "all":
        query = query.filter(Notice.education_level.ilike(f"%{education_level}%"))

    if discipline and discipline != "all":
        query = query.filter(Notice.discipline.ilike(f"%{discipline}%"))

    if region and region != "all":
        query = query.filter(Notice.region.ilike(f"%{region}%"))

    if notice_type and notice_type != "all":
        query = query.filter(Notice.notice_type == notice_type)

    if notice_status and notice_status != "all":
        query = query.filter(Notice.notice_status == notice_status)

    # Deadline status filtering
    if deadline_status == "upcoming":
        query = query.filter(Notice.deadline != None).filter(Notice.deadline >= now)
    elif deadline_status == "closing_soon":
        thirty_days = now + timedelta(days=30)
        query = query.filter(Notice.deadline != None).filter(Notice.deadline >= now).filter(Notice.deadline <= thirty_days)
    elif deadline_status == "rolling":
        query = query.filter(Notice.deadline == None)
    elif deadline_status == "past":
        query = query.filter(Notice.deadline != None).filter(Notice.deadline < now)

    # Sorting
    if sort_by == "deadline_asc":
        # Put upcoming deadlines first, nulls/rolling last
        query = query.order_by(Notice.deadline.asc().nullslast())
    elif sort_by == "deadline_desc":
        query = query.order_by(Notice.deadline.desc().nullslast())
    elif sort_by == "updated_desc":
        query = query.order_by(Notice.updated_at.desc())
    elif sort_by == "title_asc":
        query = query.order_by(Notice.title.asc())
    else:
        query = query.order_by(Notice.deadline.asc().nullslast())

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    items_raw = query.offset((page - 1) * page_size).limit(page_size).all()

    items = [NoticeResponse(**enrich_notice(n, now)) for n in items_raw]

    return NoticeListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{notice_id}", response_model=NoticeDetailResponse)
def get_notice_detail(notice_id: int, db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scholarship notice not found.")

    enriched = enrich_notice(notice, now)
    history_records = db.query(ChangeHistory).filter(ChangeHistory.notice_id == notice.id).order_by(ChangeHistory.detected_timestamp.desc()).all()

    history_list = []
    for h in history_records:
        history_list.append({
            "id": h.id,
            "previous_deadline": h.previous_deadline.isoformat() if h.previous_deadline else None,
            "updated_deadline": h.updated_deadline.isoformat() if h.updated_deadline else None,
            "changed_fields": h.changed_fields,
            "detected_timestamp": h.detected_timestamp.isoformat(),
            "source_reference": h.source_reference,
        })

    enriched["change_history_count"] = len(history_list)
    enriched["change_history"] = history_list

    return NoticeDetailResponse(**enriched)


@router.post("/{notice_id}/match-eligibility", response_model=EligibilityMatchResult)
def match_notice_eligibility(
    notice_id: int,
    req: EligibilityMatchRequest,
    db: Session = Depends(get_db)
):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()
    if not notice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scholarship notice not found.")

    result = evaluate_eligibility(
        notice=notice,
        education_level=req.education_level,
        discipline=req.discipline,
        citizenship=req.citizenship,
        study_country_interest=req.study_country_interest,
    )
    return result
