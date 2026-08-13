"""Pydantic Schemas for Authentication & User."""

from datetime import datetime
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str | None = None


class UserResponse(BaseModel):
    id: str
    email: EmailStr
    full_name: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    """Request body for POST /api/auth/login."""
    email: EmailStr
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    """Response body returned on successful login."""
    token: str
    expires_at: datetime


class RegisterRequest(BaseModel):
    """Request body for POST /api/auth/register."""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Minimum 8 characters")
    full_name: str | None = None


class RegisterResponse(BaseModel):
    """Response body returned on successful registration."""
    id: str
    email: EmailStr
    full_name: str | None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
