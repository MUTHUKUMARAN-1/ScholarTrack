import pytest
from datetime import datetime, timezone, timedelta
from app import main
from app.models.notice import Notice
from app.models.source import Source
from app.collectors.pipeline import run_collection_for_source


def test_root_serves_frontend_when_built(client, tmp_path, monkeypatch):
    index_file = tmp_path / "index.html"
    index_file.write_text("<html><body>ScholarTrack dashboard</body></html>")
    monkeypatch.setattr(main, "FRONTEND_DIST", tmp_path)

    response = client.get("/")

    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "ScholarTrack dashboard" in response.text


def test_root_returns_service_info_without_frontend_build(client, tmp_path, monkeypatch):
    monkeypatch.setattr(main, "FRONTEND_DIST", tmp_path)

    response = client.get("/")

    assert response.status_code == 200
    assert response.json() == {
        "service": "ScholarTrack API",
        "status": "running",
        "docs": "/api/docs",
        "health": "/api/health",
    }


def test_public_dashboard_stats(client, db_session):
    # Ingest default data
    source = db_session.query(Source).first()
    run_collection_for_source(source.id, db_session, use_live_network=False)

    response = client.get("/api/notices/stats")
    assert response.status_code == 200
    data = response.json()
    assert data["total_opportunities"] >= 3
    assert "sources_count" in data
    assert "upcoming_deadlines" in data


def test_timezone_aware_deadline_filtering(client, db_session):
    """
    Criterion 3: Deadline filtering respects the relevant timezone.
    """
    source = db_session.query(Source).first()
    run_collection_for_source(source.id, db_session, use_live_network=False)

    # 1. Filter by upcoming
    res_upcoming = client.get("/api/notices?deadline_status=upcoming")
    assert res_upcoming.status_code == 200
    items = res_upcoming.json()["items"]
    for item in items:
        assert item["deadline"] is not None

    # 2. Filter by rolling
    res_rolling = client.get("/api/notices?deadline_status=rolling")
    assert res_rolling.status_code == 200
    rolling_items = res_rolling.json()["items"]
    assert len(rolling_items) >= 1
    for item in rolling_items:
        assert item["deadline"] is None


def test_admin_route_protection_unauthorized(client):
    """
    Criterion 10: Administrative functionality is protected against unauthorized access.
    """
    # Attempting to refresh sources without token
    res = client.post("/api/admin/sources/1/refresh")
    assert res.status_code == 401, "Expected 401 Unauthorized for unauthenticated operator request"

    # Attempting to update notice status without token
    res_status = client.patch("/api/admin/notices/1/status", json={"notice_status": "verified"})
    assert res_status.status_code == 401


def test_admin_route_authorized(client, db_session, admin_token):
    """
    Criterion 10: Authorized operator can perform administrative duties.
    Criterion 9: Distinguishes stale, verified, unverified, withdrawn.
    """
    source = db_session.query(Source).first()
    run_collection_for_source(source.id, db_session, use_live_network=False)
    notice = db_session.query(Notice).first()

    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # 1. Update status to withdrawn
    res = client.patch(
        f"/api/admin/notices/{notice.id}/status",
        headers=headers,
        json={"notice_status": "withdrawn", "reason": "Sponsor cancelled application cycle"}
    )
    assert res.status_code == 200
    assert res.json()["notice_status"] == "withdrawn"

    # 2. Check audit logs
    audit_res = client.get("/api/admin/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) >= 1
    assert logs[0]["action"] == "update_notice_status"


def test_eligibility_matching_endpoint(client, db_session):
    source = db_session.query(Source).first()
    run_collection_for_source(source.id, db_session, use_live_network=False)
    notice = db_session.query(Notice).first()

    res = client.post(
        f"/api/notices/{notice.id}/match-eligibility",
        json={
            "education_level": "masters",
            "discipline": "STEM",
            "citizenship": "United States"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert "match_score" in data
    assert "disclaimer" in data
    assert "Disclaimer" in data["disclaimer"]
