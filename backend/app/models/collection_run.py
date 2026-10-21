from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class CollectionRun(Base):
    __tablename__ = "collection_runs"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True)
    start_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completion_time = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(50), nullable=False, default="running")  # running, success, partial_failure, failed
    records_processed = Column(Integer, nullable=False, default=0)
    records_added = Column(Integer, nullable=False, default=0)
    records_updated = Column(Integer, nullable=False, default=0)
    diagnostic_info = Column(Text, nullable=True)

    # Relationships
    source = relationship("Source", back_populates="collection_runs")
