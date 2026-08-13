from app.routers.hosted_zones import router as hosted_zones_router
from app.routers.dns_records import router as dns_records_router
from app.routers.auth import router as auth_router

__all__ = ["hosted_zones_router", "dns_records_router", "auth_router"]

