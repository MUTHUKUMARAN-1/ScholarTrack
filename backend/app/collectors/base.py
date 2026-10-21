import re
import hashlib
import time
import logging
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from dateutil import parser as date_parser

import requests
from bs4 import BeautifulSoup

from app.schemas.notice import NoticeCreate

logger = logging.getLogger(__name__)

# Standard timezone abbreviations mapping
TZ_MAPPING = {
    "ET": "America/New_York",
    "EDT": "America/New_York",
    "EST": "America/New_York",
    "CT": "America/Chicago",
    "CDT": "America/Chicago",
    "CST": "America/Chicago",
    "PT": "America/Los_Angeles",
    "PDT": "America/Los_Angeles",
    "PST": "America/Los_Angeles",
    "CET": "Europe/Berlin",
    "CEST": "Europe/Berlin",
    "BST": "Europe/London",
    "GMT": "UTC",
    "UTC": "UTC",
    "IST": "Asia/Kolkata",
}


class SourceAdapter(ABC):
    slug: str = ""
    name: str = ""
    official_url: str = ""
    source_type: str = "html_catalog"
    permission_status: str = "public_allowed"
    default_timezone: str = "UTC"
    timeout: int = 10
    max_retries: int = 3
    backoff_factor: float = 1.5

    def __init__(self, timeout: Optional[int] = None, max_retries: Optional[int] = None, backoff_factor: Optional[float] = None):
        self.timeout = timeout if timeout is not None else self.__class__.timeout
        self.max_retries = max_retries if max_retries is not None else self.__class__.max_retries
        self.backoff_factor = backoff_factor if backoff_factor is not None else self.__class__.backoff_factor
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "ScholarTrack-Bot/1.0 (Educational Academic Research Project; +https://scholartrack.edu)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })

    def fetch_raw(self, url: str) -> str:
        """
        Fetch HTML or XML content with bounded retries and exponential backoff.
        Raises exception if all retries fail.
        """
        last_exception = None
        for attempt in range(1, self.max_retries + 1):
            try:
                response = self.session.get(url, timeout=self.timeout)
                response.raise_for_status()
                return response.text
            except (requests.RequestException, Exception) as exc:
                last_exception = exc
                wait_time = self.backoff_factor ** attempt
                logger.warning(
                    f"[{self.slug}] Fetch attempt {attempt}/{self.max_retries} failed for {url}: {exc}. "
                    f"Retrying in {wait_time:.1f}s..."
                )
                time.sleep(wait_time)
        raise RuntimeError(f"Failed to fetch {url} after {self.max_retries} attempts: {last_exception}")

    @staticmethod
    def clean_text(text: Optional[str]) -> str:
        if not text:
            return ""
        return " ".join(text.split()).strip()

    @staticmethod
    def compute_content_hash(
        title: str,
        provider: str,
        education_level: str,
        discipline: str,
        region: str,
        deadline_iso: Optional[str],
        eligibility_text: Optional[str],
        benefit_text: Optional[str],
    ) -> str:
        """
        Compute deterministic SHA-256 content hash of normalized announcement data.
        Meaningful updates change this hash; identical re-runs produce the exact same hash.
        """
        fields = [
            title.strip().lower(),
            provider.strip().lower(),
            education_level.strip().lower(),
            discipline.strip().lower(),
            region.strip().lower(),
            deadline_iso or "none",
            (eligibility_text or "").strip().lower(),
            (benefit_text or "").strip().lower(),
        ]
        payload = "|".join(fields).encode("utf-8")
        return hashlib.sha256(payload).hexdigest()

    @classmethod
    def parse_deadline(cls, raw_date_text: Optional[str], default_tz: str = "UTC") -> tuple[Optional[datetime], str, Optional[str]]:
        """
        Safely parse deadline string preserving original timezone.
        MANDATORY CRITERION: Unknown or rolling deadlines MUST NEVER be converted to arbitrary dates.
        Returns: (parsed_utc_or_aware_datetime, timezone_name, raw_date_text)
        """
        if not raw_date_text:
            return None, default_tz, None

        cleaned = cls.clean_text(raw_date_text)
        lowered = cleaned.lower()

        # Check for rolling/unspecified keywords
        if any(term in lowered for term in ["rolling", "open review", "ongoing", "not specified", "unspecified", "tbd", "n/a"]):
            return None, default_tz, cleaned

        # Detect timezone from text (e.g., Eastern Time, CET, PDT, etc.)
        detected_tz = default_tz
        for abbrev, tz_identifier in TZ_MAPPING.items():
            pattern = rf"\b{abbrev}\b"
            if re.search(pattern, cleaned, re.IGNORECASE):
                detected_tz = tz_identifier
                break
        
        # Also check explicit timezone strings
        if "eastern time" in lowered:
            detected_tz = "America/New_York"
        elif "central european time" in lowered:
            detected_tz = "Europe/Berlin"
        elif "greenwich mean time" in lowered or "gmt" in lowered:
            detected_tz = "UTC"

        try:
            # Strip verbal timezone phrases that may confuse parser
            parseable_str = re.sub(
                r"(Eastern Time|Central European Time|Central Time|Pacific Time|Local Time|\b(EDT|EST|CET|CEST|PDT|PST|CDT|CST|GMT|UTC|IST)\b)",
                "",
                cleaned,
                flags=re.IGNORECASE
            ).strip()

            parsed = date_parser.parse(parseable_str, fuzzy=True)
            
            # Attach detected timezone if naive
            if parsed.tzinfo is None:
                parsed = parsed.replace(tzinfo=ZoneInfo(detected_tz))
            
            return parsed, detected_tz, cleaned
        except Exception as exc:
            logger.warning(f"Could not parse date string '{raw_date_text}': {exc}. Treating as unspecified.")
            return None, default_tz, cleaned

    @abstractmethod
    def parse(self, raw_content: str, source_id: int) -> List[NoticeCreate]:
        """
        Parse raw HTML/XML content and return normalized NoticeCreate schemas.
        Must handle malformed fields without crashing.
        """
        pass

    @abstractmethod
    def collect(self, source_id: int, use_live_network: bool = True) -> List[NoticeCreate]:
        """
        Execute collection for this source.
        """
        pass
