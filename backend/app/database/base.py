"""
SQLAlchemy Base class and all models registered together.
This allows schema generator to find all tables.
"""

from app.models.database import Base  # noqa
from app.models.database import (  # noqa
    Applicant,
    ScoringRequest,
    Explanation,
    User,
    PortfolioMetrics,
)
