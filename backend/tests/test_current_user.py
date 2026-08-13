"""Tests for the get_current_user authentication dependency."""

from datetime import datetime, timedelta, timezone

from fastapi import Depends
from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.dependencies import get_db, get_current_user
from app.main import app
from app.models.session import Session as SessionModel
from app.models.user import User
from app.repositories.user import UserRepository

client = TestClient(app)

# ---------------------------------------------------------------------------
# Register a tiny test-only route that exercises the dependency.
# ---------------------------------------------------------------------------
@app.get("/test/me", tags=["Test"])
def _test_me(user: User = Depends(get_current_user)):
    return {"user_id": user.id, "email": user.email}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _create_user_and_session(db, *, is_active=True, expired=False):
    """Seed a user + session and return (user, token)."""
    user = UserRepository.create(
        session=db,
        email=f"dep-{id(db)}@example.com",
        hashed_password=hash_password("password"),
    )
    if not is_active:
        user.is_active = False

    if expired:
        exp = datetime.now(timezone.utc) - timedelta(hours=1)
    else:
        exp = datetime.now(timezone.utc) + timedelta(hours=24)

    token = f"tok-{id(db)}"
    sess = SessionModel(user_id=user.id, token=token, expires_at=exp)
    db.add(sess)
    db.flush()
    return user, token


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------
def test_get_current_user_valid_token(db_session):
    """A valid, non-expired token for an active user returns the user."""
    user, token = _create_user_and_session(db_session)

    def _override():
        yield db_session

    app.dependency_overrides[get_db] = _override
    try:
        res = client.get("/test/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 200
        data = res.json()
        assert data["user_id"] == user.id
        assert data["email"] == user.email
    finally:
        app.dependency_overrides.clear()


def test_get_current_user_missing_header(db_session):
    """No Authorization header returns 401."""
    def _override():
        yield db_session

    app.dependency_overrides[get_db] = _override
    try:
        res = client.get("/test/me")
        assert res.status_code == 401
        assert "missing" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_get_current_user_invalid_token(db_session):
    """A token that does not exist in the sessions table returns 401."""
    def _override():
        yield db_session

    app.dependency_overrides[get_db] = _override
    try:
        res = client.get("/test/me", headers={"Authorization": "Bearer bogus-token"})
        assert res.status_code == 401
        assert "invalid" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_get_current_user_expired_session(db_session):
    """An expired session token returns 401."""
    _, token = _create_user_and_session(db_session, expired=True)

    def _override():
        yield db_session

    app.dependency_overrides[get_db] = _override
    try:
        res = client.get("/test/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 401
        assert "expired" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_get_current_user_inactive_user(db_session):
    """A valid session for an inactive user returns 401."""
    _, token = _create_user_and_session(db_session, is_active=False)

    def _override():
        yield db_session

    app.dependency_overrides[get_db] = _override
    try:
        res = client.get("/test/me", headers={"Authorization": f"Bearer {token}"})
        assert res.status_code == 401
        assert "inactive" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()
