from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class ChangeHistory(Base):
    __tablename__ = "change_history"

    id = Column(Integer, primary_key=True, index=True)
    notice_id = Column(Integer, ForeignKey("notices.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_deadline = Column(DateTime(timezone=True), nullable=True)
    updated_deadline = Column(DateTime(timezone=True), nullable=True)
    changed_fields = Column(JSON, nullable=False)  # {"deadline": {"old": ..., "new": ...}, "fields": [...]}
    detected_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    source_reference = Column(String(512), nullable=True)

    # Relationships
    notice = relationship("Notice", back_populates="change_history")
    alerts = relationship("Alert", back_populates="change")
