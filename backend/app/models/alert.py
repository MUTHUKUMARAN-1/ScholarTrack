from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    notice_id = Column(Integer, ForeignKey("notices.id", ondelete="CASCADE"), nullable=False, index=True)
    change_id = Column(Integer, ForeignKey("change_history.id", ondelete="SET NULL"), nullable=True, index=True)
    alert_type = Column(String(50), nullable=False)  # deadline_revision, status_withdrawn, details_updated, new_opportunity
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    deduplication_key = Column(String(255), unique=True, index=True, nullable=False)
    is_read = Column(Boolean, nullable=False, default=False)
    creation_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    notice = relationship("Notice", back_populates="alerts")
    change = relationship("ChangeHistory", back_populates="alerts")
