"""FastAPI Application Dependencies.

Exposes reusable dependencies for database session injection and authentication.
"""

from datetime import datetime, timezone
from typing import Generator

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.session import Session as SessionModel
from app.models.user import User

# Scheme that extracts the Bearer token from the Authorization header.
# auto_error=False lets us return a custom 401 instead of the default 403.
_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Resolve and return the authenticated User from a Bearer session token.

    Raises HTTP 401 when:
    - the Authorization header is missing or malformed,
    - the token does not match any session row,
    - the session has expired, or
    - the associated user account is inactive.
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token.",
        )

    token = credentials.credentials
    stmt = select(SessionModel).where(SessionModel.token == token)
    session_row = db.scalar(stmt)

    if session_row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
        )

    if session_row.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired.",
        )

    user = session_row.user
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive.",
        )

    return user


__all__ = ["get_db", "get_current_user"]
