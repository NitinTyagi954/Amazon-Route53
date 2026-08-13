"""FastAPI Router for Authentication."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_db
from app.models.session import Session as SessionModel
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.auth import authenticate_user

# Default session lifetime: 24 hours
SESSION_LIFETIME_HOURS = 24

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=LoginResponse)
def login(
    body: LoginRequest,
    db: DBSession = Depends(get_db),
) -> LoginResponse:
    """Authenticate with email + password and receive a session token."""
    user = authenticate_user(db, body.email, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=SESSION_LIFETIME_HOURS)

    session = SessionModel(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
    )
    db.add(session)
    db.commit()

    return LoginResponse(token=token, expires_at=expires_at)
