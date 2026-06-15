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


def compute_disparate_impact(
    predictions: np.ndarray,
    protected_attribute: np.ndarray,
    favorable_outcome: int = 0,
) -> float:
    """
    Calculate Disparate Impact ratio (80% rule).
    Ratio of favorable outcome rate in unprivileged group vs privileged group.
    Favorable outcome in credit risk is 'no default' (0).
    """
    # Convert inputs to numpy arrays
    preds = np.array(predictions)
    groups = np.array(protected_attribute)
    
    # Identify unique groups
    unique_groups = np.unique(groups)
    if len(unique_groups) < 2:
        return 1.0  # Cannot compute ratio for a single group
    
    # Let's assume group 0 is unprivileged (e.g. Female or Older/Younger)
    # and group 1 is privileged. We'll compute rates for each.
    # If groups are categorical strings, we can sort them.
    # Group with lower selection rate is unprivileged.
    rates = {}
    for g in unique_groups:
        mask = groups == g
        if np.sum(mask) == 0:
            rates[g] = 0.0
        else:
            rates[g] = np.mean(preds[mask] == favorable_outcome)
            
    # Sort groups by rate to find min selection rate / max selection rate
    sorted_rates = sorted(rates.values())
    if sorted_rates[-1] == 0:
        return 1.0
        
    return float(sorted_rates[0] / sorted_rates[-1])


def compute_demographic_parity_difference(
    predictions: np.ndarray,
    protected_attribute: np.ndarray,
    favorable_outcome: int = 0,
) -> float:
    """Compute the difference in selection rates between groups."""
    preds = np.array(predictions)
    groups = np.array(protected_attribute)
    
    unique_groups = np.unique(groups)
    if len(unique_groups) < 2:
        return 0.0
        
    rates = []
    for g in unique_groups:
        mask = groups == g
        if np.sum(mask) > 0:
            rates.append(np.mean(preds[mask] == favorable_outcome))
            
    if len(rates) < 2:
        return 0.0
        
    return float(np.max(rates) - np.min(rates))


def compute_equal_opportunity_difference(
    predictions: np.ndarray,
    true_labels: np.ndarray,
    protected_attribute: np.ndarray,
    favorable_outcome: int = 0,
) -> float:
    """
    Compute equal opportunity difference (difference in TPR / Recall).
    Recall difference between privileged and unprivileged groups.
    """
    preds = np.array(predictions)
    labels = np.array(true_labels)
    groups = np.array(protected_attribute)
    
    unique_groups = np.unique(groups)
    if len(unique_groups) < 2:
        return 0.0
        
    recalls = []
    for g in unique_groups:
        group_mask = groups == g
        # Favorable actual outcomes in this group
        actual_positive_mask = (labels == favorable_outcome) & group_mask
        if np.sum(actual_positive_mask) == 0:
            recalls.append(1.0)
        else:
            recalls.append(np.mean(preds[actual_positive_mask] == favorable_outcome))
            
    if len(recalls) < 2:
        return 0.0
        
    return float(np.max(recalls) - np.min(recalls))
