from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class NoticeBase(BaseModel):
    title: str
    provider: str
    canonical_url: str
    notice_type: str = "scholarship"
    education_level: str = "all"
    discipline: str = "All Fields"
    region: str = "International"
    benefit_text: Optional[str] = None
    eligibility_text: Optional[str] = None
    eligibility_tags: Optional[List[str]] = None
    deadline: Optional[datetime] = None
    timezone: str = "UTC"
    deadline_raw_text: Optional[str] = None
    notice_status: str = "unverified"
    excerpt: Optional[str] = None
    is_demo: bool = False


class NoticeCreate(NoticeBase):
    source_id: int
    content_hash: str


class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    notice_status: Optional[str] = None
    verification_timestamp: Optional[datetime] = None
    benefit_text: Optional[str] = None
    eligibility_text: Optional[str] = None
    deadline: Optional[datetime] = None
    timezone: Optional[str] = None


class NoticeResponse(NoticeBase):
    id: int
    source_id: int
    capture_timestamp: datetime
    verification_timestamp: Optional[datetime] = None
    content_hash: str
    created_at: datetime
    updated_at: datetime
    
    # Calculated fields for convenience
    is_closing_soon: Optional[bool] = None
    days_remaining: Optional[int] = None
    source_name: Optional[str] = None
    source_last_checked: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NoticeDetailResponse(NoticeResponse):
    change_history_count: int = 0
    change_history: List[Dict[str, Any]] = []


class NoticeFilterParams(BaseModel):
    search: Optional[str] = None
    provider: Optional[str] = None
    education_level: Optional[str] = None
    discipline: Optional[str] = None
    region: Optional[str] = None
    notice_type: Optional[str] = None
    notice_status: Optional[str] = None
    deadline_status: Optional[str] = None  # upcoming, closing_soon, rolling, past, all
    sort_by: Optional[str] = "deadline_asc"  # deadline_asc, deadline_desc, updated_desc, title_asc
    page: int = 1
    page_size: int = 12


class NoticeListResponse(BaseModel):
    items: List[NoticeResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class DashboardStatsResponse(BaseModel):
    total_opportunities: int
    upcoming_deadlines: int
    closing_soon: int
    recently_updated: int
    verified_count: int
    unverified_count: int
    stale_count: int
    withdrawn_count: int
    sources_count: int
    last_collection_timestamp: Optional[datetime] = None
