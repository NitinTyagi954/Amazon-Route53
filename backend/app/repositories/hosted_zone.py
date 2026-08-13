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
    def list_by_user(
        session: Session, user_id: str, search: Optional[str] = None, limit: int = 100, offset: int = 0
    ) -> List[HostedZone]:
        stmt = select(HostedZone).where(HostedZone.user_id == user_id)
        if search and search.strip():
            stmt = stmt.where(HostedZone.name.ilike(f"%{search.strip()}%"))
        stmt = stmt.limit(limit).offset(offset)
        return list(session.scalars(stmt).all())

    @staticmethod
    def list_all(session: Session, search: Optional[str] = None) -> List[HostedZone]:
        stmt = select(HostedZone)
        if search and search.strip():
            stmt = stmt.where(HostedZone.name.ilike(f"%{search.strip()}%"))
        return list(session.scalars(stmt).all())


    @staticmethod
    def update(
        session: Session,
        zone_id: str,
        name: Optional[str] = None,
        comment: Optional[str] = None,
        is_private: Optional[bool] = None,
    ) -> Optional[HostedZone]:
        zone = session.get(HostedZone, zone_id)
        if not zone:
            return None
        if name is not None:
            zone.name = name if name.endswith(".") else f"{name}."
        if comment is not None:
            zone.comment = comment
        if is_private is not None:
            zone.is_private = is_private
        session.flush()
        return zone

    @staticmethod
    def delete(session: Session, zone_id: str) -> bool:
        zone = session.get(HostedZone, zone_id)
        if zone:
            session.delete(zone)
            session.flush()
            return True
        return False

