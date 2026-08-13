"""FastAPI Router for Route 53 Hosted Zones."""

import random
import string
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_user
from app.models.user import User
from app.repositories.hosted_zone import HostedZoneRepository
from app.repositories.dns_record import DNSRecordRepository
from app.repositories.user import UserRepository
from app.schemas.hosted_zone import (
    HostedZoneCreate,
    HostedZoneUpdate,
    HostedZoneResponse,
    PaginatedHostedZoneResponse,
)
from app.schemas.dns_record import DNSRecordCreate, DNSRecordResponse, PaginatedDNSRecordResponse



router = APIRouter(prefix="/api/hosted-zones", tags=["Hosted Zones"])


def generate_zone_id() -> str:
    """Generate a Route 53-style Hosted Zone ID (e.g. Z0123456789ABC)."""
    chars = string.ascii_uppercase + string.digits
    return "Z" + "".join(random.choices(chars, k=13))


def generate_caller_reference() -> str:
    """Generate a unique caller reference idempotency token."""
    return f"ref-{uuid.uuid4().hex[:12]}"


@router.get("", response_model=PaginatedHostedZoneResponse)
@router.get("/", response_model=PaginatedHostedZoneResponse, include_in_schema=False)
def list_hosted_zones(
    user_id: Optional[str] = Query(None, description="Optional filter by owner User ID"),
    search: Optional[str] = Query(None, description="Optional case-insensitive search by domain name"),
    page: int = Query(1, ge=1, description="Page number (starting at 1)"),
    limit: int = Query(10, ge=1, le=100, description="Page size limit (1 to 100)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedHostedZoneResponse:
    """Retrieve paginated hosted zones, optionally filtered by user ID or domain name search query."""
    items, total = HostedZoneRepository.list_paginated(
        db, user_id=current_user.id, search=search, page=page, limit=limit
    )
    return PaginatedHostedZoneResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
    )




@router.post("", response_model=HostedZoneResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=HostedZoneResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_hosted_zone(
    zone_in: HostedZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HostedZoneResponse:
    """Create a new Route 53 Hosted Zone."""
    user_id = current_user.id

    caller_ref = zone_in.caller_reference or generate_caller_reference()

    zone_id = generate_zone_id()
    while HostedZoneRepository.get_by_id(db, zone_id):
        zone_id = generate_zone_id()

    try:
        zone = HostedZoneRepository.create(
            session=db,
            zone_id=zone_id,
            user_id=user_id,
            name=zone_in.name,
            caller_reference=caller_ref,
            comment=zone_in.comment,
            is_private=zone_in.is_private,
        )
        db.commit()
        db.refresh(zone)
        return zone
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A hosted zone with this caller reference already exists.",
        )


@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HostedZoneResponse:
    """Retrieve a single Hosted Zone by ID."""
    zone = HostedZoneRepository.get_by_id(db, zone_id=zone_id)
    if not zone or zone.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone '{zone_id}' not found.",
        )
    return zone


@router.put("/{zone_id}", response_model=HostedZoneResponse)
def update_hosted_zone(
    zone_id: str,
    zone_in: HostedZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> HostedZoneResponse:
    """Update editable fields of a Hosted Zone by ID."""
    zone = HostedZoneRepository.get_by_id(db, zone_id=zone_id)
    if not zone or zone.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone '{zone_id}' not found.",
        )

    updated_zone = HostedZoneRepository.update(
        session=db,
        zone_id=zone_id,
        name=zone_in.name,
        comment=zone_in.comment,
        is_private=zone_in.is_private,
    )
    db.commit()
    db.refresh(updated_zone)
    return updated_zone


@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    """Delete a Hosted Zone and its associated DNS records by ID."""
    zone = HostedZoneRepository.get_by_id(db, zone_id=zone_id)
    if not zone or zone.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone '{zone_id}' not found.",
        )
    HostedZoneRepository.delete(db, zone_id=zone_id)
    db.commit()
    return None


@router.get("/{zone_id}/records", response_model=PaginatedDNSRecordResponse)
def list_hosted_zone_records(
    zone_id: str,
    search: Optional[str] = Query(None, description="Optional case-insensitive search by record name or value"),
    page: int = Query(1, ge=1, description="Page number (starting at 1)"),
    limit: int = Query(10, ge=1, le=100, description="Page size limit (1 to 100)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> PaginatedDNSRecordResponse:
    """List paginated DNS records belonging to a specific Hosted Zone, with optional search query."""
    zone = HostedZoneRepository.get_by_id(db, zone_id=zone_id)
    if not zone or zone.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone '{zone_id}' not found.",
        )
    items, total = DNSRecordRepository.list_paginated_by_zone(
        db, hosted_zone_id=zone_id, search=search, page=page, limit=limit
    )
    return PaginatedDNSRecordResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
    )




@router.post("/{zone_id}/records", response_model=DNSRecordResponse, status_code=status.HTTP_201_CREATED)
def create_hosted_zone_record(
    zone_id: str,
    record_in: DNSRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DNSRecordResponse:
    """Create a new DNS record inside an existing Hosted Zone."""
    zone = HostedZoneRepository.get_by_id(db, zone_id=zone_id)
    if not zone or zone.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone '{zone_id}' not found.",
        )

    try:
        record = DNSRecordRepository.create(
            session=db,
            hosted_zone_id=zone_id,
            name=record_in.name,
            type=record_in.type,
            value=record_in.value,
            ttl=record_in.ttl,
            is_system_record=record_in.is_system_record,
        )
        db.commit()
        db.refresh(record)
        return record
    except ValueError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e),
        )






