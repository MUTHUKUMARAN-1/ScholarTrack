from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    official_url = Column(String(1024), nullable=False)
    source_type = Column(String(50), nullable=False, default="html_catalog")  # rss, html_catalog, api
    permission_status = Column(String(50), nullable=False, default="public_allowed")
    enabled_status = Column(Boolean, nullable=False, default=True)
    last_checked = Column(DateTime(timezone=True), nullable=True)
    last_status = Column(String(50), nullable=False, default="pending")  # pending, success, error, partial_failure
    last_error = Column(Text, nullable=True)
    records_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    notices = relationship("Notice", back_populates="source", cascade="all, delete-orphan")
    collection_runs = relationship("CollectionRun", back_populates="source", cascade="all, delete-orphan")
