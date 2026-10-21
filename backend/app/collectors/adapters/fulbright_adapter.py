import logging
from typing import List
from bs4 import BeautifulSoup

from app.collectors.base import SourceAdapter
from app.collectors.fixtures import FULBRIGHT_FIXTURE_HTML
from app.schemas.notice import NoticeCreate

logger = logging.getLogger(__name__)


class FulbrightAdapter(SourceAdapter):
    slug = "fulbright_student"
    name = "Fulbright U.S. Student Program"
    official_url = "https://us.fulbrightonline.org/applicants"
    source_type = "html_catalog"
    permission_status = "public_allowed"
    default_timezone = "America/New_York"

    def parse(self, raw_content: str, source_id: int) -> List[NoticeCreate]:
        soup = BeautifulSoup(raw_content, "html.parser")
        notices: List[NoticeCreate] = []

        cards = soup.select(".award-card")
        for card in cards:
            try:
                # Safe Title and URL extraction
                title_link = card.select_one(".award-title a")
                if not title_link:
                    continue
                title = self.clean_text(title_link.get_text())
                canonical_url = title_link.get("href", "").strip()
                if not canonical_url:
                    continue

                # Safe Provider
                provider_el = card.select_one(".award-provider")
                provider = self.clean_text(provider_el.get_text()) if provider_el else "Fulbright / IIE"

                # Safe Education Level
                level_el = card.select_one(".award-level")
                education_level = self.clean_text(level_el.get_text()) if level_el else "All Levels"

                # Safe Field / Discipline
                field_el = card.select_one(".award-field")
                discipline = self.clean_text(field_el.get_text()) if field_el else "All Fields"

                # Safe Region / Location
                loc_el = card.select_one(".award-location")
                region = self.clean_text(loc_el.get_text()) if loc_el else "International"

                # Safe Deadline parsing
                deadline_el = card.select_one(".award-deadline")
                raw_deadline = self.clean_text(deadline_el.get_text()) if deadline_el else None
                deadline_dt, tz_name, deadline_text = self.parse_deadline(raw_deadline, default_tz=self.default_timezone)

                # Safe Benefits and Eligibility
                benefits_el = card.select_one(".award-benefits")
                benefit_text = self.clean_text(benefits_el.get_text()) if benefits_el else None

                eligibility_el = card.select_one(".award-eligibility")
                eligibility_text = self.clean_text(eligibility_el.get_text()) if eligibility_el else None

                excerpt_el = card.select_one(".award-excerpt")
                excerpt = self.clean_text(excerpt_el.get_text()) if excerpt_el else f"Official announcement from {provider} for {title}."

                # Tag extraction helper
                tags = ["fulbright", "government_funded", "fellowship"]
                if "undergraduate" in education_level.lower():
                    tags.append("undergraduate")
                if "master" in education_level.lower():
                    tags.append("masters")
                if "doctoral" in education_level.lower() or "phd" in education_level.lower():
                    tags.append("phd")
                if "u.s. citizen" in (eligibility_text or "").lower():
                    tags.append("us_citizen")

                deadline_iso = deadline_dt.isoformat() if deadline_dt else None
                content_hash = self.compute_content_hash(
                    title=title,
                    provider=provider,
                    education_level=education_level,
                    discipline=discipline,
                    region=region,
                    deadline_iso=deadline_iso,
                    eligibility_text=eligibility_text,
                    benefit_text=benefit_text,
                )

                notices.append(NoticeCreate(
                    source_id=source_id,
                    title=title,
                    provider=provider,
                    canonical_url=canonical_url,
                    notice_type="fellowship",
                    education_level=education_level,
                    discipline=discipline,
                    region=region,
                    benefit_text=benefit_text,
                    eligibility_text=eligibility_text,
                    eligibility_tags=tags,
                    deadline=deadline_dt,
                    timezone=tz_name,
                    deadline_raw_text=deadline_text,
                    notice_status="verified",
                    excerpt=excerpt,
                    content_hash=content_hash,
                    is_demo=False
                ))
            except Exception as item_err:
                logger.error(f"Error parsing Fulbright award card: {item_err}", exc_info=True)
                continue

        return notices

    def collect(self, source_id: int, use_live_network: bool = True) -> List[NoticeCreate]:
        if use_live_network:
            raw_html = self.fetch_raw(self.official_url)
        else:
            raw_html = FULBRIGHT_FIXTURE_HTML

        return self.parse(raw_html, source_id)
