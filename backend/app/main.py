"""AWS Route 53 Clone - FastAPI Application Entry Point."""

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.dependencies import get_db
from app.routers import hosted_zones_router, dns_records_router, auth_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AWS Route 53 Clone API Foundation",
)

# ---------------------------------------------------------------------------
# CORS – allow the Next.js dev server to communicate with this backend
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
