"""Hosted Zone Repository Data Access Layer."""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.hosted_zone import HostedZone


class HostedZoneRepository:
    """Encapsulates data access logic for HostedZone entity."""

    @staticmethod
    def create(
        session: Session,
        zone_id: str,
        user_id: str,
        name: str,
        caller_reference: str,
        comment: Optional[str] = None,
        is_private: bool = False,
    ) -> HostedZone:
        zone = HostedZone(
            id=zone_id,
            user_id=user_id,
            name=name if name.endswith(".") else f"{name}.",
            caller_reference=caller_reference,
            comment=comment,
            is_private=is_private,
        )
        session.add(zone)
        session.flush()
        return zone

    @staticmethod
    def get_by_id(session: Session, zone_id: str) -> Optional[HostedZone]:
        return session.get(HostedZone, zone_id)

    @staticmethod
    def list_by_user(session: Session, user_id: str, limit: int = 100, offset: int = 0) -> List[HostedZone]:
        stmt = select(HostedZone).where(HostedZone.user_id == user_id).limit(limit).offset(offset)
        return list(session.scalars(stmt).all())

    @staticmethod
    def list_all(session: Session) -> List[HostedZone]:
        stmt = select(HostedZone)
        return list(session.scalars(stmt).all())

    @staticmethod
    def delete(session: Session, zone_id: str) -> bool:
        zone = session.get(HostedZone, zone_id)
        if zone:
            session.delete(zone)
            session.flush()
            return True
        return False
