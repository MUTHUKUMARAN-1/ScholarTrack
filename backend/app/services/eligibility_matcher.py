import re
from typing import List, Dict, Any, Optional
from app.models.notice import Notice
from app.schemas.admin import EligibilityMatchResult

DISCLAIMER_TEXT = (
    "Disclaimer: This eligibility check is an automated guideline based on published announcement keywords and tags. "
    "It does not guarantee eligibility or funding. Always verify full and final eligibility requirements on the official provider website."
)


def evaluate_eligibility(
    notice: Notice,
    education_level: Optional[str] = None,
    discipline: Optional[str] = None,
    citizenship: Optional[str] = None,
    study_country_interest: Optional[str] = None,
) -> EligibilityMatchResult:
    matched_criteria = []
    potential_conflicts = []
    total_checks = 0
    matched_count = 0

    eligibility_blob = " ".join([
        notice.eligibility_text or "",
        notice.education_level or "",
        notice.discipline or "",
        notice.region or "",
        " ".join(notice.eligibility_tags or [])
    ]).lower()

    # 1. Education Level Check
    if education_level:
        total_checks += 1
        ed_lower = education_level.lower()
        if "all" in notice.education_level.lower() or ed_lower in eligibility_blob:
            matched_criteria.append(f"Education level aligns: '{education_level}' accepted")
            matched_count += 1
        elif "phd" in ed_lower and ("doctor" in eligibility_blob or "phd" in eligibility_blob):
            matched_criteria.append("Doctoral / PhD criteria matched")
            matched_count += 1
        elif "master" in ed_lower and "master" in eligibility_blob:
            matched_criteria.append("Master's programme criteria matched")
            matched_count += 1
        elif "undergrad" in ed_lower and ("undergrad" in eligibility_blob or "bachelor" in eligibility_blob):
            matched_criteria.append("Undergraduate criteria matched")
            matched_count += 1
        else:
            potential_conflicts.append(f"Education level: published notice specifies '{notice.education_level}'")

    # 2. Discipline / Academic Field Check
    if discipline:
        total_checks += 1
        disc_lower = discipline.lower()
        if "all fields" in notice.discipline.lower() or "all disciplines" in notice.discipline.lower():
            matched_criteria.append("Open to all academic disciplines")
            matched_count += 1
        elif disc_lower in eligibility_blob or any(word in eligibility_blob for word in disc_lower.split() if len(word) > 3):
            matched_criteria.append(f"Discipline area aligns with '{discipline}'")
            matched_count += 1
        else:
            potential_conflicts.append(f"Discipline: announcement targets '{notice.discipline}'")

    # 3. Citizenship / Residency Check
    if citizenship:
        total_checks += 1
        cit_lower = citizenship.lower()
        if "any nationality" in eligibility_blob or "international" in eligibility_blob or "worldwide" in eligibility_blob:
            matched_criteria.append("Open to international applicants / any nationality")
            matched_count += 1
        elif "u.s. citizen" in eligibility_blob or "us citizen" in eligibility_blob:
            if "us" in cit_lower or "united states" in cit_lower or "american" in cit_lower:
                matched_criteria.append("U.S. citizenship criteria satisfied")
                matched_count += 1
            else:
                potential_conflicts.append("Requires U.S. citizenship or permanent residency")
        else:
            matched_criteria.append("No restrictive citizenship criteria explicitly cited")
            matched_count += 1

    # 4. Target Study Destination
    if study_country_interest:
        total_checks += 1
        dest_lower = study_country_interest.lower()
        if dest_lower in notice.region.lower() or "international" in notice.region.lower():
            matched_criteria.append(f"Host region includes '{study_country_interest}'")
            matched_count += 1
        else:
            potential_conflicts.append(f"Destination: notice is located in '{notice.region}'")

    if total_checks == 0:
        score = 100
        matched_criteria.append("No student preference filters applied; all criteria viewable on official page.")
    else:
        score = int((matched_count / total_checks) * 100)

    return EligibilityMatchResult(
        notice_id=notice.id,
        notice_title=notice.title,
        match_score=score,
        matched_criteria=matched_criteria,
        potential_conflicts=potential_conflicts,
        disclaimer=DISCLAIMER_TEXT
    )
