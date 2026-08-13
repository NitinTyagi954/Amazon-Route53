"""Hosted Zone ORM Model."""

from datetime import datetime, timezone
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Boolean, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.dns_record import DNSRecord


class HostedZone(Base):
    """AWS Route 53 Hosted Zone entity."""

    __tablename__ = "hosted_zones"

    id: Mapped[str] = mapped_column(
        String(64),
        primary_key=True,
        comment="Unique zone identifier (e.g. Z0123456789ABCDEF)",
    )
    user_id: Mapped[str] = mapped_column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
        comment="Owner user ID",
    )
    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,
        comment="Domain name ending with dot (e.g. example.com.)",
    )
    caller_reference: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        nullable=False,
        comment="Idempotency token",
    )
    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Zone description or notes",
    )
    is_private: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Private VPC zone flag",
    )
    record_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False,
        comment="Number of DNS records in zone",
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
    user: Mapped["User"] = relationship("User", back_populates="hosted_zones")
    dns_records: Mapped[List["DNSRecord"]] = relationship(
        "DNSRecord",
        back_populates="hosted_zone",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<HostedZone(id='{self.id}', name='{self.name}')>"
