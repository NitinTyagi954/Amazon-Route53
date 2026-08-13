"""Pytest configuration and test fixtures for Route 53 Clone backend."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.models import Base


@pytest.fixture
def db_session():
    """Create an isolated in-memory SQLite database session for unit testing."""
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, echo=False)
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
        session.commit()
    finally:
        session.close()
