"""Schemas package."""

from backend.app.schemas.auth import UserCreate, UserResponse, TokenResponse
from backend.app.schemas.hosted_zone import HostedZoneCreate, HostedZoneResponse
from backend.app.schemas.dns_record import DNSRecordCreate, DNSRecordResponse

__all__ = [
    "UserCreate",
    "UserResponse",
    "TokenResponse",
    "HostedZoneCreate",
    "HostedZoneResponse",
    "DNSRecordCreate",
    "DNSRecordResponse",
]
