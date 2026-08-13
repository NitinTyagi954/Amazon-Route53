"""Models package importing all ORM models for easy access and Alembic metadata collection."""

from backend.app.database.base import Base
from backend.app.models.user import User
from backend.app.models.session import Session
from backend.app.models.hosted_zone import HostedZone
from backend.app.models.dns_record import DNSRecord

__all__ = [
    "Base",
    "User",
    "Session",
    "HostedZone",
    "DNSRecord",
]
