"""Schemas package."""

from app.schemas.auth import UserCreate, UserResponse, TokenResponse
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneResponse
from app.schemas.dns_record import DNSRecordCreate, DNSRecordResponse

__all__ = [
    "UserCreate",
    "UserResponse",
    "TokenResponse",
    "HostedZoneCreate",
    "HostedZoneResponse",
    "DNSRecordCreate",
    "DNSRecordResponse",
]
