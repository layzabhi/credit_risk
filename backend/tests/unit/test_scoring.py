"""
Unit tests for ScoringService and ThresholdTuner.
"""

import numpy as np
import pytest

from app.services.scorer import ScoringService, ThresholdTuner
from app.models.schemas import RiskRating
from tests.fixtures.sample_data import sample_request, sample_request_dict


class DummyModel:
    """Mock ML classifier model."""
    def __init__(self):
        self.name = "dummy_ensemble"
        self.version = "2.0.0"
        
    def predict_proba(self, X):
        # Returns [P(no default), P(default)]
        # Row 0 -> default probability 0.20
        return np.array([[0.80, 0.20]])


class DummyPreprocessor:
    """Mock DataPreprocessor."""
    def __init__(self):
        self.version = "1.0"
        
    def transform(self, X):
        return X


class DummyExplainer:
    """Mock SHAPExplainer."""
    def explain(self, original_X, preprocessed_X, prediction):
        from app.models.schemas import ExplanationData, FeatureImportance
        return ExplanationData(
            top_features=[
                FeatureImportance(name="credit_score", impact=1.0, direction="negative")
            ],
            feature_importance_sum=1.0,
            base_value=0.5,
            shap_values={"credit_score": -0.2}
        )


def test_scoring_service_single_applicant(sample_request):
    """Test standard single applicant scoring output structure."""
    model = DummyModel()
    preprocessor = DummyPreprocessor()
    explainer = DummyExplainer()
    
    service = ScoringService(
        model_ensemble=model,
        preprocessor=preprocessor,
        explainer=explainer
    )
    
    response = service.score_applicant(sample_request, apply_threshold_tuning=False)
    
    # Assert output structure
    assert response.applicant_id == sample_request.applicant_id
    assert response.risk_rating == RiskRating.LOW  # Prob 0.20 < 0.25 is LOW
    assert response.default_probability == pytest.approx(0.20)
    assert response.raw_probability == pytest.approx(0.20)
    assert response.model_version == "2.0.0"
    assert response.model_name == "dummy_ensemble"
    assert len(response.explanations.top_features) == 1
    assert response.explanations.top_features[0].name == "credit_score"


def test_threshold_tuner_optimization():
    """Test ThresholdTuner calibration calculation logic."""
    # Create mock validation data where FICO score < 600 predicts default
    np.random.seed(42)
    val_probs = np.random.uniform(0.0, 1.0, size=100)
    # Target = 1 if prob > 0.5 else 0
    val_labels = (val_probs >= 0.5).astype(int)
    
    tuner = ThresholdTuner(validation_probs=val_probs, validation_labels=val_labels)
    
    assert tuner.optimal_threshold >= 0.0
    assert tuner.optimal_threshold <= 1.0
    
    # Calibrate should clip to [0.0, 1.0]
    assert tuner.calibrate(1.2) == 1.0
    assert tuner.calibrate(-0.5) == 0.0
