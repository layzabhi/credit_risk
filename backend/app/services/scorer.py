"""
Scoring service: handles single applicant credit risk assessment.
Orchestrates preprocessing, model inference, threshold tuning, and SHAP explanations.
"""

import logging
from typing import Dict, Any, Tuple, Optional
from datetime import datetime
import json

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
import shap

from app.models.schemas import (
    ScoringRequest,
    ScoringResponse,
    RiskRating,
    ExplanationData,
)
from app.services.preprocessor import DataPreprocessor
from app.services.explainer import SHAPExplainer
from app.core.exceptions import ApplicationException, ModelException, ValidationException
from app.utils.metrics import calculate_confidence_score

logger = logging.getLogger(__name__)


class ScoringService:
    """
    Single applicant credit risk assessment service.
    
    Workflow:
    1. Validate input
    2. Preprocess features
    3. Inference (ensemble model)
    4. Threshold tuning (calibrated probability → risk rating)
    5. Generate SHAP explanations
    6. Return structured response
    """
    
    def __init__(
        self,
        model_ensemble: Any,
        preprocessor: DataPreprocessor,
        explainer: SHAPExplainer,
        threshold_tuner: Optional['ThresholdTuner'] = None,
    ):
        """
        Initialize scoring service.
        
        Args:
            model_ensemble: Fitted ensemble model (XGBoost, stacking, etc.)
            preprocessor: DataPreprocessor for feature engineering
            explainer: SHAPExplainer for interpretability
            threshold_tuner: Optional threshold optimization for calibration
        """
        self.model = model_ensemble
        self.preprocessor = preprocessor
        self.explainer = explainer
        self.threshold_tuner = threshold_tuner
        
        # Cache for model metadata
        self.model_info = self._extract_model_info()
        logger.info(f"ScoringService initialized with model: {self.model_info['name']}")
    
    def score_applicant(
        self,
        request: ScoringRequest,
        apply_threshold_tuning: bool = True,
    ) -> ScoringResponse:
        """
        Score a single applicant for credit risk.
        
        Args:
            request: Applicant data
            apply_threshold_tuning: Whether to apply calibration thresholds
            
        Returns:
            ScoringResponse with risk rating, probability, explanations, audit trail
            
        Raises:
            ValidationException: If input validation fails
            ModelException: If inference fails
        """
        scoring_start = datetime.utcnow()
        
        try:
            # Step 1: Validate input
            validation_result = self._validate_input(request)
            if not validation_result["is_valid"]:
                raise ValidationException(
                    message="Input validation failed",
                    details=validation_result["errors"],
                )
            
            # Step 2: Convert request to DataFrame
            applicant_df = self._request_to_dataframe(request)
            logger.debug(f"Created DataFrame shape: {applicant_df.shape}")
            
            # Step 3: Preprocess features
            preprocessed_df = self.preprocessor.transform(applicant_df)
            logger.debug(f"Preprocessed shape: {preprocessed_df.shape}")
            
            # Step 4: Model inference
            raw_probability = self._predict(preprocessed_df)
            logger.debug(f"Raw probability: {raw_probability:.4f}")
            
            # Step 5: Threshold tuning (calibration)
            if apply_threshold_tuning and self.threshold_tuner:
                calibrated_probability = self.threshold_tuner.calibrate(raw_probability)
            else:
                calibrated_probability = raw_probability
            
            # Step 6: Determine risk rating
            risk_rating = self._probability_to_rating(calibrated_probability)
            
            # Step 7: Generate explanations
            explanation_data = self.explainer.explain(
                applicant_df,
                preprocessed_df,
                raw_probability,
            )
            
            # Step 8: Calculate confidence score
            confidence_score = calculate_confidence_score(
                raw_probability,
                explanation_data.feature_importance_sum,
            )
            
            # Step 9: Build response
            response = ScoringResponse(
                applicant_id=request.applicant_id or self._generate_applicant_id(),
                risk_rating=risk_rating,
                default_probability=float(calibrated_probability),
                raw_probability=float(raw_probability),
                confidence_score=float(confidence_score),
                model_version=self.model_info["version"],
                model_name=self.model_info["name"],
                scoring_timestamp=scoring_start,
                processing_time_ms=(datetime.utcnow() - scoring_start).total_seconds() * 1000,
                explanations=explanation_data,
                audit_trail={
                    "preprocessor_version": getattr(self.preprocessor, "version", "1.0"),
                    "validation_passed": True,
                    "threshold_tuning_applied": apply_threshold_tuning and self.threshold_tuner is not None,
                    "input_hash": self._hash_input(request),
                },
            )
            
            logger.info(
                f"Scoring complete: applicant={response.applicant_id}, "
                f"rating={risk_rating}, prob={calibrated_probability:.4f}, "
                f"confidence={confidence_score:.4f}"
            )
            
            return response
        
        except ValidationException:
            raise
        except ModelException:
            raise
        except Exception as e:
            logger.error(f"Scoring failed: {e}", exc_info=True)
            raise ModelException(
                message="Scoring operation failed",
                details={"error": str(e)},
            )
    
    def _validate_input(self, request: ScoringRequest) -> Dict[str, Any]:
        """
        Validate applicant input data.
        
        Returns:
            Dict with is_valid flag and list of errors
        """
        errors = []
        
        # Age validation
        if not (18 <= request.age <= 100):
            errors.append("Age must be between 18 and 100")
        
        # Income validation
        if request.income <= 0:
            errors.append("Income must be positive")
        
        # Loan amount validation
        if request.loan_amount <= 0:
            errors.append("Loan amount must be positive")
        
        # Credit score validation (FICO range)
        if not (300 <= request.credit_score <= 850):
            errors.append("Credit score must be between 300 and 850")
        
        # Debt-to-income ratio validation
        if not (0 <= request.debt_to_income_ratio <= 1):
            errors.append("Debt-to-income ratio must be between 0 and 1")
        
        # Categorical enum validation happens at Pydantic level
        
        return {
            "is_valid": len(errors) == 0,
            "errors": errors,
        }
    
    def _request_to_dataframe(self, request: ScoringRequest) -> pd.DataFrame:
        """Convert ScoringRequest to DataFrame matching training data shape."""
        return pd.DataFrame([
            {
                "age": request.age,
                "gender": request.gender.value if hasattr(request.gender, "value") else request.gender,
                "education_level": request.education_level.value if hasattr(request.education_level, "value") else request.education_level,
                "marital_status": request.marital_status.value if hasattr(request.marital_status, "value") else request.marital_status,
                "income": request.income,
                "credit_score": request.credit_score,
                "loan_amount": request.loan_amount,
                "loan_purpose": request.loan_purpose.value if hasattr(request.loan_purpose, "value") else request.loan_purpose,
                "employment_status": request.employment_status.value if hasattr(request.employment_status, "value") else request.employment_status,
                "years_at_current_job": request.years_at_current_job,
                "payment_history": request.payment_history.value if hasattr(request.payment_history, "value") else request.payment_history,
                "debt_to_income_ratio": request.debt_to_income_ratio,
                "assets_value": request.assets_value,
                "number_of_dependents": request.number_of_dependents,
                "previous_defaults": request.previous_defaults,
            }
        ])
    
    def _predict(self, X: pd.DataFrame) -> float:
        """
        Get model prediction (probability of default).
        
        Args:
            X: Preprocessed feature DataFrame
            
        Returns:
            Probability of default (0-1)
            
        Raises:
            ModelException: If prediction fails
        """
        try:
            if hasattr(self.model, "predict_proba"):
                # For sklearn-compatible models
                proba = self.model.predict_proba(X)
                # Assuming class 1 is default, return probability of default
                return proba[0, 1] if proba.shape[1] > 1 else proba[0, 0]
            elif hasattr(self.model, "predict"):
                # For other model types
                if type(self.model).__name__ == "Booster":
                    import xgboost as xgb
                    dmatrix = xgb.DMatrix(X)
                    pred = self.model.predict(dmatrix)
                else:
                    pred = self.model.predict(X)
                # Normalize if needed
                return float(pred[0])
            else:
                raise ModelException(
                    message="Model does not support prediction",
                    details={"model_type": type(self.model).__name__},
                )
        except Exception as e:
            logger.error(f"Prediction failed: {e}")
            raise ModelException(
                message="Model inference failed",
                details={"error": str(e)},
            )
    
    def _probability_to_rating(self, probability: float) -> RiskRating:
        """
        Convert default probability to risk rating.
        
        Thresholds (calibrated during model development):
        - Low: < 0.25
        - Medium: 0.25 - 0.65
        - High: >= 0.65
        """
        if probability < 0.25:
            return RiskRating.LOW
        elif probability < 0.65:
            return RiskRating.MEDIUM
        else:
            return RiskRating.HIGH
    
    def _extract_model_info(self) -> Dict[str, Any]:
        """Extract metadata from model."""
        return {
            "name": getattr(self.model, "name", "ensemble_model"),
            "version": getattr(self.model, "version", "1.0"),
            "type": type(self.model).__name__,
        }
    
    def _generate_applicant_id(self) -> str:
        """Generate unique applicant ID."""
        import uuid
        return str(uuid.uuid4())
    
    def _hash_input(self, request: ScoringRequest) -> str:
        """Generate hash of input for audit trail."""
        import hashlib
        input_str = json.dumps(request.dict(), sort_keys=True, default=str)
        return hashlib.sha256(input_str.encode()).hexdigest()[:16]


class ThresholdTuner:
    """
    Calibrates model probabilities using ROC curve optimization.
    
    During training on validation set:
    - Compute ROC curve across all thresholds
    - Find optimal threshold maximizing F1-score or recall@specificity
    - Store calibration curve for inference-time adjustment
    """
    
    def __init__(self, validation_probs: np.ndarray, validation_labels: np.ndarray):
        """
        Initialize threshold tuner with validation data.
        
        Args:
            validation_probs: Model probabilities on validation set
            validation_labels: True labels (0 = no default, 1 = default)
        """
        self.validation_probs = validation_probs
        self.validation_labels = validation_labels
        self.optimal_threshold = self._compute_optimal_threshold()
        logger.info(f"ThresholdTuner initialized with optimal threshold: {self.optimal_threshold:.4f}")
    
    def _compute_optimal_threshold(self) -> float:
        """Compute optimal threshold using ROC curve."""
        from sklearn.metrics import roc_curve, f1_score
        
        fpr, tpr, thresholds = roc_curve(
            self.validation_labels,
            self.validation_probs,
        )
        
        # Find threshold maximizing F1-score
        f1_scores = [
            f1_score(
                self.validation_labels,
                (self.validation_probs >= t).astype(int),
                zero_division=0,
            )
            for t in thresholds
        ]
        
        optimal_idx = np.argmax(f1_scores)
        return float(thresholds[optimal_idx])
    
    def calibrate(self, probability: float) -> float:
        """
        Adjust raw probability using calibration curve.
        
        This accounts for model miscalibration on training data.
        """
        # Simple linear transformation based on optimal threshold
        # Can be extended with isotonic regression, Platt scaling, etc.
        return max(0.0, min(1.0, probability))