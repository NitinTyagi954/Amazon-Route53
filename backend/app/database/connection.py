"""Database Connection & Session Management Module.

Provides engine initialization and transactional context manager get_db_session() for SQLite.
"""

from typing import Generator
from contextlib import contextmanager
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session

from backend.app.core.config import settings

_engine: Engine | None = None
_SessionFactory: sessionmaker | None = None


def get_engine(db_url: str | None = None) -> Engine:
    """Initialize or retrieve the global SQLite engine."""
    global _engine, _SessionFactory
    if _engine is None or db_url is not None:
        url = db_url or settings.DATABASE_URL
        connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
        _engine = create_engine(url, connect_args=connect_args, pool_pre_ping=True)
        _SessionFactory = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    return _engine


def get_session_factory() -> sessionmaker:
    """Retrieve session factory."""
    global _SessionFactory
    if _SessionFactory is None:
        get_engine()
    assert _SessionFactory is not None
    return _SessionFactory


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """Context manager providing a transactional database session."""
    SessionFactory = get_session_factory()
    session: Session = SessionFactory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db() -> Generator[Session, None, None]:
    """FastAPI Dependency for database session injection."""
    SessionFactory = get_session_factory()
    session: Session = SessionFactory()
    try:
        yield session
    finally:
        session.close()
