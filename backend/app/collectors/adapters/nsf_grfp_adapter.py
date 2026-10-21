import logging
from typing import List
from bs4 import BeautifulSoup

from app.collectors.base import SourceAdapter
from app.collectors.fixtures import NSF_GRFP_FIXTURE_HTML
from app.schemas.notice import NoticeCreate

logger = logging.getLogger(__name__)


class NsfGrfpAdapter(SourceAdapter):
    slug = "nsf_grfp"
    name = "NSF Graduate Research Fellowship Program"
    official_url = "https://www.nsfgrfp.org/"
    source_type = "html_catalog"
    permission_status = "public_allowed"
    default_timezone = "America/New_York"

    def parse(self, raw_content: str, source_id: int) -> List[NoticeCreate]:
        soup = BeautifulSoup(raw_content, "html.parser")
        notices: List[NoticeCreate] = []

        items = soup.select(".grfp-item")
        for item in items:
            try:
                title_link = item.select_one(".solicitation-title a")
                if not title_link:
                    continue
                title = self.clean_text(title_link.get_text())
                canonical_url = title_link.get("href", "").strip()
                if not canonical_url:
                    continue

                provider_el = item.select_one(".sponsor")
                provider = self.clean_text(provider_el.get_text()) if provider_el else "National Science Foundation (NSF)"

                level_el = item.select_one(".eligible-levels")
                education_level = self.clean_text(level_el.get_text()) if level_el else "Graduate"

                field_el = item.select_one(".field-of-study")
                discipline = self.clean_text(field_el.get_text()) if field_el else "STEM"

                region = "United States"

                deadline_el = item.select_one(".submission-deadline")
                raw_deadline = self.clean_text(deadline_el.get_text()) if deadline_el else None
                deadline_dt, tz_name, deadline_text = self.parse_deadline(raw_deadline, default_tz=self.default_timezone)

                benefits_el = item.select_one(".benefits-summary")
                benefit_text = self.clean_text(benefits_el.get_text()) if benefits_el else None

                eligibility_el = item.select_one(".eligibility-summary")
                eligibility_text = self.clean_text(eligibility_el.get_text()) if eligibility_el else None

                excerpt_el = item.select_one(".synopsis")
                excerpt = self.clean_text(excerpt_el.get_text()) if excerpt_el else f"Official NSF GRFP solicitation for {title}."

                tags = ["nsf", "stem", "fellowship", "us_government", "us_citizen", "masters", "phd"]

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
                logger.error(f"Error parsing NSF GRFP item: {item_err}", exc_info=True)
                continue

        return notices

    def collect(self, source_id: int, use_live_network: bool = True) -> List[NoticeCreate]:
        if use_live_network:
            raw_html = self.fetch_raw(self.official_url)
        else:
            raw_html = NSF_GRFP_FIXTURE_HTML

        return self.parse(raw_html, source_id)
