"""Models package importing all ORM models for easy access and Alembic metadata collection."""

from app.database.base import Base
from app.models.user import User
from app.models.session import Session
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord

__all__ = [
    "Base",
    "User",
    "Session",
    "HostedZone",
    "DNSRecord",
]
