"""FastAPI Router for Route 53 Hosted Zones."""

import random
import string
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.models.user import User
from app.repositories.hosted_zone import HostedZoneRepository
from app.repositories.user import UserRepository
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneResponse

router = APIRouter(prefix="/api/hosted-zones", tags=["Hosted Zones"])


def generate_zone_id() -> str:
    """Generate a Route 53-style Hosted Zone ID (e.g. Z0123456789ABC)."""
    chars = string.ascii_uppercase + string.digits
    return "Z" + "".join(random.choices(chars, k=13))


def generate_caller_reference() -> str:
    """Generate a unique caller reference idempotency token."""
    return f"ref-{uuid.uuid4().hex[:12]}"


@router.get("", response_model=List[HostedZoneResponse])
@router.get("/", response_model=List[HostedZoneResponse], include_in_schema=False)
def list_hosted_zones(
    user_id: Optional[str] = Query(None, description="Optional filter by owner User ID"),
    db: Session = Depends(get_db),
) -> List[HostedZoneResponse]:
    """Retrieve hosted zones for the user or all hosted zones if no filter provided."""
    if user_id:
        zones = HostedZoneRepository.list_by_user(db, user_id=user_id)
    else:
        zones = HostedZoneRepository.list_all(db)
    return zones


@router.post("", response_model=HostedZoneResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=HostedZoneResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_hosted_zone(
    zone_in: HostedZoneCreate,
    db: Session = Depends(get_db),
) -> HostedZoneResponse:
    """Create a new Route 53 Hosted Zone."""
    user_id = zone_in.user_id
    if not user_id:
        first_user = db.query(User).first()
        if first_user:
            user_id = first_user.id
        else:
            default_user = UserRepository.create(
                session=db,
                email="default@route53.local",
                hashed_password="defaultpasswordhash",
                full_name="Default Route53 User",
            )
            user_id = default_user.id
    else:
        existing_user = UserRepository.get_by_id(db, user_id)
        if not existing_user:
            existing_user = UserRepository.create(
                session=db,
                email=f"{user_id}@route53.local",
                hashed_password="defaultpasswordhash",
                full_name=f"User {user_id}",
            )
            user_id = existing_user.id

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
) -> HostedZoneResponse:
    """Retrieve a single Hosted Zone by ID."""
    zone = HostedZoneRepository.get_by_id(db, zone_id=zone_id)
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Hosted zone '{zone_id}' not found.",
        )
    return zone


