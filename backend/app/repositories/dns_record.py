from typing import List, Optional, Tuple
from sqlalchemy import select, or_, func
from sqlalchemy.orm import Session

from app.models.dns_record import DNSRecord, VALID_RECORD_TYPES
from app.models.hosted_zone import HostedZone


class DNSRecordRepository:
    """Encapsulates data access logic for DNSRecord entity."""

    @staticmethod
    def create(
        session: Session,
        hosted_zone_id: str,
        name: str,
        type: str,
        value: str,
        ttl: int = 300,
        is_system_record: bool = False,
    ) -> DNSRecord:
        upper_type = type.upper()
        if upper_type not in VALID_RECORD_TYPES:
            allowed = ", ".join(sorted(VALID_RECORD_TYPES))
            raise ValueError(f"Invalid DNS record type '{type}'. Allowed types are: {allowed}")

        record = DNSRecord(
            hosted_zone_id=hosted_zone_id,
            name=name if name.endswith(".") else f"{name}.",
            type=upper_type,
            value=value,
            ttl=ttl,
            is_system_record=is_system_record,
        )
        session.add(record)

        # Update zone record count
        zone = session.get(HostedZone, hosted_zone_id)
        if zone:
            zone.record_count += 1

        session.flush()
        return record

    @staticmethod
    def get_by_id(session: Session, record_id: int) -> Optional[DNSRecord]:
        return session.get(DNSRecord, record_id)

    @staticmethod
    def list_by_zone(session: Session, hosted_zone_id: str, search: Optional[str] = None) -> List[DNSRecord]:
        stmt = select(DNSRecord).where(DNSRecord.hosted_zone_id == hosted_zone_id)
        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(or_(DNSRecord.name.ilike(term), DNSRecord.value.ilike(term)))
        return list(session.scalars(stmt).all())

    @staticmethod
    def list_paginated_by_zone(
        session: Session,
        hosted_zone_id: str,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 10,
    ) -> Tuple[List[DNSRecord], int]:
        stmt = select(DNSRecord).where(DNSRecord.hosted_zone_id == hosted_zone_id)
        if search and search.strip():
            term = f"%{search.strip()}%"
            stmt = stmt.where(or_(DNSRecord.name.ilike(term), DNSRecord.value.ilike(term)))

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = session.scalar(count_stmt) or 0

        offset = (page - 1) * limit
        stmt = stmt.offset(offset).limit(limit)
        items = list(session.scalars(stmt).all())

        return items, total



    @staticmethod
    def update(
        session: Session,
        record_id: int,
        name: Optional[str] = None,
        type: Optional[str] = None,
        ttl: Optional[int] = None,
        value: Optional[str] = None,
        allow_system_update: bool = False,
    ) -> Optional[DNSRecord]:
        record = session.get(DNSRecord, record_id)
        if not record:
            return None

        if record.is_system_record and not allow_system_update:
            raise ValueError("Cannot modify system-generated SOA or NS records.")

        if type is not None:
            upper_type = type.upper()
            if upper_type not in VALID_RECORD_TYPES:
                allowed = ", ".join(sorted(VALID_RECORD_TYPES))
                raise ValueError(f"Invalid DNS record type '{type}'. Allowed types are: {allowed}")
            record.type = upper_type

        if name is not None:
            record.name = name if name.endswith(".") else f"{name}."
        if ttl is not None:
            if ttl < 0:
                raise ValueError("TTL must be greater than or equal to 0.")
            record.ttl = ttl
        if value is not None:
            record.value = value

        session.flush()
        return record

    @staticmethod
    def delete(session: Session, record_id: int, allow_system_delete: bool = False) -> bool:
        record = session.get(DNSRecord, record_id)
        if record:
            if record.is_system_record and not allow_system_delete:
                raise ValueError("Cannot delete system-generated SOA or NS records.")
            
            zone = session.get(HostedZone, record.hosted_zone_id)
            if zone and zone.record_count > 0:
                zone.record_count -= 1
            session.delete(record)
            session.flush()
            return True
        return False

