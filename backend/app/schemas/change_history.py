from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ChangeHistoryResponse(BaseModel):
    id: int
    notice_id: int
    previous_deadline: Optional[datetime] = None
    updated_deadline: Optional[datetime] = None
    changed_fields: Dict[str, Any]
    detected_timestamp: datetime
    source_reference: Optional[str] = None
    notice_title: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
