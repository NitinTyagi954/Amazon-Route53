"""Unit tests for FastAPI main endpoints."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_endpoint():
    """Verify GET /health returns 200 OK and status ok."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_root_endpoint():
    """Verify GET / returns 200 OK and message."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
