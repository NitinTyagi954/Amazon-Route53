"""FastAPI Router for Route 53 DNS Records."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.repositories.dns_record import DNSRecordRepository
from app.schemas.dns_record import DNSRecordUpdate, DNSRecordResponse

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


@router.put("/{record_id}", response_model=DNSRecordResponse)
def update_dns_record(
    record_id: int,
    record_in: DNSRecordUpdate,
    db: Session = Depends(get_db),
) -> DNSRecordResponse:
    """Update editable fields of an existing DNS record by ID."""
    record = DNSRecordRepository.get_by_id(db, record_id=record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DNS record with ID '{record_id}' not found.",
        )

    if record.is_system_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify system-generated SOA or NS records.",
        )

    try:
        updated_record = DNSRecordRepository.update(
            session=db,
            record_id=record_id,
            name=record_in.name,
            type=record_in.type,
            ttl=record_in.ttl,
            value=record_in.value,
        )
        db.commit()
        db.refresh(updated_record)
        return updated_record
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_dns_record(
    record_id: int,
    db: Session = Depends(get_db),
) -> None:
    """Delete a DNS record by ID."""
    record = DNSRecordRepository.get_by_id(db, record_id=record_id)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"DNS record with ID '{record_id}' not found.",
        )

    if record.is_system_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete system-generated SOA or NS records.",
        )

    try:
        DNSRecordRepository.delete(db, record_id=record_id)
        db.commit()
        return None
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


