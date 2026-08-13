"""FastAPI Router for Route 53 DNS Records."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.repositories.dns_record import DNSRecordRepository
from app.schemas.dns_record import DNSRecordResponse

router = APIRouter(prefix="/api/records", tags=["DNS Records"])


@router.get("/{record_id}", response_model=DNSRecordResponse)
def get_dns_record(
    record_id: int,
    db: Session = Depends(get_db),
) -> DNSRecordResponse:
    """Retrieve a single DNS record by ID."""
    record = DNSRecordRepository.get_by_id(db, record_id=record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DNS record with ID '{record_id}' not found.",
        )
    return record
