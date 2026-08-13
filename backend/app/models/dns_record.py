"""DNS Record ORM Model."""

from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.database.base import Base

if TYPE_CHECKING:
    from backend.app.models.hosted_zone import HostedZone


VALID_RECORD_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"}


class DNSRecord(Base):
    """DNS Resource Record Set entity inside a Hosted Zone."""

    __tablename__ = "dns_records"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        autoincrement=True,
        comment="Unique record ID",
    )
    hosted_zone_id: Mapped[str] = mapped_column(
        String(64),
        ForeignKey("hosted_zones.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Parent hosted zone ID",
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="Record name (e.g. api.example.com.)",
    )
    type: Mapped[str] = mapped_column(
        String(10),
        nullable=False,
        index=True,
        comment="DNS Record Type (A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA, SOA)",
    )
    ttl: Mapped[int] = mapped_column(
        Integer,
        default=300,
        nullable=False,
        comment="Time To Live in seconds",
    )
    value: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Record value text or JSON array string",
    )
    is_system_record: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Flag indicating system-generated SOA or NS records",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    hosted_zone: Mapped["HostedZone"] = relationship("HostedZone", back_populates="dns_records")

    def __repr__(self) -> str:
        return f"<DNSRecord(id={self.id}, name='{self.name}', type='{self.type}', is_system={self.is_system_record})>"
