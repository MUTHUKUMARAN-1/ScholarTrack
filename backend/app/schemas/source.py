from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SourceBase(BaseModel):
    slug: str
    name: str
    official_url: str
    source_type: str = "html_catalog"
    permission_status: str = "public_allowed"
    enabled_status: bool = True


class SourceCreate(SourceBase):
    pass


class SourceUpdate(BaseModel):
    name: Optional[str] = None
    official_url: Optional[str] = None
    source_type: Optional[str] = None
    permission_status: Optional[str] = None
    enabled_status: Optional[bool] = None


class SourceResponse(SourceBase):
    id: int
    last_checked: Optional[datetime] = None
    last_status: str
    last_error: Optional[str] = None
    records_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
