"""
SQLAlchemy ORM models for database tables.
Defines all database entities and relationships.
"""

from datetime import datetime
from typing import Optional, Dict, Any

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
    
    # Explanations
    explanations = Column(JSON, nullable=True)
    audit_trail = Column(JSON, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    applicant = relationship("Applicant", back_populates="scoring_requests")
    
    class Config:
        orm_mode = True


class BatchJob(Base):
    """Batch processing job metadata."""
    
    __tablename__ = "batch_jobs"
    
    job_id = Column(String(36), primary_key=True, index=True)
    job_name = Column(String(255), nullable=False)
    
    # Status tracking
    status = Column(String(20), nullable=False, index=True)  # pending, processing, completed, failed
    total_records = Column(Integer, nullable=False)
    processed_records = Column(Integer, default=0)
    failed_records = Column(Integer, default=0)
    
    # File info
    csv_file_path = Column(String(500), nullable=False)
    
    # Processing info
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Error tracking
    error_message = Column(Text, nullable=True)
    
    # Results summary
    summary_metrics = Column(JSON, nullable=True)
    
    # Relationships
    results = relationship("BatchResult", back_populates="batch_job", cascade="all, delete-orphan")
    
    class Config:
        orm_mode = True


class BatchResult(Base):
    """Individual result from batch processing."""
    
    __tablename__ = "batch_results"
    
    batch_result_id = Column(String(36), primary_key=True, index=True)
    job_id = Column(String(36), ForeignKey("batch_jobs.job_id"), nullable=False, index=True)
    applicant_id = Column(String(36), nullable=False, index=True)
    
    # Score results
    risk_rating = Column(String(20), nullable=False, index=True)
    default_probability = Column(Float, nullable=False)
    confidence_score = Column(Float, nullable=False)
    
    # Full result data (cached from scoring response)
    result_data = Column(JSON, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    batch_job = relationship("BatchJob", back_populates="results")
    
    class Config:
        orm_mode = True


class ModelRegistry(Base):
    """Model version registry and governance."""
    
    __tablename__ = "model_registry"
    
    model_id = Column(String(36), primary_key=True, index=True)
    model_name = Column(String(255), nullable=False, index=True)
    version = Column(String(20), nullable=False, unique=True, index=True)
    
    # Model metadata
    model_type = Column(String(50), nullable=False)
    framework = Column(String(50), nullable=False)  # sklearn, xgboost, etc.
    
    # Performance metrics
    accuracy = Column(Float, nullable=True)
    precision = Column(Float, nullable=True)
    recall = Column(Float, nullable=True)
    f1_score = Column(Float, nullable=True)
    auc_roc = Column(Float, nullable=True)
    
    # Training info
    training_samples = Column(Integer, nullable=False)
    training_date = Column(DateTime, nullable=False)
    training_time_hours = Column(Float, nullable=True)
    
    # Status
    status = Column(String(20), nullable=False, default="inactive")  # active, inactive, deprecated
    is_production = Column(Boolean, default=False, index=True)
    
    # Deployment
    deployment_date = Column(DateTime, nullable=True)
    promoted_at = Column(DateTime, nullable=True)
    promoted_by = Column(String(100), nullable=True)
    
    # Artifact location
    model_path = Column(String(500), nullable=False)
    preprocessor_path = Column(String(500), nullable=True)
    
    # Additional metadata
    model_metadata = Column("metadata", JSON, nullable=True)
    notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    class Config:
        orm_mode = True


class AuditLog(Base):
    """Audit trail for compliance and debugging."""
    
    __tablename__ = "audit_logs"
    
    log_id = Column(String(36), primary_key=True, index=True)
    
    # Event info
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String(50), nullable=False, index=True)  # score, batch, governance, etc.
    action = Column(String(255), nullable=False)
    status = Column(String(20), nullable=False)  # success, failure
    
    # User info
    user_id = Column(String(100), nullable=True, index=True)
    user_ip = Column(String(50), nullable=True)
    
    # Entity references
    applicant_id = Column(String(36), nullable=True, index=True)
    job_id = Column(String(36), nullable=True, index=True)
    request_id = Column(String(36), nullable=True, index=True)
    model_id = Column(String(36), nullable=True, index=True)
    
    # Details
    details = Column(JSON, nullable=False)
    error_message = Column(Text, nullable=True)
    
    # Performance
    duration_ms = Column(Float, nullable=True)
    
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
    
    class Config:
        orm_mode = True


class User(Base):
    """User accounts for authentication (optional)."""
    
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


# Summary statistics table for quick dashboard queries
class PortfolioMetrics(Base):
    """Cached portfolio-level metrics."""
    
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