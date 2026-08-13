"""FastAPI Router for Route 53 Hosted Zones."""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db
from app.repositories.hosted_zone import HostedZoneRepository
from app.schemas.hosted_zone import HostedZoneResponse

router = APIRouter(prefix="/api/hosted-zones", tags=["Hosted Zones"])


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
