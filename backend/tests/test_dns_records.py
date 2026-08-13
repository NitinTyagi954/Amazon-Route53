"""Unit tests for DNS Records API endpoints."""

from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_db
from app.repositories import UserRepository, HostedZoneRepository, DNSRecordRepository
from app.core.security import hash_password
from app.models.session import Session as SessionModel

client = TestClient(app)


def _create_user_and_token(db):
    """Seed a test user and active session, returning (user, headers)."""
    import random
    email = f"test-{random.randint(1000, 9999)}@domain.com"
    user = UserRepository.create(session=db, email=email, hashed_password=hash_password("password"))
    token = f"tok-{id(db)}-{random.randint(1000, 9999)}"
    exp = datetime.now(timezone.utc) + timedelta(hours=24)
    sess = SessionModel(user_id=user.id, token=token, expires_at=exp)
    db.add(sess)
    db.flush()
    return user, {"Authorization": f"Bearer {token}"}


def test_dns_records_unauthorized():
    """Verify that individual DNS record endpoints return 401 when unauthenticated."""
    res1 = client.get("/api/records/123")
    assert res1.status_code == 401

    res2 = client.put("/api/records/123", json={"value": "1.1.1.1"})
    assert res2.status_code == 401

    res3 = client.delete("/api/records/123")
    assert res3.status_code == 401


def test_dns_records_ownership_isolation(db_session):
    """Verify that a user cannot access or modify another user's DNS records (returns 404)."""
    user_a, headers_a = _create_user_and_token(db_session)
    user_b, headers_b = _create_user_and_token(db_session)

    zone_b = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZOWNERISOB",
        user_id=user_b.id,
        name="userb.com.",
        caller_reference="ref-user-b",
    )
    record_b = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone_b.id,
        name="api.userb.com.",
        type="A",
        value="1.1.1.1",
        ttl=300,
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        res_get = client.get(f"/api/records/{record_b.id}", headers=headers_a)
        assert res_get.status_code == 404

        res_put = client.put(f"/api/records/{record_b.id}", json={"value": "2.2.2.2"}, headers=headers_a)
        assert res_put.status_code == 404

        res_del = client.delete(f"/api/records/{record_b.id}", headers=headers_a)
        assert res_del.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_get_dns_record_success(db_session):
    """Test GET /api/records/{record_id} returns existing DNS record."""
    user, headers = _create_user_and_token(db_session)
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
        response = client.get(f"/api/records/{record.id}", headers=headers)
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
    user, headers = _create_user_and_token(db_session)

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.get("/api/records/999999", headers=headers)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_update_dns_record_success(db_session):
    """Test PUT /api/records/{record_id} updates record fields and preserves metadata."""
    user, headers = _create_user_and_token(db_session)
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
        response = client.put(f"/api/records/{record.id}", json=payload, headers=headers)
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
    user, headers = _create_user_and_token(db_session)

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.put("/api/records/999999", json={"value": "1.1.1.1"}, headers=headers)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_update_dns_record_invalid_type_or_ttl(db_session):
    """Test PUT /api/records/{record_id} returns 422 for invalid type or negative TTL."""
    user, headers = _create_user_and_token(db_session)
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
        res_type = client.put(f"/api/records/{record.id}", json={"type": "BAD_TYPE"}, headers=headers)
        assert res_type.status_code == 422

        # Invalid negative TTL
        res_ttl = client.put(f"/api/records/{record.id}", json={"ttl": -50}, headers=headers)
        assert res_ttl.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_update_dns_record_system_record_protection(db_session):
    """Test PUT /api/records/{record_id} returns 400 when attempting to update a system record."""
    user, headers = _create_user_and_token(db_session)
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
        response = client.put(f"/api/records/{system_record.id}", json={"value": "ns2.newdns.com."}, headers=headers)
        assert response.status_code == 400
        assert "cannot modify system-generated" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_delete_dns_record_success(db_session):
    """Test DELETE /api/records/{record_id} deletes a record and decrements parent zone record_count."""
    user, headers = _create_user_and_token(db_session)
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZDNSDEL001",
        user_id=user.id,
        name="dnsdeldomain.com.",
        caller_reference="ref-dnsdel-001",
    )
    record = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="sub.dnsdeldomain.com.",
        type="A",
        value="1.2.3.4",
        ttl=300,
    )
    assert zone.record_count == 3  # 2 auto + 1 manual

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.delete(f"/api/records/{record.id}", headers=headers)
        assert response.status_code == 204
        assert response.content == b""

        # Verify record is deleted
        assert DNSRecordRepository.get_by_id(db_session, record.id) is None

        # Verify parent zone record_count decremented to 0
        updated_zone = HostedZoneRepository.get_by_id(db_session, zone.id)
        assert updated_zone.record_count == 2  # only the 2 auto-created remain
    finally:
        app.dependency_overrides.clear()


def test_delete_dns_record_not_found(db_session):
    """Test DELETE /api/records/{record_id} returns 404 for non-existent record."""
    user, headers = _create_user_and_token(db_session)

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.delete("/api/records/999999", headers=headers)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_delete_dns_record_system_record_protection(db_session):
    """Test DELETE /api/records/{record_id} returns 400 when attempting to delete a system record."""
    user, headers = _create_user_and_token(db_session)
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZDELSYSREC01",
        user_id=user.id,
        name="delsysdomain.com.",
        caller_reference="ref-delsys-001",
    )
    system_record = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="delsysdomain.com.",
        type="SOA",
        value="ns1.dns.com. hostmaster.dns.com. 1 7200 900 1209600 86400",
        is_system_record=True,
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.delete(f"/api/records/{system_record.id}", headers=headers)
        assert response.status_code == 400
        assert "cannot delete system-generated" in response.json()["detail"].lower()

        # Verify record still exists
        assert DNSRecordRepository.get_by_id(db_session, system_record.id) is not None
    finally:
        app.dependency_overrides.clear()


