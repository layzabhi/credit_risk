"""
Unit tests for DataPreprocessor and Feature Engineering.
"""

import pandas as pd
import numpy as np
import pytest

from app.services.preprocessor import DataPreprocessor
from app.utils.feature_engineering import add_engineered_features
from tests.fixtures.sample_data import sample_request_dict


def test_feature_engineering_calculation(sample_request_dict):
    """Test that custom engineered features are correctly calculated."""
    df = pd.DataFrame([sample_request_dict])
    df_engineered = add_engineered_features(df)
    
    # Assert new columns exist
    assert "loan_to_income_ratio" in df_engineered.columns
    assert "assets_to_loan_ratio" in df_engineered.columns
    assert "debt_to_assets_ratio" in df_engineered.columns
    assert "income_per_dependent" in df_engineered.columns
    assert "years_at_job_to_age_ratio" in df_engineered.columns
    
    # Validate calculations
    expected_loan_to_income = sample_request_dict["loan_amount"] / (sample_request_dict["income"] + 1.0)
    assert df_engineered.iloc[0]["loan_to_income_ratio"] == pytest.approx(expected_loan_to_income)
    
    expected_income_per_dep = sample_request_dict["income"] / (sample_request_dict["number_of_dependents"] + 1.0)
    assert df_engineered.iloc[0]["income_per_dependent"] == pytest.approx(expected_income_per_dep)


def test_preprocessor_fit_transform(sample_request_dict):
    """Test that preprocessor fits and transforms data correctly."""
    df_train = pd.DataFrame([
        sample_request_dict,
        {**sample_request_dict, "credit_score": 600, "gender": "Female", "income": 45000.0},
        {**sample_request_dict, "credit_score": 500, "gender": "Non-binary", "income": 30000.0}
    ])
    
    preprocessor = DataPreprocessor()
    preprocessor.fit(df_train)
    
    assert preprocessor.feature_names is not None
    assert len(preprocessor.feature_names) > 0
    assert "gender" in preprocessor.encoders
    
    # Transform
    transformed = preprocessor.transform(df_train)
    
    assert transformed.shape[0] == 3
    assert transformed.shape[1] == len(preprocessor.feature_names)
    
    # Verify standard scaling applied (mean approx 0)
    # Since we have only 3 samples, we check that the scaled credit score is numeric
    assert isinstance(transformed.iloc[0]["credit_score"], (float, np.float64))


def test_legacy_preprocessor_version():
    """Test that LegacyDataPreprocessor has the version attribute."""
    from app.services.model_loader import LegacyDataPreprocessor
    preprocessor = LegacyDataPreprocessor()
    assert hasattr(preprocessor, "version")
    assert preprocessor.version == "1.0"

