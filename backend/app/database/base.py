"""
SQLAlchemy Base class and all models registered together.
This allows Alembic / schema generator to find all tables.
"""

from app.models.database import Base  # noqa
from app.models.database import (  # noqa
    Applicant,
    ScoringRequest,
    BatchJob,
    BatchResult,
    ModelRegistry,
    AuditLog,
    Explanation,
    User,
    PortfolioMetrics,
)
