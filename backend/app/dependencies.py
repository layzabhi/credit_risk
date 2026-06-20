"""
FastAPI dependencies.
Defines reusable dependency functions for route handlers.
"""

import logging
from typing import Optional, Generator

from fastapi import HTTPException, status, Query, Depends
from sqlalchemy.orm import Session

from app.database.session import SessionLocal
from app.core.security import get_current_active_user, TokenData, oauth2_scheme
from app.core.logging import LogContext, get_request_id

logger = logging.getLogger(__name__)


# Database session dependency
def get_db() -> Generator[Session, None, None]:
    """
    Get database session dependency.

    Yields:
        SQLAlchemy session

    Raises:
        Any database connection errors
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Current user dependencies
async def get_current_user_dep(
    token: str = Depends(oauth2_scheme),
) -> TokenData:
    """
    Get current authenticated user.

    Args:
        token: JWT token from Authorization header

    Returns:
        TokenData of authenticated user

    Raises:
        HTTPException: If token is invalid
    """
    return await get_current_active_user(token)


# Query parameters
class PaginationParams:
    """Pagination parameters."""

    def __init__(
        self,
        skip: int = Query(0, ge=0, description="Number of records to skip"),
        limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    ):
        """Initialize pagination params."""
        self.skip = skip
        self.limit = limit


class SortParams:
    """Sorting parameters."""

    def __init__(
        self,
        sort_by: str = Query("created_at", description="Field to sort by"),
        order: str = Query("desc", regex="^(asc|desc)$", description="Sort order"),
    ):
        """Initialize sort params."""
        self.sort_by = sort_by
        self.order = order


class FilterParams:
    """Filtering parameters."""

    def __init__(
        self,
        search: Optional[str] = Query(None, description="Search query"),
        status: Optional[str] = Query(None, description="Filter by status"),
        risk_level: Optional[str] = Query(
            None,
            regex="^(low|medium|high)$",
            description="Filter by risk level",
        ),
    ):
        """Initialize filter params."""
        self.search = search
        self.status = status
        self.risk_level = risk_level


# Scoring endpoint dependencies
class ScoringRequestParams:
    """Parameters for scoring requests."""

    def __init__(
        self,
        include_explanations: bool = Query(
            True,
            description="Include SHAP explanations in response",
        ),
        include_feature_importance: bool = Query(
            True,
            description="Include feature importance in response",
        ),
    ):
        """Initialize scoring params."""
        self.include_explanations = include_explanations
        self.include_feature_importance = include_feature_importance


# Dashboard dependencies
class DashboardParams:
    """Parameters for dashboard queries."""

    def __init__(
        self,
        period: str = Query("30d", regex="^(7d|30d|90d|1y)$", description="Time period"),
        include_metrics: bool = Query(True, description="Include detailed metrics"),
    ):
        """Initialize dashboard params."""
        self.period = period
        self.include_metrics = include_metrics



class RequestContext:
    """Request context for tracking operations."""

    def __init__(
        self,
        user_id: str,
        request_id: str,
        operation: str = "unknown",
    ):
        """Initialize context."""
        self.user_id = user_id
        self.request_id = request_id
        self.operation = operation
        self.start_time: Optional[float] = None
        self.end_time: Optional[float] = None

    def __enter__(self):
        """Enter context."""
        import time
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Exit context."""
        import time
        self.end_time = time.time()
        duration = (self.end_time - self.start_time) * 1000  # ms

        if exc_type:
            logger.error(
                f"Operation {self.operation} failed for user {self.user_id} "
                f"(request_id={self.request_id}): {exc_val}",
                exc_info=True,
            )
        else:
            logger.info(
                f"Operation {self.operation} completed for user {self.user_id} "
                f"in {duration:.2f}ms (request_id={self.request_id})"
            )
