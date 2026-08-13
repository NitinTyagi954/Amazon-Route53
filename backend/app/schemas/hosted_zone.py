"""Pydantic Schemas for Hosted Zone."""

import re
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator


class HostedZoneBase(BaseModel):
    name: str = Field(..., json_schema_extra={"example": "example.com."})
    comment: str | None = Field(default=None, json_schema_extra={"example": "Primary zone"})
    is_private: bool = Field(default=False)

    @field_validator("name")
    @classmethod
    def validate_domain_name(cls, v: str) -> str:
        if not v or not isinstance(v, str):
            raise ValueError("Domain name must not be empty.")
        name = v.strip()
        if not name:
            raise ValueError("Domain name must not be blank.")

        check_name = name[:-1] if name.endswith(".") else name
        if len(check_name) < 1 or len(check_name) > 253:
            raise ValueError("Domain name length must be between 1 and 253 characters.")

        labels = check_name.split(".")
        if len(labels) < 1:
            raise ValueError("Domain name must contain at least one label.")

        label_regex = re.compile(r"^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$")
        for label in labels:
            if not label or len(label) > 63:
                raise ValueError(f"Invalid label '{label}' in domain name.")
            if not label_regex.match(label):
                raise ValueError(f"Invalid characters or formatting in label '{label}'.")

        return name


class HostedZoneCreate(HostedZoneBase):
    caller_reference: str | None = Field(default=None, json_schema_extra={"example": "ref-20260813-001"})
    user_id: str | None = Field(default=None, json_schema_extra={"example": "usr_123456"})


class HostedZoneUpdate(BaseModel):
    name: str | None = Field(default=None, json_schema_extra={"example": "updated-domain.com."})
    comment: str | None = Field(default=None, json_schema_extra={"example": "Updated zone comment"})
    is_private: bool | None = Field(default=None)

    @field_validator("name")
    @classmethod
    def validate_domain_name(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not isinstance(v, str):
            raise ValueError("Domain name must be a string.")
        name = v.strip()
        if not name:
            raise ValueError("Domain name must not be blank.")

        check_name = name[:-1] if name.endswith(".") else name
        if len(check_name) < 1 or len(check_name) > 253:
            raise ValueError("Domain name length must be between 1 and 253 characters.")

        labels = check_name.split(".")
        if len(labels) < 1:
            raise ValueError("Domain name must contain at least one label.")

        label_regex = re.compile(r"^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$")
        for label in labels:
            if not label or len(label) > 63:
                raise ValueError(f"Invalid label '{label}' in domain name.")
            if not label_regex.match(label):
                raise ValueError(f"Invalid characters or formatting in label '{label}'.")

        return name


class HostedZoneResponse(HostedZoneBase):
    id: str
    user_id: str
    caller_reference: str
    record_count: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


