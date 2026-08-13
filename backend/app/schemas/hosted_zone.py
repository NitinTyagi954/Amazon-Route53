"""Pydantic Schemas for Hosted Zone."""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class HostedZoneBase(BaseModel):
    name: str = Field(..., example="example.com.")
    comment: str | None = Field(default=None, example="Primary zone")
    is_private: bool = Field(default=False)


class HostedZoneCreate(HostedZoneBase):
    caller_reference: str = Field(..., example="ref-20260813-001")


class HostedZoneResponse(HostedZoneBase):
    id: str
    user_id: str
    caller_reference: str
    record_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
