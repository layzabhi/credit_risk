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


# Batch processing dependencies
class BatchQueryParams:
    """Parameters for batch processing queries."""

    def __init__(
        self,
        pagination: PaginationParams = Depends(),
        status: Optional[str] = Query(None, description="Filter by job status"),
        include_results: bool = Query(
            False,
            description="Include detailed scoring results",
        ),
    ):
        """Initialize batch query params."""
        self.pagination = pagination
        self.status = status
        self.include_results = include_results


# Audit log dependencies
class AuditLogParams:
    """Parameters for audit log queries."""

    def __init__(
        self,
        pagination: PaginationParams = Depends(),
        event_type: Optional[str] = Query(None, description="Filter by event type"),
        user_id: Optional[str] = Query(None, description="Filter by user ID"),
        start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
        end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    ):
        """Initialize audit log params."""
        self.pagination = pagination
        self.event_type = event_type
        self.user_id = user_id
        self.start_date = start_date
        self.end_date = end_date


# Model registry dependencies
class ModelRegistryParams:
    """Parameters for model registry queries."""

    def __init__(
        self,
        pagination: PaginationParams = Depends(),
        model_type: Optional[str] = Query(None, description="Filter by model type"),
        status: Optional[str] = Query(None, description="Filter by model status"),
    ):
        """Initialize model registry params."""
        self.pagination = pagination
        self.model_type = model_type
        self.status = status


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


# Common dependencies
async def verify_admin(
    current_user: TokenData = Depends(get_current_user_dep),
) -> TokenData:
    """
    Verify current user is admin.

    Args:
        current_user: Current authenticated user

    Returns:
        TokenData if user is admin

    Raises:
        HTTPException: If user is not admin
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


async def verify_scorer(
    current_user: TokenData = Depends(get_current_user_dep),
) -> TokenData:
    """
    Verify current user can score.

    Args:
        current_user: Current authenticated user

    Returns:
        TokenData if user is scorer or admin

    Raises:
        HTTPException: If user cannot score
    """
    if current_user.role not in ["admin", "scorer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Scorer access required",
        )
    return current_user


async def get_active_context(
    current_user: TokenData = Depends(get_current_user_dep),
    request_id: Optional[str] = None,
) -> LogContext:
    """
    Get logging context for current request.

    Args:
        current_user: Current authenticated user
        request_id: Optional request ID

    Returns:
        LogContext with user and request information
    """
    return LogContext(
        user_id=current_user.user_id,
        request_id=request_id or get_request_id(),
    )


def validate_applicant_id(applicant_id: str) -> str:
    """
    Validate applicant ID format.

    Args:
        applicant_id: Applicant ID to validate

    Returns:
        Validated applicant ID

    Raises:
        HTTPException: If ID format is invalid
    """
    if not applicant_id or len(applicant_id) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid applicant ID format",
        )
    return applicant_id


def validate_loan_amount(amount: float) -> float:
    """
    Validate loan amount.

    Args:
        amount: Loan amount to validate

    Returns:
        Validated loan amount

    Raises:
        HTTPException: If amount is invalid
    """
    if amount <= 0 or amount > 10_000_000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Loan amount must be between $1 and $10,000,000",
        )
    return amount


def validate_credit_score(score: int) -> int:
    """
    Validate credit score.

    Args:
        score: Credit score to validate

    Returns:
        Validated credit score

    Raises:
        HTTPException: If score is invalid
    """
    if score < 300 or score > 850:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Credit score must be between 300 and 850",
        )
    return score


def validate_income(income: float) -> float:
    """
    Validate income.

    Args:
        income: Annual income to validate

    Returns:
        Validated income

    Raises:
        HTTPException: If income is invalid
    """
    if income <= 0 or income > 1_000_000_000:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Income must be between $1 and $1,000,000,000",
        )
    return income


def validate_age(age: int) -> int:
    """
    Validate age.

    Args:
        age: Age to validate

    Returns:
        Validated age

    Raises:
        HTTPException: If age is invalid
    """
    if age < 18 or age > 120:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Age must be between 18 and 120",
        )
    return age


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
