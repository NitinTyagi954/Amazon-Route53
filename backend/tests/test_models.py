"""Unit tests for models, repositories, and relationships."""

import pytest
from backend.app.repositories import UserRepository, HostedZoneRepository, DNSRecordRepository


def test_user_creation(db_session):
    """Test user creation and query."""
    user = UserRepository.create(
        session=db_session,
        email="admin@route53.local",
        hashed_password="secretpasswordhash",
        full_name="Route53 Admin",
    )
    assert user.id is not None
    assert user.email == "admin@route53.local"
    assert user.is_active is True

    fetched = UserRepository.get_by_email(db_session, "admin@route53.local")
    assert fetched is not None
    assert fetched.full_name == "Route53 Admin"


def test_hosted_zone_and_records(db_session):
    """Test hosted zone creation and record association."""
    user = UserRepository.create(
        session=db_session,
        email="owner@domain.com",
        hashed_password="hash",
    )

    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="Z0123456789ABCDEF",
        user_id=user.id,
        name="mycompany.com.",
        caller_reference="ref-001",
        comment="Production Hosted Zone",
    )
    assert zone.id == "Z0123456789ABCDEF"
    assert zone.name == "mycompany.com."
    assert zone.record_count == 0

    # Create system record (SOA)
    soa_record = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="mycompany.com.",
        type="SOA",
        value="ns-1.route53.local. hostmaster.route53.local. 1 7200 900 1209600 86400",
        ttl=900,
        is_system_record=True,
    )
    assert soa_record.is_system_record is True
    assert zone.record_count == 1

    # Create user record (A)
    a_record = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="app.mycompany.com.",
        type="A",
        value="192.0.2.100",
        ttl=300,
        is_system_record=False,
    )
    assert a_record.is_system_record is False
    assert zone.record_count == 2


def test_prevent_system_record_deletion(db_session):
    """Test that system records (SOA/NS) cannot be deleted without permission."""
    user = UserRepository.create(session=db_session, email="test@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="Z999999",
        user_id=user.id,
        name="systemtest.com.",
        caller_reference="ref-sys-001",
    )
    soa = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="systemtest.com.",
        type="SOA",
        value="soa-data",
        is_system_record=True,
    )

    # Attempt to delete system record without allow_system_delete flag
    with pytest.raises(ValueError, match="Cannot delete system-generated"):
        DNSRecordRepository.delete(db_session, soa.id, allow_system_delete=False)

    # Deleting user record works cleanly
    user_rec = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="web.systemtest.com.",
        type="A",
        value="10.0.0.1",
        is_system_record=False,
    )
    deleted = DNSRecordRepository.delete(db_session, user_rec.id)
    assert deleted is True


def test_cascade_delete_hosted_zone(db_session):
    """Test that deleting a hosted zone cascades and deletes all records."""
    user = UserRepository.create(session=db_session, email="cascade@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="Z888888",
        user_id=user.id,
        name="cascadedomain.com.",
        caller_reference="ref-cas-001",
    )
    DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="sub.cascadedomain.com.",
        type="CNAME",
        value="target.com.",
    )

    HostedZoneRepository.delete(db_session, zone.id)
    assert HostedZoneRepository.get_by_id(db_session, zone.id) is None
    assert len(DNSRecordRepository.list_by_zone(db_session, zone.id)) == 0


def test_all_route53_record_types(db_session):
    """Test creation and validation of all 10 required Route 53 record types."""
    user = UserRepository.create(session=db_session, email="types@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="Z10TYPES",
        user_id=user.id,
        name="alltypes.com.",
        caller_reference="ref-types-001",
    )

    test_records = [
        ("A", "192.0.2.1"),
        ("AAAA", "2001:db8::1"),
        ("CNAME", "target.alltypes.com."),
        ("TXT", '"v=spf1 include:_spf.example.com ~all"'),
        ("MX", "10 mail.alltypes.com."),
        ("NS", "ns1.route53.dns."),
        ("PTR", "1.2.0.192.in-addr.arpa."),
        ("SRV", "10 60 5060 sip.alltypes.com."),
        ("CAA", '0 issue "letsencrypt.org"'),
        ("SOA", "ns1.route53.dns. hostmaster.alltypes.com. 1 7200 900 1209600 86400"),
    ]

    for record_type, value in test_records:
        rec = DNSRecordRepository.create(
            session=db_session,
            hosted_zone_id=zone.id,
            name=f"test-{record_type.lower()}.alltypes.com.",
            type=record_type,
            value=value,
            ttl=300,
        )
        assert rec.id is not None
        assert rec.type == record_type
        assert rec.value == value

    records_in_db = DNSRecordRepository.list_by_zone(db_session, zone.id)
    assert len(records_in_db) == len(test_records)
    created_types = {r.type for r in records_in_db}
    assert created_types == {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"}


def test_invalid_record_type_validation(db_session):
    """Test that invalid record types raise a ValueError in both repository and schema."""
    user = UserRepository.create(session=db_session, email="invalid@domain.com", hashed_password="hash")
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="ZINVALID",
        user_id=user.id,
        name="invalidtype.com.",
        caller_reference="ref-inv-001",
    )

    # Repository validation
    with pytest.raises(ValueError, match="Invalid DNS record type 'BOGUS'"):
        DNSRecordRepository.create(
            session=db_session,
            hosted_zone_id=zone.id,
            name="bogus.invalidtype.com.",
            type="BOGUS",
            value="1.2.3.4",
        )

    # Pydantic schema validation
    from backend.app.schemas.dns_record import DNSRecordCreate
    with pytest.raises(ValueError, match="Invalid DNS record type 'INVALID_TYPE'"):
        DNSRecordCreate(
            hosted_zone_id=zone.id,
            name="sub.invalidtype.com.",
            type="INVALID_TYPE",
            value="1.2.3.4",
        )

