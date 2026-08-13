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


def test_update_dns_record_success(db_session):
    """Test PUT /api/records/{record_id} updates record fields and preserves metadata."""
    user = UserRepository.create(session=db_session, email="dnsupd@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZDNSUPD001",
        user_id=user.id,
        name="dnsupddomain.com.",
        caller_reference="ref-dnsupd-001",
    )
    record = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="oldname.dnsupddomain.com.",
        type="A",
        value="1.1.1.1",
        ttl=300,
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        payload = {
            "name": "newname.dnsupddomain.com",
            "type": "AAAA",
            "ttl": 600,
            "value": "2001:db8::1",
        }
        response = client.put(f"/api/records/{record.id}", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == record.id
        assert data["hosted_zone_id"] == zone.id
        assert data["name"] == "newname.dnsupddomain.com."
        assert data["type"] == "AAAA"
        assert data["ttl"] == 600
        assert data["value"] == "2001:db8::1"
        assert data["is_system_record"] is False
    finally:
        app.dependency_overrides.clear()


def test_update_dns_record_not_found(db_session):
    """Test PUT /api/records/{record_id} returns 404 for non-existent record."""
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.put("/api/records/999999", json={"value": "1.1.1.1"})
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_update_dns_record_invalid_type_or_ttl(db_session):
    """Test PUT /api/records/{record_id} returns 422 for invalid type or negative TTL."""
    user = UserRepository.create(session=db_session, email="invupd@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZINVUPD001",
        user_id=user.id,
        name="invupddomain.com.",
        caller_reference="ref-invupd-001",
    )
    record = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="sub.invupddomain.com.",
        type="A",
        value="1.1.1.1",
        ttl=300,
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        # Invalid type
        res_type = client.put(f"/api/records/{record.id}", json={"type": "BAD_TYPE"})
        assert res_type.status_code == 422

        # Invalid negative TTL
        res_ttl = client.put(f"/api/records/{record.id}", json={"ttl": -50})
        assert res_ttl.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_update_dns_record_system_record_protection(db_session):
    """Test PUT /api/records/{record_id} returns 400 when attempting to update a system record."""
    user = UserRepository.create(session=db_session, email="sysrec@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZSYSREC001",
        user_id=user.id,
        name="sysrecdomain.com.",
        caller_reference="ref-sysrec-001",
    )
    system_record = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="sysrecdomain.com.",
        type="SOA",
        value="ns1.dns.com. hostmaster.dns.com. 1 7200 900 1209600 86400",
        is_system_record=True,
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.put(f"/api/records/{system_record.id}", json={"value": "ns2.newdns.com."})
        assert response.status_code == 400
        assert "cannot modify system-generated" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()

