"""Unit tests for Hosted Zones API endpoints."""

from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_db
from app.repositories import UserRepository, HostedZoneRepository, DNSRecordRepository

client = TestClient(app)


def test_list_hosted_zones_empty(db_session):
    """Test GET /api/hosted-zones returns empty items list and 0 total when no zones exist for a user."""
    user = UserRepository.create(session=db_session, email="empty@domain.com", hashed_password="hash")

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.get(f"/api/hosted-zones?user_id={user.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["items"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["limit"] == 10
    finally:
        app.dependency_overrides.clear()


def test_list_hosted_zones_with_data(db_session):
    """Test GET /api/hosted-zones returns user's hosted zones inside paginated envelope."""
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
        res_data = response.json()
        items = res_data["items"]
        assert len(items) == 2
        assert res_data["total"] == 2
        assert res_data["page"] == 1
        assert res_data["limit"] == 10

        z1_data = next(z for z in items if z["id"] == "ZAPIZONE001")
        assert z1_data["name"] == "company1.com."
        assert z1_data["comment"] == "Primary Company Zone"
        assert z1_data["record_count"] == 1
        assert z1_data["is_private"] is False
        assert "created_at" in z1_data
        assert "updated_at" in z1_data

        z2_data = next(z for z in items if z["id"] == "ZAPIZONE002")
        assert z2_data["name"] == "private.internal."
        assert z2_data["is_private"] is True
        assert z2_data["record_count"] == 0

        # Request without filter returns all zones
        all_response = client.get("/api/hosted-zones")
        assert all_response.status_code == 200
        all_data = all_response.json()
        assert len(all_data["items"]) >= 2
        assert all_data["total"] >= 2
    finally:
        app.dependency_overrides.clear()



def test_create_hosted_zone_success(db_session):
    """Test POST /api/hosted-zones creates a hosted zone and returns HTTP 201."""
    user = UserRepository.create(session=db_session, email="creator@domain.com", hashed_password="hash")

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        payload = {
            "name": "newzone.com",
            "comment": "New production zone",
            "is_private": False,
            "user_id": user.id,
            "caller_reference": "ref-custom-001",
        }
        response = client.post("/api/hosted-zones", json=payload)
        assert response.status_code == 201
        data = response.json()
        assert data["id"].startswith("Z")
        assert len(data["id"]) > 5
        assert data["name"] == "newzone.com."
        assert data["user_id"] == user.id
        assert data["caller_reference"] == "ref-custom-001"
        assert data["comment"] == "New production zone"
        assert data["is_private"] is False
        assert data["record_count"] == 0
        assert "created_at" in data
        assert "updated_at" in data
    finally:
        app.dependency_overrides.clear()


def test_create_hosted_zone_invalid_domain(db_session):
    """Test POST /api/hosted-zones returns 422 on invalid domain names."""
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        invalid_domains = ["", "   ", "-startdash.com", "bad domain!", "test..com"]
        for domain in invalid_domains:
            response = client.post("/api/hosted-zones", json={"name": domain})
            assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_create_hosted_zone_missing_fields(db_session):
    """Test POST /api/hosted-zones returns 422 when required fields are missing."""
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.post("/api/hosted-zones", json={})
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_create_hosted_zone_duplicate_caller_reference(db_session):
    """Test POST /api/hosted-zones returns 409 when duplicate caller reference is provided."""
    user = UserRepository.create(session=db_session, email="dupe@domain.com", hashed_password="hash")

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        payload = {
            "name": "zoneone.com",
            "user_id": user.id,
            "caller_reference": "same-caller-ref",
        }
        res1 = client.post("/api/hosted-zones", json=payload)
        assert res1.status_code == 201

        res2 = client.post("/api/hosted-zones", json={**payload, "name": "zonetwo.com"})
        assert res2.status_code == 409
    finally:
        app.dependency_overrides.clear()


def test_get_hosted_zone_success(db_session):
    """Test GET /api/hosted-zones/{zone_id} returns existing hosted zone."""
    user = UserRepository.create(session=db_session, email="getsingle@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZSINGLEZONE001",
        user_id=user.id,
        name="singlezone.org.",
        caller_reference="ref-single-001",
        comment="Single zone test",
        is_private=True,
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.get(f"/api/hosted-zones/{zone.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "ZSINGLEZONE001"
        assert data["name"] == "singlezone.org."
        assert data["user_id"] == user.id
        assert data["caller_reference"] == "ref-single-001"
        assert data["comment"] == "Single zone test"
        assert data["is_private"] is True
        assert data["record_count"] == 0
    finally:
        app.dependency_overrides.clear()


def test_get_hosted_zone_not_found(db_session):
    """Test GET /api/hosted-zones/{zone_id} returns 404 when zone does not exist."""
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.get("/api/hosted-zones/ZNONEXISTENTZONE")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_update_hosted_zone_success(db_session):
    """Test PUT /api/hosted-zones/{zone_id} updates editable fields and returns HTTP 200."""
    user = UserRepository.create(session=db_session, email="updater@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZUPDATEZONE001",
        user_id=user.id,
        name="original.com.",
        caller_reference="ref-upd-001",
        comment="Original comment",
        is_private=False,
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        payload = {
            "name": "updateddomain.com",
            "comment": "Updated comment text",
            "is_private": True,
        }
        response = client.put(f"/api/hosted-zones/{zone.id}", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "ZUPDATEZONE001"
        assert data["name"] == "updateddomain.com."
        assert data["comment"] == "Updated comment text"
        assert data["is_private"] is True
        # Verify immutable fields remain unchanged
        assert data["user_id"] == user.id
        assert data["caller_reference"] == "ref-upd-001"
        assert data["record_count"] == 0
    finally:
        app.dependency_overrides.clear()


def test_update_hosted_zone_not_found(db_session):
    """Test PUT /api/hosted-zones/{zone_id} returns 404 when updating non-existent zone."""
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.put("/api/hosted-zones/ZNONEXISTENTZONE", json={"comment": "No zone here"})
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_update_hosted_zone_invalid_domain(db_session):
    """Test PUT /api/hosted-zones/{zone_id} returns 422 on invalid domain update."""
    user = UserRepository.create(session=db_session, email="invalidupd@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZUPDVAL001",
        user_id=user.id,
        name="validbefore.com.",
        caller_reference="ref-updval-001",
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.put(f"/api/hosted-zones/{zone.id}", json={"name": "-invalidstart.com"})
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_delete_hosted_zone_success(db_session):
    """Test DELETE /api/hosted-zones/{zone_id} deletes hosted zone and returns HTTP 204."""
    user = UserRepository.create(session=db_session, email="deleter@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZDELETEZONE001",
        user_id=user.id,
        name="todelete.com.",
        caller_reference="ref-del-001",
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.delete(f"/api/hosted-zones/{zone.id}")
        assert response.status_code == 204
        assert response.content == b""

        # Verify zone is gone
        get_res = client.get(f"/api/hosted-zones/{zone.id}")
        assert get_res.status_code == 404
    finally:
        app.dependency_overrides.clear()


def test_delete_hosted_zone_cascade_records(db_session):
    """Test DELETE /api/hosted-zones/{zone_id} cascades deletion to associated DNS records."""
    user = UserRepository.create(session=db_session, email="cascade@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZDELCASCADE001",
        user_id=user.id,
        name="cascadezone.com.",
        caller_reference="ref-delcasc-001",
    )

    record = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="sub.cascadezone.com.",
        type="A",
        value="192.168.1.1",
        ttl=300,
    )
    assert DNSRecordRepository.get_by_id(db_session, record.id) is not None

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.delete(f"/api/hosted-zones/{zone.id}")
        assert response.status_code == 204

        # Verify DNS record was cascade-deleted
        assert DNSRecordRepository.get_by_id(db_session, record.id) is None
    finally:
        app.dependency_overrides.clear()


def test_delete_hosted_zone_not_found(db_session):
    """Test DELETE /api/hosted-zones/{zone_id} returns 404 for non-existent zone."""
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        response = client.delete("/api/hosted-zones/ZNONEXISTENTZONE")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()
    finally:
        app.dependency_overrides.clear()


def test_list_hosted_zones_search(db_session):
    """Test GET /api/hosted-zones search query parameter with matching, case-insensitive, and no-match cases."""
    user = UserRepository.create(session=db_session, email="searchuser@domain.com", hashed_password="hash")

    HostedZoneRepository.create(
        session=db_session,
        zone_id="ZSEARCH001",
        user_id=user.id,
        name="alpha-app.com.",
        caller_reference="ref-srch-001",
    )
    HostedZoneRepository.create(
        session=db_session,
        zone_id="ZSEARCH002",
        user_id=user.id,
        name="beta-service.org.",
        caller_reference="ref-srch-002",
    )
    HostedZoneRepository.create(
        session=db_session,
        zone_id="ZSEARCH003",
        user_id=user.id,
        name="alpha-admin.io.",
        caller_reference="ref-srch-003",
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        # Matching query
        res_matching = client.get(f"/api/hosted-zones?user_id={user.id}&search=alpha")
        assert res_matching.status_code == 200
        data_matching = res_matching.json()
        assert len(data_matching["items"]) == 2
        assert data_matching["total"] == 2
        assert {z["name"] for z in data_matching["items"]} == {"alpha-app.com.", "alpha-admin.io."}

        # Case-insensitive matching
        res_case = client.get(f"/api/hosted-zones?user_id={user.id}&search=BETA")
        assert res_case.status_code == 200
        data_case = res_case.json()
        assert len(data_case["items"]) == 1
        assert data_case["total"] == 1
        assert data_case["items"][0]["name"] == "beta-service.org."

        # No match results
        res_nomatch = client.get(f"/api/hosted-zones?user_id={user.id}&search=nonexistentdomain")
        assert res_nomatch.status_code == 200
        data_nomatch = res_nomatch.json()
        assert data_nomatch["items"] == []
        assert data_nomatch["total"] == 0
    finally:
        app.dependency_overrides.clear()


def test_list_hosted_zones_pagination_defaults_and_custom(db_session):
    """Test GET /api/hosted-zones pagination defaults and custom page/limit parameters."""
    user = UserRepository.create(session=db_session, email="pageuser@domain.com", hashed_password="hash")

    # Create 5 Hosted Zones
    for i in range(1, 6):
        HostedZoneRepository.create(
            session=db_session,
            zone_id=f"ZPAGEZONE00{i}",
            user_id=user.id,
            name=f"zone{i}.org.",
            caller_reference=f"ref-page-00{i}",
        )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        # Default pagination (page=1, limit=10)
        res_default = client.get(f"/api/hosted-zones?user_id={user.id}")
        assert res_default.status_code == 200
        data_def = res_default.json()
        assert len(data_def["items"]) == 5
        assert data_def["total"] == 5
        assert data_def["page"] == 1
        assert data_def["limit"] == 10

        # Custom pagination (page=2, limit=2)
        res_custom = client.get(f"/api/hosted-zones?user_id={user.id}&page=2&limit=2")
        assert res_custom.status_code == 200
        data_cust = res_custom.json()
        assert len(data_cust["items"]) == 2
        assert data_cust["total"] == 5
        assert data_cust["page"] == 2
        assert data_cust["limit"] == 2
    finally:
        app.dependency_overrides.clear()


def test_list_hosted_zones_pagination_with_search(db_session):
    """Test GET /api/hosted-zones combining search query and pagination."""
    user = UserRepository.create(session=db_session, email="pagesearch@domain.com", hashed_password="hash")

    for i in range(1, 5):
        HostedZoneRepository.create(
            session=db_session,
            zone_id=f"ZSEARCHPAGE0{i}",
            user_id=user.id,
            name=f"target-service-{i}.com.",
            caller_reference=f"ref-spage-0{i}",
        )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        # Search "target" with page=1, limit=2
        res = client.get(f"/api/hosted-zones?user_id={user.id}&search=target&page=1&limit=2")
        assert res.status_code == 200
        data = res.json()
        assert len(data["items"]) == 2
        assert data["total"] == 4
        assert data["page"] == 1
        assert data["limit"] == 2
    finally:
        app.dependency_overrides.clear()


def test_list_hosted_zones_pagination_out_of_range(db_session):
    """Test GET /api/hosted-zones requesting an out-of-range page returns empty items list."""
    user = UserRepository.create(session=db_session, email="rangeuser@domain.com", hashed_password="hash")

    HostedZoneRepository.create(
        session=db_session,
        zone_id="ZRANGEZONE01",
        user_id=user.id,
        name="rangezone.com.",
        caller_reference="ref-range-001",
    )

    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        res = client.get(f"/api/hosted-zones?user_id={user.id}&page=999&limit=10")
        assert res.status_code == 200
        data = res.json()
        assert data["items"] == []
        assert data["total"] == 1
        assert data["page"] == 999
        assert data["limit"] == 10
    finally:
        app.dependency_overrides.clear()






