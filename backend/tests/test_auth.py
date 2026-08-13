"""Tests for app.services.auth authentication service."""

from app.core.security import hash_password
from app.repositories.user import UserRepository
from app.services.auth import authenticate_user


def test_authenticate_user_success(db_session):
    """Valid email + correct password returns the User object."""
    plain = "supersecret123"
    UserRepository.create(
        session=db_session,
        email="auth@example.com",
        hashed_password=hash_password(plain),
        full_name="Auth User",
    )

    user = authenticate_user(db_session, "auth@example.com", plain)
    assert user is not None
    assert user.email == "auth@example.com"
    assert user.full_name == "Auth User"


def test_authenticate_user_wrong_password(db_session):
    """Correct email but wrong password returns None."""
    UserRepository.create(
        session=db_session,
        email="wrongpw@example.com",
        hashed_password=hash_password("correctpassword"),
    )

    result = authenticate_user(db_session, "wrongpw@example.com", "wrongpassword")
    assert result is None


def test_authenticate_user_unknown_email(db_session):
    """Non-existent email returns None without raising."""
    result = authenticate_user(db_session, "nobody@example.com", "anypassword")
    assert result is None


def test_authenticate_user_inactive(db_session):
    """Inactive user returns None even when password is correct."""
    plain = "validpassword"
    user = UserRepository.create(
        session=db_session,
        email="inactive@example.com",
        hashed_password=hash_password(plain),
    )
    user.is_active = False
    db_session.flush()

    result = authenticate_user(db_session, "inactive@example.com", plain)
    assert result is None
