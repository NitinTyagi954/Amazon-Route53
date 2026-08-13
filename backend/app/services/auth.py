"""Authentication service.

Provides credential-based user authentication by combining
UserRepository lookups with the bcrypt password verification
from app.core.security.  No routes, sessions, or tokens are
defined here — this is purely the domain logic layer.
"""

from typing import Optional
from sqlalchemy.orm import Session

from app.core.security import verify_password
from app.models.user import User
from app.repositories.user import UserRepository


def authenticate_user(
    session: Session,
    email: str,
    password: str,
) -> Optional[User]:
    """Validate *email* + *password* and return the User on success.

    Returns ``None`` when:
    - no user with the given email exists,
    - the user account is inactive (``is_active is False``), or
    - the password does not match the stored hash.
    """
    user = UserRepository.get_by_email(session, email)
    if user is None:
        return None
    if not user.is_active:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
