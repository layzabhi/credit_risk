"""
SQLAlchemy ORM models for database tables.
Defines core entities: applicants, scoring requests, explanations, users, and portfolio metrics.
"""

from datetime import datetime

from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Applicant(Base):
    """Applicant profile table."""

    __tablename__ = "applicants"

    applicant_id = Column(String(36), primary_key=True, index=True)

    # Demographics
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    education_level = Column(String(50), nullable=False)
    marital_status = Column(String(20), nullable=False)

    # Financial
    income = Column(Float, nullable=False)
    credit_score = Column(Integer, nullable=False)
    debt_to_income_ratio = Column(Float, nullable=False)
    assets_value = Column(Float, nullable=False)

    # Employment
    employment_status = Column(String(20), nullable=False)
    years_at_current_job = Column(Integer, nullable=False)

    # History
    payment_history = Column(String(20), nullable=False)
    previous_defaults = Column(Integer, default=0)
    number_of_dependents = Column(Integer, default=0)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scoring_requests = relationship("ScoringRequest", back_populates="applicant")

    class Config:
        orm_mode = True


class ScoringRequest(Base):
    """Individual scoring request record."""

    __tablename__ = "scoring_requests"

    request_id = Column(String(36), primary_key=True, index=True)
    applicant_id = Column(String(36), ForeignKey("applicants.applicant_id"), nullable=False, index=True)

    # Loan details
    loan_amount = Column(Float, nullable=False)
    loan_purpose = Column(String(50), nullable=False)

    # Model info
    model_version = Column(String(20), nullable=False)
    model_name = Column(String(50), nullable=False)

    # Results
    risk_rating = Column(String(20), nullable=False, index=True)
    default_probability = Column(Float, nullable=False)
    raw_probability = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)

    # Processing info
    processing_time_ms = Column(Float, nullable=False)

    # Explanations (inline SHAP summary)
    explanations = Column(JSON, nullable=True)
    audit_trail = Column(JSON, nullable=False)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    applicant = relationship("Applicant", back_populates="scoring_requests")
    explanation = relationship("Explanation", back_populates="scoring_request", uselist=False)

    class Config:
        orm_mode = True


class Explanation(Base):
    """Cached SHAP explanations for quick retrieval."""

    __tablename__ = "explanations"

    explanation_id = Column(String(36), primary_key=True, index=True)
    request_id = Column(String(36), ForeignKey("scoring_requests.request_id"), nullable=False, unique=True)

    # SHAP data
    shap_values = Column(JSON, nullable=False)
    feature_importance = Column(JSON, nullable=False)
    base_value = Column(Float, nullable=True)
    expected_value = Column(Float, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    scoring_request = relationship("ScoringRequest", back_populates="explanation")

    class Config:
        orm_mode = True


class User(Base):
    """User accounts for authentication."""

    __tablename__ = "users"

    user_id = Column(String(36), primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)

    # Permissions
    role = Column(String(20), nullable=False, default="viewer")  # admin, scorer, viewer
    is_active = Column(Boolean, default=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    class Config:
        orm_mode = True


class PortfolioMetrics(Base):
    """Cached portfolio-level metrics for quick dashboard queries."""

    __tablename__ = "portfolio_metrics"

    metrics_id = Column(String(36), primary_key=True, index=True)

    # Time period
    date = Column(String(10), unique=True, index=True)  # YYYY-MM-DD

    # Counts
    total_applicants = Column(Integer, default=0)
    total_scores = Column(Integer, default=0)

    # Risk distribution
    low_risk_count = Column(Integer, default=0)
    medium_risk_count = Column(Integer, default=0)
    high_risk_count = Column(Integer, default=0)

    # Probabilities
    mean_default_probability = Column(Float, default=0.0)
    median_default_probability = Column(Float, default=0.0)
    std_default_probability = Column(Float, default=0.0)

    # Demographics
    metrics_by_gender = Column(JSON, nullable=True)
    metrics_by_education = Column(JSON, nullable=True)
    metrics_by_employment = Column(JSON, nullable=True)

    # Updated
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    class Config:
        orm_mode = True