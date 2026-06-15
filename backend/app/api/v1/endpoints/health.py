"""
Health check route handler for Credit Risk Assessment API.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db, health_check as db_health_check

router = APIRouter(tags=["health"])


@router.get("/health/status")
async def get_health_status(db: Session = Depends(get_db)):
    """API v1 health status checking database connectivity."""
    db_ok = db_health_check()
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "api_version": "2.0.0",
    }
