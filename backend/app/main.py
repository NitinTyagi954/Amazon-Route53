"""AWS Route 53 Clone - FastAPI Application Entry Point."""

import logging
from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.dependencies import get_db
from app.routers import hosted_zones_router, dns_records_router, auth_router
from app.database.connection import get_db_session, get_engine
from app.database.base import Base
from app.repositories.user import UserRepository
from app.core.security import hash_password
# Ensure all model classes are registered on Base.metadata
import app.models  # noqa: F401

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Demo account credentials (must match frontend "Try Demo Account" button)
# ---------------------------------------------------------------------------
DEMO_EMAIL = "demo@route53.example.com"
DEMO_PASSWORD = "Demo@12345"
DEMO_FULL_NAME = "Demo User"


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Create tables (if missing) and seed the demo user on startup."""
    # Ensure all tables exist – safe no-op when they already do.
    engine = get_engine()
    Base.metadata.create_all(engine)

    with get_db_session() as db:
        existing = UserRepository.get_by_email(db, DEMO_EMAIL)
        if existing is None:
            UserRepository.create(
                session=db,
                email=DEMO_EMAIL,
                hashed_password=hash_password(DEMO_PASSWORD),
                full_name=DEMO_FULL_NAME,
            )
            logger.info("Demo user seeded: %s", DEMO_EMAIL)
        else:
            logger.info("Demo user already exists: %s", DEMO_EMAIL)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AWS Route 53 Clone API Foundation",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS – allow the Next.js dev server and all Vercel deployments
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

app.include_router(hosted_zones_router)
app.include_router(dns_records_router)
app.include_router(auth_router)




@app.get("/health", tags=["Health"])
def health_check() -> dict:
    """Health check endpoint returning backend status."""
    return {"status": "ok"}


@app.get("/health/db", tags=["Health"])
def health_db_check(db: Session = Depends(get_db)) -> dict:
    """Database connectivity health check endpoint."""
    db.execute(text("SELECT 1"))
    return {"status": "ok"}


@app.get("/", tags=["Health"])
def root() -> dict:
    """Root endpoint returning basic service metadata."""
    return {
        "message": "AWS Route 53 Clone API is operational",
        "status": "ok",
        "docs_url": "/docs",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

