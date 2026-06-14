"""
API v1 router - aggregates all endpoint modules.
Combines scoring, batch, explainability, and governance endpoints.
"""

from fastapi import APIRouter

from app.api.v1.endpoints import scoring, batch, explainability, governance

# Create main router
api_router = APIRouter(prefix="/v1")

# Include all endpoint routers
api_router.include_router(scoring.router)
api_router.include_router(batch.router)
api_router.include_router(explainability.router)
api_router.include_router(governance.router)

__all__ = ["api_router"]