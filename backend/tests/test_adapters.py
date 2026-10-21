import pytest
from app.collectors.adapters.fulbright_adapter import FulbrightAdapter
from app.collectors.adapters.daad_adapter import DaadAdapter
from app.collectors.fixtures import (
    FULBRIGHT_FIXTURE_HTML, DAAD_FIXTURE_HTML, MALFORMED_HTML_FIXTURE
)


def test_fulbright_adapter_parsing():
    adapter = FulbrightAdapter()
    notices = adapter.parse(FULBRIGHT_FIXTURE_HTML, source_id=1)
    
    assert len(notices) >= 3
    # Check that canonical links are preserved for every notice
    for n in notices:
        assert n.canonical_url.startswith("https://")
        assert len(n.title) > 0
        assert n.provider != ""

    # Verify Criterion 1: Rolling / Unspecified deadline MUST NOT be converted to arbitrary dates
    rolling_item = next((n for n in notices if "Rolling" in n.title or "Fogarty" in n.title), None)
    assert rolling_item is not None
    assert rolling_item.deadline is None, "Unknown deadline was incorrectly assigned a date!"
    assert "Rolling" in (rolling_item.deadline_raw_text or "")


def test_daad_adapter_parsing():
    adapter = DaadAdapter()
    notices = adapter.parse(DAAD_FIXTURE_HTML, source_id=2)

    assert len(notices) >= 3
    # Check DAAD timezone is Europe/Berlin (CET)
    for n in notices:
        assert n.canonical_url.startswith("https://")
        assert n.timezone == "Europe/Berlin"
        if n.deadline:
            assert n.deadline.year == 2026


def test_malformed_html_graceful_handling():
    """
    Criterion 8: Missing or malformed fields do not crash the entire collection process.
    """
    fulbright_adapter = FulbrightAdapter()
    # Must not raise exception
    notices = fulbright_adapter.parse(MALFORMED_HTML_FIXTURE, source_id=1)
    assert isinstance(notices, list)

    daad_adapter = DaadAdapter()
    notices_daad = daad_adapter.parse(MALFORMED_HTML_FIXTURE, source_id=2)
    assert isinstance(notices_daad, list)


def test_deadline_parser_behavior():
    """
    Verify timezone detection and null-deadline enforcement.
    """
    # 1. Eastern time
    dt, tz, raw = FulbrightAdapter.parse_deadline("October 6, 2026 5:00 PM Eastern Time")
    assert dt is not None
    assert dt.month == 10
    assert dt.day == 6
    assert dt.hour == 17
    assert tz == "America/New_York"

    # 2. CET time
    dt_cet, tz_cet, raw_cet = DaadAdapter.parse_deadline("15 November 2026 23:59 Central European Time")
    assert dt_cet is not None
    assert dt_cet.month == 11
    assert dt_cet.day == 15
    assert tz_cet == "Europe/Berlin"

    # 3. Explicit Rolling / TBD / Empty
    dt_roll, _, _ = FulbrightAdapter.parse_deadline("Rolling Basis")
    assert dt_roll is None, "Rolling deadline must return None!"

    dt_none, _, _ = FulbrightAdapter.parse_deadline(None)
    assert dt_none is None
