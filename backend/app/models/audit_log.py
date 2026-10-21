from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(100), nullable=False)
    action = Column(String(100), nullable=False)
    target_entity = Column(String(100), nullable=False)
    target_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
