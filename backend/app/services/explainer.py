"""
SHAP-based explainability service.
Generates feature importance and prediction explanations.
"""

import logging
from typing import Any, Dict, Optional, List

import numpy as np
import pandas as pd
import shap

from app.models.schemas import ExplanationData, FeatureImportance

logger = logging.getLogger(__name__)


class SHAPExplainer:
    """
    SHAP explainability service for model interpretability.
    
    Generates:
    - Feature importance (SHAP values)
    - Waterfall plots
    - Force plots
    - Dependence plots
    """
    
    def __init__(
        self,
        model: Any,
        background_data: Optional[np.ndarray] = None,
        explainer_type: str = "tree",
    ):
        """
        Initialize SHAP explainer.
        
        Args:
            model: Trained model (XGBoost, LightGBM, sklearn, etc.)
            background_data: Background data for KernelExplainer
            explainer_type: "tree", "kernel", or "sampling"
        """
        self.model = model
        self.explainer = None
        self.background_data = background_data
        self.explainer_type = explainer_type
        
        self._initialize_explainer()
        logger.info(f"SHAPExplainer initialized with type={explainer_type}")
    
    def _initialize_explainer(self) -> None:
        """Initialize appropriate SHAP explainer based on model type."""
        try:
            # 1. Detect if model is tree-based (XGBoost, LightGBM, RandomForest)
            # If so, use TreeExplainer as it is extremely fast and exact
            model_type_name = type(self.model).__name__.lower()
            
            if "xgb" in model_type_name or "lgb" in model_type_name or "forest" in model_type_name or "tree" in model_type_name:
                logger.info("Tree-based model detected. Using TreeExplainer.")
                self.explainer = shap.TreeExplainer(self.model)
            else:
                # Fallback to general Explainer
                if self.background_data is not None:
                    # Sample background data to speed up KernelExplainer
                    bg_sample = shap.sample(self.background_data, min(50, len(self.background_data)))
                    self.explainer = shap.KernelExplainer(self.model.predict, bg_sample)
                else:
                    self.explainer = shap.Explainer(self.model)
                    
        except Exception as e:
            logger.error(f"Failed to initialize explainer: {e}. Falling back to default Explainer.")
            try:
                self.explainer = shap.Explainer(self.model)
            except Exception as ex:
                logger.error(f"Critical error initializing shap.Explainer: {ex}")
                self.explainer = None
    
    def explain(
        self,
        original_X: pd.DataFrame,
        preprocessed_X: pd.DataFrame,
        prediction: float,
    ) -> ExplanationData:
        """
        Generate SHAP explanation for a prediction.
        
        Args:
            original_X: Original unpreprocessed features
            preprocessed_X: Preprocessed features for model
            prediction: Model's prediction (probability)
            
        Returns:
            ExplanationData with top features and SHAP values
        """
        try:
            # Compute SHAP values
            shap_values = self._compute_shap_values(preprocessed_X)
            
            # Extract top features
            top_features = self._get_top_features(
                preprocessed_X,
                shap_values,
                original_X,
                top_k=5,
            )
            
            # Compute feature importance sum
            feature_importance_sum = sum(f.impact for f in top_features)
            
            # Extract flat SHAP dictionary
            shap_dict = {}
            if shap_values is not None and len(shap_values) > 0:
                row_values = shap_values[0]
                # If row_values is 2D (e.g. multi-class/binary list output), grab the positive class values
                if isinstance(row_values, np.ndarray) and len(row_values.shape) > 1:
                    row_values = row_values[:, 1]
                
                for col, val in zip(preprocessed_X.columns, row_values):
                    shap_dict[col] = float(val)
            
            return ExplanationData(
                top_features=top_features,
                feature_importance_sum=feature_importance_sum,
                base_value=self._get_base_value(),
                shap_values=shap_dict,
            )
        except Exception as e:
            logger.error(f"SHAP explanation failed: {e}", exc_info=True)
            # Return minimal explanation if SHAP fails
            return ExplanationData(
                top_features=[],
                feature_importance_sum=0.0,
                base_value=float(prediction),
                shap_values={},
            )
    
    def _compute_shap_values(self, X: pd.DataFrame) -> np.ndarray:
        """Compute SHAP values for features."""
        if self.explainer is None:
            raise ValueError("SHAP explainer is not initialized.")
            
        # Get raw SHAP values
        try:
            # TreeExplainer or Explainer
            res = self.explainer(X)
            if hasattr(res, "values"):
                vals = res.values
            else:
                vals = res
        except Exception as e:
            logger.warning(f"Default SHAP call failed: {e}. Trying KernelExplainer path.")
            if hasattr(self.explainer, "shap_values"):
                vals = self.explainer.shap_values(X)
            else:
                raise e
                
        # If output is a list (typical for some classifiers returning probabilities for each class)
        if isinstance(vals, list):
            # Take class 1 (default) SHAP values
            vals = vals[1]
            
        # Ensure 2D array
        if len(vals.shape) == 1:
            vals = vals.reshape(1, -1)
            
        return vals
    
    def _get_top_features(
        self,
        preprocessed_X: pd.DataFrame,
        shap_values: np.ndarray,
        original_X: pd.DataFrame,
        top_k: int = 5,
    ) -> List[FeatureImportance]:
        """Extract top K most important features."""
        if shap_values is None or len(shap_values) == 0:
            return []
            
        row_shap = shap_values[0]
        # In case of 2D class output
        if len(row_shap.shape) > 1:
            row_shap = row_shap[:, 1]
            
        # Create list of features with impact
        features = []
        for i, col in enumerate(preprocessed_X.columns):
            val = float(row_shap[i])
            impact = abs(val)
            direction = "positive" if val >= 0 else "negative"
            
            # Map preprocessed features back to original columns where possible for better display
            display_name = col
            # Find closest original column name
            for orig_col in original_X.columns:
                if orig_col in col:
                    display_name = orig_col
                    break
                    
            features.append({
                "name": display_name,
                "impact": impact,
                "direction": direction,
            })
            
        # Sort by absolute impact
        features.sort(key=lambda x: x["impact"], reverse=True)
        
        # Take top K
        top_features_raw = features[:top_k]
        
        # Convert to FeatureImportance Pydantic objects
        # Map values to a 0-1 scale relative to the sum of top K for standard Pydantic schema validation
        total_top_impact = sum(f["impact"] for f in top_features_raw) or 1.0
        
        return [
            FeatureImportance(
                name=f["name"],
                impact=float(f["impact"] / total_top_impact),
                direction=f["direction"],
            )
            for f in top_features_raw
        ]
    
    def _get_base_value(self) -> Optional[float]:
        """Get SHAP base value (expected model output)."""
        try:
            if self.explainer is None:
                return None
                
            if hasattr(self.explainer, "expected_value"):
                val = self.explainer.expected_value
                if isinstance(val, (list, np.ndarray)):
                    # For binary classifier, take expected value of positive class
                    return float(val[1]) if len(val) > 1 else float(val[0])
                return float(val)
            return None
        except Exception as e:
            logger.warning(f"Failed to get base value: {e}")
            return None
    
    def get_waterfall_data(
        self,
        X: pd.DataFrame,
        shap_values: np.ndarray,
    ) -> Dict[str, Any]:
        """Generate data for SHAP waterfall plot."""
        if shap_values is None or len(shap_values) == 0:
            return {}
            
        row_shap = shap_values[0]
        base_value = self._get_base_value() or 0.0
        
        features_data = []
        cumulative = base_value
        
        for i, col in enumerate(X.columns):
            val = float(row_shap[i])
            cumulative += val
            features_data.append({
                "name": col,
                "value": float(X.iloc[0][col]),
                "contribution": val,
                "cumulative": cumulative,
            })
            
        # Sort by contribution absolute magnitude
        features_data.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        
        return {
            "base_value": base_value,
            "features": features_data,
            "final_value": cumulative,
        }
    
    def get_force_plot_data(
        self,
        X: pd.DataFrame,
        shap_values: np.ndarray,
    ) -> Dict[str, Any]:
        """Generate data for SHAP force plot."""
        if shap_values is None or len(shap_values) == 0:
            return {}
            
        row_shap = shap_values[0]
        base_value = self._get_base_value() or 0.0
        
        positive_features = []
        negative_features = []
        
        for i, col in enumerate(X.columns):
            val = float(row_shap[i])
            feat_item = {
                "name": col,
                "value": float(X.iloc[0][col]),
                "contribution": val,
            }
            if val >= 0:
                positive_features.append(feat_item)
            else:
                negative_features.append(feat_item)
                
        # Sort by contribution
        positive_features.sort(key=lambda x: x["contribution"], reverse=True)
        negative_features.sort(key=lambda x: x["contribution"])
        
        return {
            "base_value": base_value,
            "positive_features": positive_features,
            "negative_features": negative_features,
            "final_value": base_value + sum(row_shap),
        }
    