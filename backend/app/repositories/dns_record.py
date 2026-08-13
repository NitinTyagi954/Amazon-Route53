"""DNS Record Repository Data Access Layer."""

from typing import List, Optional
from sqlalchemy import select
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
    def list_by_zone(session: Session, hosted_zone_id: str) -> List[DNSRecord]:
        stmt = select(DNSRecord).where(DNSRecord.hosted_zone_id == hosted_zone_id)
        return list(session.scalars(stmt).all())

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
