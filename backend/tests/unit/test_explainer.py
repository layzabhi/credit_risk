"""
Unit tests for SHAPExplainer explainability service.
"""

import numpy as np
import pandas as pd
from sklearn.tree import DecisionTreeClassifier

from app.services.explainer import SHAPExplainer


def test_shap_explainer_with_tree_model():
    """Test SHAPExplainer on a simple fitted DecisionTree model."""
    # 1. Fit a dummy model
    X_train = pd.DataFrame({
        "credit_score": [750, 680, 580, 710, 620, 500],
        "income": [100000.0, 80000.0, 50000.0, 90000.0, 60000.0, 30000.0],
        "debt_to_income_ratio": [0.20, 0.35, 0.45, 0.25, 0.40, 0.60]
    })
    y_train = np.array([0, 0, 1, 0, 1, 1])
    
    model = DecisionTreeClassifier(max_depth=3, random_state=42)
    model.fit(X_train, y_train)
    
    # 2. Initialize explainer
    explainer = SHAPExplainer(model=model, explainer_type="tree")
    
    # 3. Generate explanation
    sample_raw = pd.DataFrame({
        "credit_score": [720],
        "income": [85000.0],
        "debt_to_income_ratio": [0.30]
    })
    
    explanation = explainer.explain(
        original_X=sample_raw,
        preprocessed_X=sample_raw,
        prediction=0.10
    )
    
    # 4. Assert structure
    assert explanation.base_value is not None
    assert len(explanation.top_features) > 0
    assert explanation.feature_importance_sum > 0
    
    # Verify top feature direction
    for feat in explanation.top_features:
        assert feat.name in ["credit_score", "income", "debt_to_income_ratio"]
        assert feat.direction in ["positive", "negative"]
        assert 0.0 <= feat.impact <= 1.0
        
    # Test plot format helpers
    waterfall = explainer.get_waterfall_data(sample_raw, np.array([[0.1, -0.05, 0.02]]))
    assert waterfall["base_value"] is not None
    assert len(waterfall["features"]) == 3
    
    force = explainer.get_force_plot_data(sample_raw, np.array([[0.1, -0.05, 0.02]]))
    assert force["base_value"] is not None
    assert "positive_features" in force
    assert "negative_features" in force
