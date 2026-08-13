"""FastAPI Application Dependencies.

Exposes reusable dependencies for database session injection and request context.
"""

from typing import Generator
from sqlalchemy.orm import Session
from app.database.connection import get_db

__all__ = ["get_db"]
