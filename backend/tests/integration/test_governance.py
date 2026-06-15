"""
Integration tests for model governance and compliance audit endpoints.
"""

import pytest
from datetime import datetime
from fastapi import status

from app.models.database import ModelRegistry, AuditLog, ScoringRequest, Applicant


@pytest.fixture
def seed_model(db):
    """Seed a test model in the registry."""
    model = ModelRegistry(
        model_id="test-model-uuid-123",
        model_name="xgboost_ensemble",
        version="2.0.0",
        model_type="StackingClassifier",
        framework="xgboost",
        accuracy=0.88,
        precision=0.85,
        recall=0.82,
        f1_score=0.83,
        auc_roc=0.91,
        training_samples=15000,
        training_date=datetime.utcnow(),
        status="inactive",
        is_production=False,
        model_path="./ml_models/xgboost_ensemble/model.pkl",
        preprocessor_path="./ml_models/xgboost_ensemble/preprocessor.pkl"
    )
    db.add(model)
    db.commit()
    db.refresh(model)
    return model


def test_list_models_endpoint(client, seed_model):
    """Test GET /governance/models endpoint."""
    response = client.get("/api/v1/governance/models")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    assert data[0]["model_id"] == seed_model.model_id
    assert data[0]["version"] == "2.0.0"


def test_get_model_info_endpoint(client, seed_model):
    """Test GET /governance/models/{model_id} endpoint."""
    response = client.get(f"/api/v1/governance/models/{seed_model.model_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["model_id"] == seed_model.model_id
    assert data["metrics"]["auc_roc"] == 0.91


def test_promote_model_endpoint(client, seed_model):
    """Test POST /governance/models/{model_id}/promote endpoint."""
    response = client.post(f"/api/v1/governance/models/{seed_model.model_id}/promote")
    assert response.status_code == status.HTTP_202_ACCEPTED
    data = response.json()
    assert data["is_production"] is True
    assert data["status"] == "active"


def test_get_audit_logs_and_summary_endpoint(client, db):
    """Test GET /governance/audit and /governance/audit/summary endpoints."""
    # Seed an audit log
    log = AuditLog(
        log_id="test-log-uuid-abc",
        timestamp=datetime.utcnow(),
        event_type="governance",
        action="model_registration",
        status="success",
        user_id="admin",
        details={"model_name": "xgboost_ensemble", "version": "2.0.0"}
    )
    db.add(log)
    db.commit()
    
    # Check audit logs list
    response = client.get("/api/v1/governance/audit")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) >= 1
    assert data[0]["log_id"] == "test-log-uuid-abc"
    
    # Check audit summary
    response = client.get("/api/v1/governance/audit/summary")
    assert response.status_code == status.HTTP_200_OK
    summary = response.json()
    assert summary["total_events"] >= 1
    assert "governance" in summary["events_by_type"]


def test_fairness_report_endpoint(client, db, seed_model):
    """Test GET /governance/fairness-report endpoint."""
    # Seed applicants and scoring requests to calculate metrics
    app1 = Applicant(
        applicant_id="app-1", age=25, gender="Female", education_level="Bachelor",
        marital_status="Single", income=50000, credit_score=700, debt_to_income_ratio=0.2,
        assets_value=10000, employment_status="Employed", years_at_current_job=3,
        payment_history="Good"
    )
    app2 = Applicant(
        applicant_id="app-2", age=35, gender="Male", education_level="Bachelor",
        marital_status="Married", income=75000, credit_score=720, debt_to_income_ratio=0.3,
        assets_value=150000, employment_status="Employed", years_at_current_job=5,
        payment_history="Good"
    )
    db.add_all([app1, app2])
    db.commit()
    
    req1 = ScoringRequest(
        request_id="req-1", applicant_id="app-1", loan_amount=10000, loan_purpose="Personal",
        model_version=seed_model.version, model_name=seed_model.model_name,
        risk_rating="Low", default_probability=0.15, raw_probability=0.15, confidence_score=0.9,
        processing_time_ms=10, audit_trail={}
    )
    req2 = ScoringRequest(
        request_id="req-2", applicant_id="app-2", loan_amount=20000, loan_purpose="Personal",
        model_version=seed_model.version, model_name=seed_model.model_name,
        risk_rating="Low", default_probability=0.10, raw_probability=0.10, confidence_score=0.9,
        processing_time_ms=10, audit_trail={}
    )
    db.add_all([req1, req2])
    db.commit()
    
    response = client.get(f"/api/v1/governance/fairness-report?model_id={seed_model.version}")
    assert response.status_code == status.HTTP_200_OK
    report = response.json()
    assert report["model_id"] == seed_model.version
    assert report["total_records"] == 2
    assert "gender" in report["fairness_metrics"]
    assert "age" in report["fairness_metrics"]
