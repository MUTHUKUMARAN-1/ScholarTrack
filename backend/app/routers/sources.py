from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.source import Source
from app.models.collection_run import CollectionRun
from app.schemas.source import SourceResponse
from app.schemas.admin import CollectionRunResponse

router = APIRouter(prefix="/sources", tags=["Sources"])


@router.get("", response_model=List[SourceResponse])
def list_sources(db: Session = Depends(get_db)):
    sources = db.query(Source).all()
    return sources


@router.get("/{source_id}", response_model=SourceResponse)
def get_source(source_id: int, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found.")
    return source


@router.get("/{source_id}/runs", response_model=List[CollectionRunResponse])
def get_source_runs(source_id: int, db: Session = Depends(get_db)):
    source = db.query(Source).filter(Source.id == source_id).first()
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found.")
    
    runs = db.query(CollectionRun).filter(CollectionRun.source_id == source_id).order_by(CollectionRun.start_time.desc()).limit(20).all()
    result = []
    for r in runs:
        item = CollectionRunResponse(
            id=r.id,
            source_id=r.source_id,
            source_name=source.name,
            start_time=r.start_time,
            completion_time=r.completion_time,
            status=r.status,
            records_processed=r.records_processed,
            records_added=r.records_added,
            records_updated=r.records_updated,
            diagnostic_info=r.diagnostic_info
        )
        result.append(item)
    return result
