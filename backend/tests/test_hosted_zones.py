"""Unit tests for Hosted Zones API endpoints."""

from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_db
from app.repositories import UserRepository, HostedZoneRepository, DNSRecordRepository

client = TestClient(app)


def test_list_hosted_zones_empty(db_session):
    """Test GET /api/hosted-zones returns an empty list when no zones exist for a user."""
    user = UserRepository.create(session=db_session, email="empty@domain.com", hashed_password="hash")

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.get(f"/api/hosted-zones?user_id={user.id}")
        assert response.status_code == 200
        assert response.json() == []
    finally:
        app.dependency_overrides.clear()


def test_list_hosted_zones_with_data(db_session):
    """Test GET /api/hosted-zones returns user's hosted zones with correct Pydantic fields."""
    user = UserRepository.create(session=db_session, email="apiowner@domain.com", hashed_password="hash")

    # Create 2 Hosted Zones for user
    zone1 = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZAPIZONE001",
        user_id=user.id,
        name="company1.com.",
        caller_reference="ref-api-001",
        comment="Primary Company Zone",
        is_private=False,
    )
    DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone1.id,
        name="company1.com.",
        type="SOA",
        value="ns1.dns.com. hostmaster.dns.com. 1 7200 900 1209600 86400",
        is_system_record=True,
    )

    zone2 = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZAPIZONE002",
        user_id=user.id,
        name="private.internal.",
        caller_reference="ref-api-002",
        comment="Internal VPC Zone",
        is_private=True,
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        # Request with user filter
        response = client.get(f"/api/hosted-zones?user_id={user.id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        z1_data = next(z for z in data if z["id"] == "ZAPIZONE001")
        assert z1_data["name"] == "company1.com."
        assert z1_data["comment"] == "Primary Company Zone"
        assert z1_data["record_count"] == 1
        assert z1_data["is_private"] is False
        assert "created_at" in z1_data
        assert "updated_at" in z1_data

        z2_data = next(z for z in data if z["id"] == "ZAPIZONE002")
        assert z2_data["name"] == "private.internal."
        assert z2_data["is_private"] is True
        assert z2_data["record_count"] == 0

        # Request without filter returns all zones
        all_response = client.get("/api/hosted-zones")
        assert all_response.status_code == 200
        assert len(all_response.json()) >= 2
    finally:
        app.dependency_overrides.clear()
