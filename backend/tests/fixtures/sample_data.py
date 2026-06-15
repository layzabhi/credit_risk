"""
Shared sample data fixtures for unit and integration testing.
"""

import pytest

from app.models.schemas import ScoringRequest
from app.models.enums import (
    GenderEnum,
    EducationLevel,
    MaritalStatus,
    EmploymentStatus,
    LoanPurpose,
    PaymentHistory,
)


@pytest.fixture
def sample_request_dict():
    """Returns a valid ScoringRequest dict."""
    return {
        "applicant_id": "test-applicant-123",
        "age": 35,
        "gender": "Male",
        "education_level": "Bachelor",
        "marital_status": "Married",
        "income": 75000.0,
        "credit_score": 720,
        "loan_amount": 25000.0,
        "loan_purpose": "Home",
        "employment_status": "Employed",
        "years_at_current_job": 5,
        "payment_history": "Good",
        "debt_to_income_ratio": 0.35,
        "assets_value": 150000.0,
        "previous_defaults": 0,
        "number_of_dependents": 2,
    }


@pytest.fixture
def sample_request(sample_request_dict):
    """Returns a valid ScoringRequest Pydantic object."""
    return ScoringRequest(**sample_request_dict)
