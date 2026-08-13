"""Tests for POST /api/auth/login endpoint."""

from datetime import datetime, timezone

from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.dependencies import get_db
from app.main import app
from app.repositories.user import UserRepository

client = TestClient(app)


def test_login_success(db_session):
    """Valid email + password returns 200 with a session token and expiration."""
    plain = "correctpassword"
    UserRepository.create(
        session=db_session,
        email="login@example.com",
        hashed_password=hash_password(plain),
        full_name="Login User",
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        res = client.post("/api/auth/login", json={
            "email": "login@example.com",
            "password": plain,
        })
        assert res.status_code == 200
        data = res.json()
        assert "token" in data
        assert len(data["token"]) > 20
        assert "expires_at" in data
        # expires_at must be in the future
        expires = datetime.fromisoformat(data["expires_at"])
        assert expires > datetime.now(timezone.utc)
    finally:
        app.dependency_overrides.clear()


def test_login_wrong_password(db_session):
    """Correct email but wrong password returns 401."""
    UserRepository.create(
        session=db_session,
        email="wrongpw@example.com",
        hashed_password=hash_password("realpassword"),
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        res = client.post("/api/auth/login", json={
            "email": "wrongpw@example.com",
            "password": "badpassword",
        })
        assert res.status_code == 401
        assert "invalid" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_login_unknown_email(db_session):
    """Non-existent email returns 401."""
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        res = client.post("/api/auth/login", json={
            "email": "nobody@example.com",
            "password": "anypassword",
        })
        assert res.status_code == 401
        assert "invalid" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_login_inactive_user(db_session):
    """Inactive user returns 401 even with correct password."""
    plain = "validpassword"
    user = UserRepository.create(
        session=db_session,
        email="inactive@example.com",
        hashed_password=hash_password(plain),
    )
    user.is_active = False
    db_session.flush()

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        res = client.post("/api/auth/login", json={
            "email": "inactive@example.com",
            "password": plain,
        })
        assert res.status_code == 401
        assert "invalid" in res.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()
