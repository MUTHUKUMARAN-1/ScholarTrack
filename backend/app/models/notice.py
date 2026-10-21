from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class Notice(Base):
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id", ondelete="CASCADE"), nullable=False, index=True)
    canonical_url = Column(String(1024), unique=True, index=True, nullable=False)
    title = Column(String(512), index=True, nullable=False)
    provider = Column(String(255), index=True, nullable=False)
    notice_type = Column(String(50), nullable=False, default="scholarship")  # scholarship, fellowship, grant
    education_level = Column(String(50), nullable=False, default="all")  # undergraduate, masters, phd, postdoc, all
    discipline = Column(String(100), nullable=False, default="All Fields")
    region = Column(String(100), nullable=False, default="International")
    benefit_text = Column(Text, nullable=True)
    eligibility_text = Column(Text, nullable=True)
    eligibility_tags = Column(JSON, nullable=True)  # JSON array of tags: ["masters", "stem", "us_citizen"]
    
    # Critical: deadline is nullable; timezone stored explicitly
    deadline = Column(DateTime(timezone=True), nullable=True, index=True)
    timezone = Column(String(50), nullable=False, default="UTC")
    deadline_raw_text = Column(String(255), nullable=True)

    capture_timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    verification_timestamp = Column(DateTime(timezone=True), nullable=True)
    content_hash = Column(String(64), index=True, nullable=False)
    notice_status = Column(String(50), nullable=False, default="unverified")  # verified, unverified, stale, withdrawn
    excerpt = Column(Text, nullable=True)
    is_demo = Column(Boolean, nullable=False, default=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    source = relationship("Source", back_populates="notices")
    change_history = relationship("ChangeHistory", back_populates="notice", cascade="all, delete-orphan", order_by="desc(ChangeHistory.detected_timestamp)")
    alerts = relationship("Alert", back_populates="notice", cascade="all, delete-orphan")
