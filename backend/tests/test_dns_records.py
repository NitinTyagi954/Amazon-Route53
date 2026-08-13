"""Unit tests for DNS Records API endpoints."""

from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_db
from app.repositories import UserRepository, HostedZoneRepository, DNSRecordRepository

client = TestClient(app)


def test_get_dns_record_success(db_session):
    """Test GET /api/records/{record_id} returns existing DNS record."""
    user = UserRepository.create(session=db_session, email="dnsget@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZDNSGET001",
        user_id=user.id,
        name="dnsgetdomain.com.",
        caller_reference="ref-dnsget-001",
    )
    record = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="api.dnsgetdomain.com.",
        type="A",
        value="198.51.100.1",
        ttl=300,
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.get(f"/api/records/{record.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == record.id
        assert data["hosted_zone_id"] == zone.id
        assert data["name"] == "api.dnsgetdomain.com."
        assert data["type"] == "A"
        assert data["value"] == "198.51.100.1"
        assert data["ttl"] == 300
        assert data["is_system_record"] is False
        assert "created_at" in data
        assert "updated_at" in data
    finally:
        app.dependency_overrides.clear()


def test_get_dns_record_not_found(db_session):
    """Test GET /api/records/{record_id} returns 404 for non-existent record ID."""
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.get("/api/records/999999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()
