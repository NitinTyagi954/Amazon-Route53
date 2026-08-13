"""Unit tests for the Database layer."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from src.database.models import Base
from src.database.repository import (
    HostedZoneRepository,
    DNSRecordRepository,
    HealthCheckRepository,
    TrafficPolicyRepository,
)


@pytest.fixture
def db_session():
    """Create an in-memory SQLite database session for isolated testing."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
        session.commit()
    finally:
        session.close()


def test_create_and_get_hosted_zone(db_session):
    """Test creating and retrieving a HostedZone."""
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="Z11111",
        name="test.com.",
        caller_reference="ref-123",
        comment="Test zone",
    )
    assert zone.id == "Z11111"
    assert zone.name == "test.com."

    fetched = HostedZoneRepository.get_by_id(db_session, "Z11111")
    assert fetched is not None
    assert fetched.comment == "Test zone"
    assert fetched.record_count == 0


def test_create_dns_record(db_session):
    """Test adding a DNS record to a hosted zone."""
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="Z22222",
        name="example.org.",
        caller_reference="ref-456",
    )

    record = DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="app.example.org.",
        type="A",
        values=["10.0.0.1"],
        ttl=120,
    )
    assert record.id is not None
    assert record.hosted_zone_id == "Z22222"
    assert record.type == "A"
    assert zone.record_count == 1

    records = DNSRecordRepository.list_by_zone(db_session, zone.id)
    assert len(records) == 1
    assert records[0].name == "app.example.org."


def test_health_check_status_update(db_session):
    """Test HealthCheck creation and status updates."""
    hc = HealthCheckRepository.create(
        session=db_session,
        health_check_id="hc-test",
        fqdn="check.example.com",
        port=80,
    )
    assert hc.is_healthy is True

    updated_hc = HealthCheckRepository.update_status(db_session, "hc-test", is_healthy=False)
    assert updated_hc.is_healthy is False


def test_traffic_policy_creation(db_session):
    """Test TrafficPolicy creation and JSON serializability."""
    doc = {"rules": [{"endpoint": "10.0.0.1", "weight": 50}]}
    policy = TrafficPolicyRepository.create(
        session=db_session,
        policy_id="pol-001",
        name="AI Smart Routing",
        document=doc,
    )
    assert policy.id == "pol-001"
    assert policy.document["rules"][0]["weight"] == 50
    assert policy.to_dict()["name"] == "AI Smart Routing"


def test_delete_hosted_zone_cascade(db_session):
    """Test deleting a hosted zone deletes associated records."""
    zone = HostedZoneRepository.create(
        session=db_session,
        zone_id="Z33333",
        name="del.org.",
        caller_reference="ref-789",
    )
    DNSRecordRepository.create(
        session=db_session,
        hosted_zone_id=zone.id,
        name="sub.del.org.",
        type="CNAME",
        values=["target.org"],
    )

    deleted = HostedZoneRepository.delete(db_session, "Z33333")
    assert deleted is True

    assert HostedZoneRepository.get_by_id(db_session, "Z33333") is None
    assert len(DNSRecordRepository.list_by_zone(db_session, "Z33333")) == 0
