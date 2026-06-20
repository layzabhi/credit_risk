"""
Performance and fairness metric calculations.
Includes confidence scoring, classification metrics, and fairness checks.
"""

import numpy as np


def calculate_confidence_score(probability: float, shap_importance_sum: float) -> float:
    """
    Compute confidence score of prediction (0 to 1).
    Confidence is higher if probability is close to 0 or 1 (low entropy)
    and if SHAP feature importance sum is high (strong explanatory evidence).
    """
    # Proximity to decision boundary (0.5 is maximum uncertainty)
    distance_from_boundary = abs(probability - 0.5) * 2.0  # 0.0 (uncertain) to 1.0 (certain)
    
    # SHAP contribution factor (cap sum of importances at 2.0 for maximum certainty contribution)
    shap_factor = min(1.0, float(shap_importance_sum) / 2.0) if shap_importance_sum > 0 else 0.0
    
    # Weighted average: 70% boundary proximity, 30% SHAP factor
    confidence = 0.7 * distance_from_boundary + 0.3 * shap_factor
    
    return float(np.clip(confidence, 0.0, 1.0))

