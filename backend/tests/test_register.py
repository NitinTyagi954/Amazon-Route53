"""Tests for POST /api/auth/register endpoint."""

import pytest
from fastapi.testclient import TestClient

from app.core.security import verify_password
from app.dependencies import get_db
from app.main import app
from app.repositories.user import UserRepository
from app.core.security import hash_password

client = TestClient(app)


def _override(db_session):
    def _get_db_override():
        yield db_session
    app.dependency_overrides[get_db] = _get_db_override


def _clear():
    app.dependency_overrides.clear()


def test_register_success(db_session):
    """Valid email + strong password creates a user and returns 201."""
    _override(db_session)
    try:
        res = client.post("/api/auth/register", json={
            "email": "newuser@example.com",
            "password": "StrongP@ss1",
        })
        assert res.status_code == 201, res.text
        data = res.json()
        assert data["email"] == "newuser@example.com"
        assert "id" in data
        assert data["is_active"] is True
        assert "created_at" in data
    finally:
        _clear()


def test_register_duplicate_email(db_session):
    """Registering the same email twice returns HTTP 409."""
    UserRepository.create(
        session=db_session,
        email="dup@example.com",
        hashed_password=hash_password("SomePass1"),
    )
    db_session.commit()

    _override(db_session)
    try:
        res = client.post("/api/auth/register", json={
            "email": "dup@example.com",
            "password": "AnotherPass1",
        })
        assert res.status_code == 409, res.text
        assert "already exists" in res.json()["detail"].lower()
    finally:
        _clear()


def test_register_invalid_email(db_session):
    """Malformed email returns HTTP 422."""
    _override(db_session)
    try:
        res = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "ValidPass1",
        })
        assert res.status_code == 422, res.text
    finally:
        _clear()


def test_register_password_too_short(db_session):
    """Password shorter than 8 chars returns HTTP 422."""
    _override(db_session)
    try:
        res = client.post("/api/auth/register", json={
            "email": "shortpw@example.com",
            "password": "short",
        })
        assert res.status_code == 422, res.text
    finally:
        _clear()


def test_register_password_stored_as_bcrypt_hash(db_session):
    """Stored password must be a bcrypt hash, never plaintext."""
    plain = "MySecretPass1"
    _override(db_session)
    try:
        res = client.post("/api/auth/register", json={
            "email": "hashcheck@example.com",
            "password": plain,
        })
        assert res.status_code == 201, res.text
        user_id = res.json()["id"]
    finally:
        _clear()

    user = UserRepository.get_by_id(db_session, user_id)
    assert user is not None
    # Must not store plaintext
    assert user.hashed_password != plain
    # Must verify correctly via bcrypt
    assert verify_password(plain, user.hashed_password)


def test_register_user_is_active_by_default(db_session):
    """Newly registered users must have is_active=True."""
    _override(db_session)
    try:
        res = client.post("/api/auth/register", json={
            "email": "activecheck@example.com",
            "password": "ActivePass1",
        })
        assert res.status_code == 201, res.text
        assert res.json()["is_active"] is True
    finally:
        _clear()