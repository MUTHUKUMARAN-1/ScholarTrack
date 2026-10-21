from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AlertResponse(BaseModel):
    id: int
    notice_id: int
    change_id: Optional[int] = None
    alert_type: str
    title: str
    message: str
    deduplication_key: str
    is_read: bool
    creation_timestamp: datetime
    
    # Associated notice brief
    notice_title: Optional[str] = None
    canonical_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
