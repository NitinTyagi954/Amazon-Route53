"""Pydantic Schemas for DNS Records."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class DNSRecordBase(BaseModel):
    name: str = Field(..., example="api.example.com.")
    type: str = Field(..., example="A")
    ttl: int = Field(default=300, ge=0)
    value: str = Field(..., example="192.0.2.1")


class DNSRecordCreate(DNSRecordBase):
    hosted_zone_id: str
    is_system_record: bool = False


class DNSRecordResponse(DNSRecordBase):
    id: int
    hosted_zone_id: str
    is_system_record: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
