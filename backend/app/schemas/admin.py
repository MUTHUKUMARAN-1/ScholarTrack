from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CollectionRunResponse(BaseModel):
    id: int
    source_id: int
    source_name: Optional[str] = None
    start_time: datetime
    completion_time: Optional[datetime] = None
    status: str
    records_processed: int
    records_added: int
    records_updated: int
    diagnostic_info: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    username: str
    action: str
    target_entity: str
    target_id: Optional[int] = None
    details: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)


class NoticeStatusUpdate(BaseModel):
    notice_status: str  # verified, unverified, stale, withdrawn
    reason: Optional[str] = None


class NoticeManualDeadlineUpdate(BaseModel):
    deadline: Optional[datetime] = None
    timezone: Optional[str] = "UTC"
    reason: str


class EligibilityMatchRequest(BaseModel):
    education_level: Optional[str] = None
    discipline: Optional[str] = None
    citizenship: Optional[str] = None
    study_country_interest: Optional[str] = None


class EligibilityMatchResult(BaseModel):
    notice_id: int
    notice_title: str
    match_score: int  # 0 to 100 percentage
    matched_criteria: List[str]
    potential_conflicts: List[str]
    disclaimer: str
