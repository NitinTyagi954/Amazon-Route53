"""FastAPI Router for Authentication."""

import secrets
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session as DBSession

from app.dependencies import get_db, get_current_session
from app.models.session import Session as SessionModel
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, RegisterResponse
from app.services.auth import authenticate_user
from app.repositories.user import UserRepository
from app.core.security import hash_password
from sqlalchemy.exc import IntegrityError

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


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    session_row: SessionModel = Depends(get_current_session),
    db: DBSession = Depends(get_db),
) -> Response:
    """Invalidate the current session."""
    db.delete(session_row)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(
    body: RegisterRequest,
    db: DBSession = Depends(get_db),
) -> RegisterResponse:
    """Create a new user account. Does not create a session — client must login separately."""
    try:
        user = UserRepository.create(
            session=db,
            email=body.email,
            hashed_password=hash_password(body.password),
            full_name=body.full_name,
        )
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )
