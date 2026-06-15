"""
Integration tests for scoring API endpoints.
"""

import pytest
from fastapi import status

from app.api.v1.endpoints.scoring import get_scoring_service
from app.services.scorer import ScoringService
from app.main import app
from tests.unit.test_scoring import DummyModel, DummyPreprocessor, DummyExplainer
from tests.fixtures.sample_data import sample_request_dict


def mock_scoring_service():
    """Mock ScoringService factory dependency."""
    return ScoringService(
        model_ensemble=DummyModel(),
        preprocessor=DummyPreprocessor(),
        explainer=DummyExplainer()
    )


@pytest.fixture(autouse=True)
def override_scoring_dependency():
    """Override scoring dependency for all API tests."""
    app.dependency_overrides[get_scoring_service] = mock_scoring_service
    yield
    app.dependency_overrides.pop(get_scoring_service, None)


def test_score_applicant_endpoint(client):
    """Test POST /score endpoint success response."""
    payload = {
        "applicant_id": "applicant-999",
        "age": 30,
        "gender": "Female",
        "education_level": "Master",
        "marital_status": "Single",
        "income": 95000.0,
        "credit_score": 780,
        "loan_amount": 20000.0,
        "loan_purpose": "Business",
        "employment_status": "Employed",
        "years_at_current_job": 8,
        "payment_history": "Good",
        "debt_to_income_ratio": 0.25,
        "assets_value": 80000.0,
        "previous_defaults": 0,
        "number_of_dependents": 1,
    }
    
    response = client.post("/api/v1/score", json=payload)
    
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["applicant_id"] == "applicant-999"
    assert "risk_rating" in data
    assert "default_probability" in data
    assert "explanations" in data
    assert "audit_trail" in data


def test_score_applicant_validation_failure(client):
    """Test POST /score validation failure for invalid values."""
    payload = {
        "age": 12,  # Invalid: must be >= 18
        "gender": "Male",
        "education_level": "Bachelor",
        "marital_status": "Single",
        "income": -5000,  # Invalid: must be positive
        "credit_score": 999,  # Invalid: FICO max 850
        "loan_amount": 10000,
        "loan_purpose": "Home",
        "employment_status": "Employed",
        "years_at_current_job": 3,
        "payment_history": "Good",
        "debt_to_income_ratio": 0.30,
        "assets_value": 50000,
        "previous_defaults": 0,
        "number_of_dependents": 0,
    }
    
    response = client.post("/api/v1/score", json=payload)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_score_batch_endpoint(client):
    """Test POST /score/batch endpoint."""
    payload = [
        {
            "applicant_id": "app-batch-1",
            "age": 40,
            "gender": "Male",
            "education_level": "PhD",
            "marital_status": "Married",
            "income": 120000.0,
            "credit_score": 800,
            "loan_amount": 50000.0,
            "loan_purpose": "Home",
            "employment_status": "Employed",
            "years_at_current_job": 12,
            "payment_history": "Good",
            "debt_to_income_ratio": 0.15,
            "assets_value": 300000.0,
            "previous_defaults": 0,
            "number_of_dependents": 3,
        },
        {
            "applicant_id": "app-batch-2",
            "age": 22,
            "gender": "Female",
            "education_level": "High School",
            "marital_status": "Single",
            "income": 25000.0,
            "credit_score": 580,
            "loan_amount": 5000.0,
            "loan_purpose": "Auto",
            "employment_status": "Self-employed",
            "years_at_current_job": 1,
            "payment_history": "Fair",
            "debt_to_income_ratio": 0.45,
            "assets_value": 10000.0,
            "previous_defaults": 1,
            "number_of_dependents": 0,
        }
    ]
    
    response = client.post("/api/v1/score/batch", json=payload)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 2
    assert data[0]["applicant_id"] == "app-batch-1"
    assert data[1]["applicant_id"] == "app-batch-2"


def test_get_applicant_history_endpoint(client):
    """Test GET /score/history/{applicant_id} endpoint."""
    applicant_id = "applicant-999"
    
    # First seed a score
    payload = {
        "applicant_id": applicant_id,
        "age": 30,
        "gender": "Female",
        "education_level": "Master",
        "marital_status": "Single",
        "income": 95000.0,
        "credit_score": 780,
        "loan_amount": 20000.0,
        "loan_purpose": "Business",
        "employment_status": "Employed",
        "years_at_current_job": 8,
        "payment_history": "Good",
        "debt_to_income_ratio": 0.25,
        "assets_value": 80000.0,
        "previous_defaults": 0,
        "number_of_dependents": 1,
    }
    client.post("/api/v1/score", json=payload)
    
    # Query history
    response = client.get(f"/api/v1/score/history/{applicant_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    assert data[0]["applicant_id"] == applicant_id
