import logging
from typing import List
from bs4 import BeautifulSoup

from app.collectors.base import SourceAdapter
from app.collectors.fixtures import DAAD_FIXTURE_HTML
from app.schemas.notice import NoticeCreate

logger = logging.getLogger(__name__)


class DaadAdapter(SourceAdapter):
    slug = "daad_scholarships"
    name = "DAAD - German Academic Exchange Service"
    official_url = "https://www.daad.de/en/study-and-research-in-germany/scholarships/daad-scholarship-database/"
    source_type = "html_catalog"
    permission_status = "public_allowed"
    default_timezone = "Europe/Berlin"

    def parse(self, raw_content: str, source_id: int) -> List[NoticeCreate]:
        soup = BeautifulSoup(raw_content, "html.parser")
        notices: List[NoticeCreate] = []

        rows = soup.select(".daad-row")
        for row in rows:
            try:
                # Layout B: Table cells
                link_el = row.select_one(".program-link")
                if not link_el:
                    continue
                title = self.clean_text(link_el.get_text())
                canonical_url = link_el.get("href", "").strip()
                if not canonical_url:
                    continue

                provider = "DAAD (Deutscher Akademischer Austauschdienst)"

                group_el = row.select_one(".target-group")
                education_level = self.clean_text(group_el.get_text()) if group_el else "Postgraduate"

                subject_el = row.select_one(".subject-area")
                discipline = self.clean_text(subject_el.get_text()) if subject_el else "All Disciplines"

                region_el = row.select_one(".region")
                region = self.clean_text(region_el.get_text()) if region_el else "Germany / Europe"

                deadline_cell = row.select_one(".deadline-cell")
                raw_deadline = self.clean_text(deadline_cell.get_text()) if deadline_cell else None
                deadline_dt, tz_name, deadline_text = self.parse_deadline(raw_deadline, default_tz=self.default_timezone)

                amount_el = row.select_one(".scholarship-amount")
                benefit_text = self.clean_text(amount_el.get_text()) if amount_el else None

                eligibility_el = row.select_one(".eligibility-info")
                eligibility_text = self.clean_text(eligibility_el.get_text()) if eligibility_el else None

                excerpt_el = row.select_one(".excerpt-text")
                excerpt = self.clean_text(excerpt_el.get_text()) if excerpt_el else f"Official DAAD programme announcement for {title}."

                tags = ["daad", "germany", "europe", "scholarship"]
                if "bachelor" in education_level.lower():
                    tags.append("undergraduate")
                if "master" in education_level.lower():
                    tags.append("masters")
                if "doctoral" in education_level.lower() or "phd" in education_level.lower():
                    tags.append("phd")
                if "postdoc" in education_level.lower():
                    tags.append("postdoc")

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
                    notice_type="scholarship",
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
                logger.error(f"Error parsing DAAD row: {item_err}", exc_info=True)
                continue

        return notices

    def collect(self, source_id: int, use_live_network: bool = True) -> List[NoticeCreate]:
        if use_live_network:
            raw_html = self.fetch_raw(self.official_url)
        else:
            raw_html = DAAD_FIXTURE_HTML

        return self.parse(raw_html, source_id)
