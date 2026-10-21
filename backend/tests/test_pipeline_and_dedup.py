import pytest
from app.models.notice import Notice
from app.models.change_history import ChangeHistory
from app.models.alert import Alert
from app.models.source import Source
from app.collectors.pipeline import run_collection_for_source
from app.collectors.fixtures import (
    FULBRIGHT_FIXTURE_HTML, FULBRIGHT_REVISED_DEADLINE_HTML
)


def test_idempotent_collection_run(db_session):
    """
    Criterion 7: Re-running the collector does not create duplicate notices.
    """
    source = db_session.query(Source).filter(Source.slug == "fulbright_student").first()
    assert source is not None

    # First run
    run1 = run_collection_for_source(source.id, db_session, use_live_network=False, custom_raw_content=FULBRIGHT_FIXTURE_HTML)
    assert run1.status == "success"
    initial_count = db_session.query(Notice).filter(Notice.source_id == source.id).count()
    assert initial_count >= 3

    # Re-run collector with identical content
    run2 = run_collection_for_source(source.id, db_session, use_live_network=False, custom_raw_content=FULBRIGHT_FIXTURE_HTML)
    assert run2.status == "success"
    assert run2.records_added == 0, "Repeated run should not add duplicate notices!"
    
    post_count = db_session.query(Notice).filter(Notice.source_id == source.id).count()
    assert post_count == initial_count, "Database notice count must remain invariant upon re-running!"


def test_deadline_revision_creates_history_and_single_alert(db_session):
    """
    Criterion 2: Correcting a source announcement updates existing notice and creates change history.
    Criterion 6: A meaningful deadline revision generates only one corresponding alert.
    """
    source = db_session.query(Source).filter(Source.slug == "fulbright_student").first()

    # Step 1: Initial ingestion
    run_collection_for_source(source.id, db_session, use_live_network=False, custom_raw_content=FULBRIGHT_FIXTURE_HTML)
    target_url = "https://us.fulbrightonline.org/countries/europe-and-eurasia/germany/open-study-research-award"
    
    notice = db_session.query(Notice).filter(Notice.canonical_url == target_url).first()
    assert notice is not None
    original_deadline = notice.deadline
    assert original_deadline.day == 6

    # Step 2: Source publishes an updated announcement with revised deadline
    run_collection_for_source(source.id, db_session, use_live_network=False, custom_raw_content=FULBRIGHT_REVISED_DEADLINE_HTML)

    # Verify existing notice updated without creating a duplicate
    all_germany_notices = db_session.query(Notice).filter(Notice.canonical_url == target_url).all()
    assert len(all_germany_notices) == 1, "Duplicate notice was created instead of updating existing notice!"

    updated_notice = all_germany_notices[0]
    assert updated_notice.deadline.day == 20, "Deadline was not updated to revised date!"

    # Verify ChangeHistory record created
    histories = db_session.query(ChangeHistory).filter(ChangeHistory.notice_id == updated_notice.id).all()
    assert len(histories) >= 1
    recent_history = histories[0]
    assert "deadline" in recent_history.changed_fields

    # Verify single alert created with deduplication key
    alerts = db_session.query(Alert).filter(
        Alert.notice_id == updated_notice.id,
        Alert.alert_type == "deadline_revision"
    ).all()
    assert len(alerts) == 1, "Expected exactly 1 alert for the deadline revision!"

    # Step 3: Run again with same revised content - must not generate duplicate alert
    run_collection_for_source(source.id, db_session, use_live_network=False, custom_raw_content=FULBRIGHT_REVISED_DEADLINE_HTML)
    alerts_after = db_session.query(Alert).filter(
        Alert.notice_id == updated_notice.id,
        Alert.alert_type == "deadline_revision"
    ).all()
    assert len(alerts_after) == 1, "Duplicate alert was created upon subsequent collection!"


def test_inaccessible_source_error_reporting(db_session, monkeypatch):
    """
    Criterion 4: An inaccessible source is reported with an error status rather than silently ignored.
    """
    from app.collectors.base import SourceAdapter
    monkeypatch.setattr(SourceAdapter, "max_retries", 1)
    monkeypatch.setattr(SourceAdapter, "timeout", 1)

    source = db_session.query(Source).filter(Source.slug == "fulbright_student").first()
    # Point source to non-existent domain and short timeout
    source.official_url = "http://127.0.0.1:54321/non-existent-endpoint"
    db_session.commit()

    run = run_collection_for_source(source.id, db_session, use_live_network=True)
    assert run.status == "failed"
    assert run.diagnostic_info is not None

    db_session.refresh(source)
    assert source.last_status == "error"
    assert source.last_error is not None
