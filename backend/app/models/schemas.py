"""
Pydantic schemas for request/response validation.
Defines all API request/response models with validation rules.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, validator


class GenderEnum(str, Enum):
    """Gender enumeration."""
    MALE = "Male"
    FEMALE = "Female"
    NON_BINARY = "Non-binary"


class EducationLevel(str, Enum):
    """Education level enumeration."""
    HIGH_SCHOOL = "High School"
    BACHELOR = "Bachelor"
    MASTER = "Master"
    PHD = "PhD"


class MaritalStatus(str, Enum):
    """Marital status enumeration."""
    SINGLE = "Single"
    MARRIED = "Married"
    DIVORCED = "Divorced"
    WIDOWED = "Widowed"


class LoanPurpose(str, Enum):
    """Loan purpose enumeration."""
    PERSONAL = "Personal"
    AUTO = "Auto"
    HOME = "Home"
    EDUCATION = "Education"
    BUSINESS = "Business"


class EmploymentStatus(str, Enum):
    """Employment status enumeration."""
    EMPLOYED = "Employed"
    SELF_EMPLOYED = "Self-employed"
    UNEMPLOYED = "Unemployed"


class PaymentHistory(str, Enum):
    """Payment history enumeration."""
    GOOD = "Good"
    FAIR = "Fair"
    POOR = "Poor"


class RiskRating(str, Enum):
    """Risk rating enumeration."""
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"


class ScoringRequest(BaseModel):
    """Single applicant scoring request."""
    
    # Optional identifier
    applicant_id: Optional[str] = Field(None, description="Unique applicant ID")
    
    # Demographics
    age: int = Field(..., ge=18, le=100, description="Age in years")
    gender: GenderEnum = Field(..., description="Gender")
    education_level: EducationLevel = Field(..., description="Education level")
    marital_status: MaritalStatus = Field(..., description="Marital status")
    
    # Financial
    income: float = Field(..., gt=0, description="Annual income in USD")
    credit_score: int = Field(..., ge=300, le=850, description="Credit score (FICO)")
    loan_amount: float = Field(..., gt=0, description="Requested loan amount in USD")
    debt_to_income_ratio: float = Field(..., ge=0, le=1, description="Debt-to-income ratio")
    assets_value: float = Field(..., ge=0, description="Total assets in USD")
    
    # Employment
    employment_status: EmploymentStatus = Field(..., description="Employment status")
    years_at_current_job: int = Field(..., ge=0, le=60, description="Years at current job")
    
    # Loan details
    loan_purpose: LoanPurpose = Field(..., description="Purpose of loan")
    
    # Credit history
    payment_history: PaymentHistory = Field(..., description="Payment history")
    previous_defaults: int = Field(..., ge=0, description="Number of previous defaults")
    number_of_dependents: int = Field(..., ge=0, le=10, description="Number of dependents")
    
    class Config:
        schema_extra = {
            "example": {
                "age": 35,
                "gender": "Male",
                "education_level": "Bachelor",
                "marital_status": "Married",
                "income": 75000,
                "credit_score": 720,
                "loan_amount": 25000,
                "debt_to_income_ratio": 0.35,
                "assets_value": 150000,
                "employment_status": "Employed",
                "years_at_current_job": 5,
                "loan_purpose": "Home",
                "payment_history": "Good",
                "previous_defaults": 0,
                "number_of_dependents": 2,
            }
        }


class FeatureImportance(BaseModel):
    """Feature importance for SHAP explanations."""
    name: str = Field(..., description="Feature name")
    impact: float = Field(..., ge=0, le=1, description="Feature importance (0-1)")
    direction: str = Field(..., description="'positive' or 'negative' impact on risk")


class ExplanationData(BaseModel):
    """SHAP explanation data."""
    top_features: List[FeatureImportance] = Field(..., description="Top 5 features")
    feature_importance_sum: float = Field(..., description="Sum of feature importance")
    base_value: Optional[float] = Field(None, description="SHAP base value")
    shap_values: Optional[Dict[str, float]] = Field(None, description="SHAP values dict")


class AuditTrail(BaseModel):
    """Audit trail information."""
    preprocessor_version: str = Field(..., description="Preprocessor version")
    validation_passed: bool = Field(..., description="Whether input validation passed")
    threshold_tuning_applied: bool = Field(..., description="Whether threshold tuning was applied")
    input_hash: str = Field(..., description="Hash of input for audit")


class ScoringResponse(BaseModel):
    """Single applicant scoring response."""
    
    applicant_id: str = Field(..., description="Unique applicant ID")
    risk_rating: RiskRating = Field(..., description="Risk rating (Low/Medium/High)")
    default_probability: float = Field(..., ge=0, le=1, description="Probability of default")
    raw_probability: float = Field(..., ge=0, le=1, description="Raw model probability")
    confidence_score: float = Field(..., ge=0, le=1, description="Model confidence (0-1)")
    
    model_version: str = Field(..., description="Model version used")
    model_name: str = Field(..., description="Model name")
    scoring_timestamp: datetime = Field(..., description="When the score was computed")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")
    
    explanations: ExplanationData = Field(..., description="SHAP explanations")
    audit_trail: AuditTrail = Field(..., description="Audit trail")


class BatchJobResponse(BaseModel):
    """Batch job status response."""
    
    job_id: str = Field(..., description="Unique batch job ID")
    job_name: str = Field(..., description="Descriptive job name")
    status: str = Field(..., description="Job status (pending/processing/completed/failed)")
    total_records: int = Field(..., description="Total records in batch")
    processed_records: int = Field(..., description="Records processed so far")
    
    created_at: datetime = Field(..., description="When job was created")
    started_at: Optional[datetime] = Field(None, description="When processing started")
    completed_at: Optional[datetime] = Field(None, description="When job completed")
    
    summary_metrics: Optional[Dict[str, Any]] = Field(None, description="Portfolio metrics")


class BatchResultResponse(BaseModel):
    """Individual result from batch processing."""
    
    batch_result_id: str = Field(..., description="Unique result ID")
    job_id: str = Field(..., description="Parent batch job ID")
    applicant_id: str = Field(..., description="Applicant ID")
    risk_rating: str = Field(..., description="Risk rating")
    default_probability: float = Field(..., description="Default probability")
    confidence_score: float = Field(..., description="Confidence score")
    created_at: datetime = Field(..., description="When scored")


class ModelRegistryEntry(BaseModel):
    """Model registry entry."""
    
    model_id: str = Field(..., description="Unique model ID")
    model_name: str = Field(..., description="Model name")
    version: str = Field(..., description="Version string (e.g., 2.0.0)")
    model_type: str = Field(..., description="Model type (xgboost, lightgbm, etc.)")
    
    training_date: datetime = Field(..., description="When model was trained")
    deployment_date: Optional[datetime] = Field(None, description="When deployed")
    status: str = Field(..., description="active/inactive/deprecated")
    
    metrics: Dict[str, float] = Field(..., description="Performance metrics")
    training_samples: int = Field(..., description="Number of training samples")
    
    promoted_at: Optional[datetime] = Field(None, description="When promoted to production")
    promoted_by: Optional[str] = Field(None, description="User who promoted")


class AuditLogEntry(BaseModel):
    """Audit log entry."""
    
    log_id: str = Field(..., description="Unique log ID")
    timestamp: datetime = Field(..., description="When event occurred")
    event_type: str = Field(..., description="Event type (score/batch/governance/etc)")
    
    user_id: Optional[str] = Field(None, description="User who triggered event")
    applicant_id: Optional[str] = Field(None, description="Related applicant")
    job_id: Optional[str] = Field(None, description="Related batch job")
    
    action: str = Field(..., description="Action performed")
    status: str = Field(..., description="success/failure")
    details: Dict[str, Any] = Field(..., description="Event details")


class HealthCheckResponse(BaseModel):
    """Health check response."""
    
    status: str = Field(..., description="System status (healthy/degraded)")
    models_loaded: bool = Field(..., description="Whether models are loaded")
    database: str = Field(..., description="Database status")
    api_version: str = Field(..., description="API version")


class ErrorResponse(BaseModel):
    """Standard error response."""
    
    error: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional details")


# Pydantic config
class Config:
    """Pydantic configuration."""
    use_enum_values = True
    arbitrary_types_allowed = True