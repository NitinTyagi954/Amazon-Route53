from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.dns_record import VALID_RECORD_TYPES

RecordTypeLiteral = Literal["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"]


class DNSRecordBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "api.example.com."})
    type: str = Field(..., json_schema_extra={"example": "A"})
    ttl: int = Field(default=300, ge=0)
    value: str = Field(..., json_schema_extra={"example": "192.0.2.1"})

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str) -> str:
        upper_v = v.upper()
        if upper_v not in VALID_RECORD_TYPES:
            allowed = ", ".join(sorted(VALID_RECORD_TYPES))
            raise ValueError(f"Invalid DNS record type '{v}'. Allowed types are: {allowed}")
        return upper_v


class DNSRecordCreate(DNSRecordBase):
    hosted_zone_id: str | None = None
    is_system_record: bool = False


class DNSRecordUpdate(BaseModel):
    name: str | None = Field(default=None, json_schema_extra={"example": "api.example.com."})
    type: str | None = Field(default=None, json_schema_extra={"example": "A"})
    ttl: int | None = Field(default=None, ge=0)
    value: str | None = Field(default=None, json_schema_extra={"example": "192.0.2.1"})

    @field_validator("type")
    @classmethod
    def validate_type(cls, v: str | None) -> str | None:
        if v is None:
            return v
        upper_v = v.upper()
        if upper_v not in VALID_RECORD_TYPES:
            allowed = ", ".join(sorted(VALID_RECORD_TYPES))
            raise ValueError(f"Invalid DNS record type '{v}'. Allowed types are: {allowed}")
        return upper_v


class DNSRecordResponse(DNSRecordBase):
    id: int
    hosted_zone_id: str
    is_system_record: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PaginatedDNSRecordResponse(BaseModel):
    items: list[DNSRecordResponse]
    total: int = Field(..., description="Total count of matching DNS records")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Page size limit")



