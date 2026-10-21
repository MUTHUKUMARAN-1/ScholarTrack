import logging
import traceback
from datetime import datetime, timezone
from typing import Dict, Type, Optional, List

from sqlalchemy.orm import Session

from app.models.source import Source
from app.models.notice import Notice
from app.models.change_history import ChangeHistory
from app.models.alert import Alert
from app.models.collection_run import CollectionRun

from app.collectors.base import SourceAdapter
from app.collectors.adapters.fulbright_adapter import FulbrightAdapter
from app.collectors.adapters.daad_adapter import DaadAdapter
from app.collectors.adapters.nsf_grfp_adapter import NsfGrfpAdapter

logger = logging.getLogger(__name__)

ADAPTER_REGISTRY: Dict[str, Type[SourceAdapter]] = {
    FulbrightAdapter.slug: FulbrightAdapter,
    DaadAdapter.slug: DaadAdapter,
    NsfGrfpAdapter.slug: NsfGrfpAdapter,
}


def get_adapter_for_source(source: Source) -> Optional[SourceAdapter]:
    adapter_cls = ADAPTER_REGISTRY.get(source.slug)
    if not adapter_cls:
        return None
    adapter = adapter_cls()
    adapter.name = source.name
    adapter.official_url = source.official_url
    return adapter


def seed_approved_sources(db: Session) -> List[Source]:
    """
    Ensure the mandatory approved public sources are registered in the database.
    """
    default_sources = [
        {
            "slug": FulbrightAdapter.slug,
            "name": FulbrightAdapter.name,
            "official_url": FulbrightAdapter.official_url,
            "source_type": FulbrightAdapter.source_type,
            "permission_status": "public_allowed",
            "enabled_status": True,
        },
        {
            "slug": DaadAdapter.slug,
            "name": DaadAdapter.name,
            "official_url": DaadAdapter.official_url,
            "source_type": DaadAdapter.source_type,
            "permission_status": "public_allowed",
            "enabled_status": True,
        },
        {
            "slug": NsfGrfpAdapter.slug,
            "name": NsfGrfpAdapter.name,
            "official_url": NsfGrfpAdapter.official_url,
            "source_type": NsfGrfpAdapter.source_type,
            "permission_status": "public_allowed",
            "enabled_status": True,
        },
    ]

    sources = []
    for s_data in default_sources:
        existing = db.query(Source).filter(Source.slug == s_data["slug"]).first()
        if not existing:
            source = Source(**s_data)
            db.add(source)
            db.commit()
            db.refresh(source)
            sources.append(source)
        else:
            sources.append(existing)
    return sources


def run_collection_for_source(
    source_id: int, 
    db: Session, 
    use_live_network: bool = True,
    custom_raw_content: Optional[str] = None
) -> CollectionRun:
    """
    Execute collection for a source with safe transactional updates,
    idempotent upserts, change-history tracking, and deduplicated alerts.
    """
    now = datetime.now(timezone.utc)
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise ValueError(f"Source with id {source_id} not found.")

    adapter = get_adapter_for_source(source)
    if not adapter:
        raise ValueError(f"No adapter registered for source slug '{source.slug}'.")

    # Initialize collection run
    run = CollectionRun(
        source_id=source.id,
        start_time=now,
        status="running",
        records_processed=0,
        records_added=0,
        records_updated=0,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    if not source.enabled_status:
        run.status = "success"
        run.completion_time = datetime.now(timezone.utc)
        run.diagnostic_info = "Source is disabled; collection skipped."
        db.commit()
        return run

    records_processed = 0
    records_added = 0
    records_updated = 0

    try:
        # Collect extracted notice records
        if custom_raw_content is not None:
            extracted_notices = adapter.parse(custom_raw_content, source_id=source.id)
        else:
            extracted_notices = adapter.collect(source_id=source.id, use_live_network=use_live_network)

        for notice_data in extracted_notices:
            records_processed += 1
            existing = db.query(Notice).filter(Notice.canonical_url == notice_data.canonical_url).first()

            if existing:
                # Check for meaningful changes via content hash
                if existing.content_hash != notice_data.content_hash:
                    changed_fields: Dict[str, Dict[str, str]] = {}

                    # Deadline change check
                    prev_dl_iso = existing.deadline.isoformat() if existing.deadline else None
                    new_dl_iso = notice_data.deadline.isoformat() if notice_data.deadline else None
                    deadline_changed = (prev_dl_iso != new_dl_iso)

                    if deadline_changed:
                        changed_fields["deadline"] = {
                            "old": existing.deadline_raw_text or "Unspecified",
                            "new": notice_data.deadline_raw_text or "Unspecified",
                        }

                    if existing.title != notice_data.title:
                        changed_fields["title"] = {"old": existing.title, "new": notice_data.title}
                    if existing.benefit_text != notice_data.benefit_text:
                        changed_fields["benefit_text"] = {"old": existing.benefit_text or "", "new": notice_data.benefit_text or ""}
                    if existing.eligibility_text != notice_data.eligibility_text:
                        changed_fields["eligibility_text"] = {"old": existing.eligibility_text or "", "new": notice_data.eligibility_text or ""}

                    # Record change history
                    change_hist = ChangeHistory(
                        notice_id=existing.id,
                        previous_deadline=existing.deadline,
                        updated_deadline=notice_data.deadline,
                        changed_fields=changed_fields,
                        detected_timestamp=now,
                        source_reference=f"Extracted from {source.name} ({source.official_url})"
                    )
                    db.add(change_hist)
                    db.flush()

                    # Mandatory requirement: Generate exactly one alert per meaningful deadline revision
                    if deadline_changed:
                        target_dl_str = new_dl_iso or "unspecified"
                        dedup_key = f"alert_deadline_rev_{existing.id}_{target_dl_str}"
                        existing_alert = db.query(Alert).filter(Alert.deduplication_key == dedup_key).first()
                        if not existing_alert:
                            alert = Alert(
                                notice_id=existing.id,
                                change_id=change_hist.id,
                                alert_type="deadline_revision",
                                title=f"Deadline Revision: {existing.title}",
                                message=(
                                    f"The application deadline for {existing.title} was revised. "
                                    f"Previous: {existing.deadline_raw_text or 'Unspecified'}. "
                                    f"New: {notice_data.deadline_raw_text or 'Unspecified'}."
                                ),
                                deduplication_key=dedup_key,
                                creation_timestamp=now,
                                is_read=False
                            )
                            db.add(alert)

                    # Update notice record in place
                    existing.title = notice_data.title
                    existing.provider = notice_data.provider
                    existing.education_level = notice_data.education_level
                    existing.discipline = notice_data.discipline
                    existing.region = notice_data.region
                    existing.benefit_text = notice_data.benefit_text
                    existing.eligibility_text = notice_data.eligibility_text
                    existing.eligibility_tags = notice_data.eligibility_tags
                    existing.deadline = notice_data.deadline
                    existing.timezone = notice_data.timezone
                    existing.deadline_raw_text = notice_data.deadline_raw_text
                    existing.content_hash = notice_data.content_hash
                    existing.excerpt = notice_data.excerpt
                    existing.updated_at = now
                    records_updated += 1
                else:
                    # Content identical: safe idempotent no-op
                    pass
            else:
                # Insert new notice
                new_notice = Notice(
                    source_id=source.id,
                    title=notice_data.title,
                    provider=notice_data.provider,
                    canonical_url=notice_data.canonical_url,
                    notice_type=notice_data.notice_type,
                    education_level=notice_data.education_level,
                    discipline=notice_data.discipline,
                    region=notice_data.region,
                    benefit_text=notice_data.benefit_text,
                    eligibility_text=notice_data.eligibility_text,
                    eligibility_tags=notice_data.eligibility_tags,
                    deadline=notice_data.deadline,
                    timezone=notice_data.timezone,
                    deadline_raw_text=notice_data.deadline_raw_text,
                    notice_status=notice_data.notice_status,
                    excerpt=notice_data.excerpt,
                    content_hash=notice_data.content_hash,
                    is_demo=notice_data.is_demo,
                    capture_timestamp=now,
                    verification_timestamp=now,
                    created_at=now,
                    updated_at=now,
                )
                db.add(new_notice)
                db.flush()

                # Generate new opportunity alert
                new_dedup_key = f"alert_new_{new_notice.canonical_url}"
                if not db.query(Alert).filter(Alert.deduplication_key == new_dedup_key).first():
                    alert = Alert(
                        notice_id=new_notice.id,
                        alert_type="new_opportunity",
                        title=f"New Opportunity: {new_notice.title}",
                        message=f"Added from {source.name}. Deadline: {new_notice.deadline_raw_text or 'Rolling'}.",
                        deduplication_key=new_dedup_key,
                        creation_timestamp=now,
                        is_read=False
                    )
                    db.add(alert)
                records_added += 1

        # Finalize successful run
        source.last_checked = now
        source.last_status = "success"
        source.last_error = None
        source.records_count = db.query(Notice).filter(Notice.source_id == source.id).count()

        run.status = "success"
        run.completion_time = datetime.now(timezone.utc)
        run.records_processed = records_processed
        run.records_added = records_added
        run.records_updated = records_updated
        run.diagnostic_info = f"Successfully processed {records_processed} announcements. Added {records_added}, updated {records_updated}."

        db.commit()
        db.refresh(run)
        return run

    except Exception as exc:
        db.rollback()
        err_msg = str(exc)
        stack = traceback.format_exc()
        logger.error(f"Collection run failed for source '{source.name}': {err_msg}\n{stack}")

        # Record error status and diagnostics on source and run
        source.last_checked = now
        source.last_status = "error"
        source.last_error = err_msg

        run.status = "failed"
        run.completion_time = datetime.now(timezone.utc)
        run.records_processed = records_processed
        run.records_added = records_added
        run.records_updated = records_updated
        run.diagnostic_info = f"Error: {err_msg}\n\nStack:\n{stack[:1000]}"

        db.commit()
        db.refresh(run)
        return run


def run_collection_all(db: Session, use_live_network: bool = True) -> List[CollectionRun]:
    sources = db.query(Source).filter(Source.enabled_status == True).all()
    runs = []
    for source in sources:
        run = run_collection_for_source(source.id, db, use_live_network=use_live_network)
        runs.append(run)
    return runs
