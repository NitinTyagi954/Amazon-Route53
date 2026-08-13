"""AWS Route 53 Clone - FastAPI Application Entry Point."""

from fastapi import FastAPI
from backend.app.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AWS Route 53 Clone API Foundation",
)


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    """Health check endpoint returning backend status."""
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
