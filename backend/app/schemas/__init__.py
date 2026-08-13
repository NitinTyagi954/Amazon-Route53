"""Schemas package."""

from app.schemas.auth import UserCreate, UserResponse, TokenResponse
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneUpdate, HostedZoneResponse, PaginatedHostedZoneResponse
from app.schemas.dns_record import DNSRecordCreate, DNSRecordResponse

__all__ = [
    "UserCreate",
    "UserResponse",
    "TokenResponse",
    "HostedZoneCreate",
    "HostedZoneUpdate",
    "HostedZoneResponse",
    "PaginatedHostedZoneResponse",
    "DNSRecordCreate",
    "DNSRecordResponse",
]


