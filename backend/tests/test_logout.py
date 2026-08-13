"""Tests for POST /api/auth/logout endpoint."""

from datetime import datetime, timedelta, timezone

from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.dependencies import get_db
from app.main import app
from app.models.session import Session as SessionModel
from app.repositories.user import UserRepository

client = TestClient(app)


def test_logout_success(db_session):
    """Valid session token logs out and invalidates the session."""
    plain = "correctpassword"
    user = UserRepository.create(
        session=db_session,
        email="logout@example.com",
        hashed_password=hash_password(plain),
        full_name="Logout User",
    )
    
    token = "test_valid_token_for_logout"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    session = SessionModel(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
    )
    db_session.add(session)
    db_session.commit()

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        # Logout using the token
        res = client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 204

        # Ensure token is invalid now
        res2 = client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res2.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_logout_invalid_token(db_session):
    """Invalid session token returns 401."""
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        res = client.post(
            "/api/auth/logout",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert res.status_code == 401
    finally:
        app.dependency_overrides.clear()


def test_logout_expired_token(db_session):
    """Expired session token returns 401."""
    plain = "correctpassword"
    user = UserRepository.create(
        session=db_session,
        email="expired@example.com",
        hashed_password=hash_password(plain),
        full_name="Expired User",
    )
    
    token = "test_expired_token"
    # Set to past expiration
    expires_at = datetime.now(timezone.utc) - timedelta(hours=1)
    session = SessionModel(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
    )
    db_session.add(session)
    db_session.commit()

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        res = client.post(
            "/api/auth/logout",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 401
    finally:
        app.dependency_overrides.clear()
