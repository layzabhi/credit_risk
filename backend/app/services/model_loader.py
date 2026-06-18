"""
Model loading and caching service.
Manages ML model artifacts and lifecycle.
"""

import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional
import json
import joblib

from app.config import settings

logger = logging.getLogger(__name__)


import sys
import pandas as pd
import numpy as np
from app.utils.feature_engineering import add_engineered_features

class LegacyDataPreprocessor:
    """Replica of the training preprocessor to allow deserialization and transformation."""
    version = "1.0"

    def __init__(self, config=None):
        self.config = config
        self.scaler = None
        self.encoders = {}
        self.ohe = None
        self.ohe_cols = None

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X = self._handle_missing_values(X)
        X = self._encode_categorical(X, fit=False)
        X = add_engineered_features(X)
        X = self._scale_features(X, fit=False)
        return X

    def _handle_missing_values(self, X: pd.DataFrame) -> pd.DataFrame:
        strategy = self.config['data']['missing_values']['strategy']
        if strategy == 'drop':
            X = X.dropna()
        elif strategy == 'impute':
            method = self.config['data']['missing_values']['impute_method']
            X = X.fillna(X.mean(numeric_only=True) if method == 'mean' else X.median(numeric_only=True))
        return X

    def _handle_outliers(self, X: pd.DataFrame) -> pd.DataFrame:
        return X

    def _encode_categorical(self, X: pd.DataFrame, fit: bool = False) -> pd.DataFrame:
        X = X.copy()
        history_map = {"Poor": 0, "Fair": 1, "Good": 2}
        edu_map = {"High School": 0, "Bachelor": 1, "Master": 2, "PhD": 3}
        if "payment_history" in X.columns:
            X["payment_history"] = X["payment_history"].map(history_map).fillna(2)
        if "education_level" in X.columns:
            X["education_level"] = X["education_level"].map(edu_map).fillna(0)
        if "gender" in X.columns:
            X["gender"] = X["gender"].map({"Male": 1, "Female": 0}).fillna(0)
        if "employment_status" in X.columns:
            X["employment_status"] = X["employment_status"].map({"Employed": 1, "Unemployed": 0}).fillna(1)
        nominal_cols = [col for col in ["marital_status", "loan_purpose"] if col in X.columns]
        if self.ohe is not None and nominal_cols:
            ohe_data = self.ohe.transform(X[nominal_cols])
            ohe_df = pd.DataFrame(ohe_data, columns=self.ohe_cols, index=X.index)
            X = pd.concat([X.drop(columns=nominal_cols), ohe_df], axis=1)
        bool_cols = X.select_dtypes(include=['bool']).columns
        X[bool_cols] = X[bool_cols].astype(int)
        return X

    def _scale_features(self, X: pd.DataFrame, fit: bool = False) -> pd.DataFrame:
        if self.scaler:
            if hasattr(self.scaler, "feature_names_in_"):
                X = X[list(self.scaler.feature_names_in_)]
            X = pd.DataFrame(
                self.scaler.transform(X),
                columns=X.columns,
                index=X.index,
            )
        return X


class ModelLoader:
    """
    Load and cache ML models for inference.
    
    Handles:
    - Model loading from disk
    - Preprocessor loading
    - Model caching
    - Metadata management
    """
    
    def __init__(self, model_dir: str = "./ml_models"):
        """
        Initialize model loader.
        
        Args:
            model_dir: Directory containing model artifacts
        """
        self.model_dir = Path(model_dir)
        self.models: Dict[str, Any] = {}
        self.preprocessors: Dict[str, Any] = {}
        self.metadata: Dict[str, Any] = {}
        self.feature_names: Dict[str, Any] = {}
        self.calibration_data: Dict[str, Any] = {}
        self.primary_model: Optional[str] = None
        
        logger.info(f"ModelLoader initialized with dir={model_dir}")
    
    async def load_models(self) -> None:
        """
        Load all models from directory.
        
        Expected structure:
        - model_dir/
          - xgboost_ensemble/
            - model.pkl
            - preprocessor.pkl
            - metadata.json
            - feature_names.json (optional)
            - calibration_data.pkl (optional)
        """
        # Inject DataPreprocessor into __main__ module to support unpickling
        import __main__
        __main__.DataPreprocessor = LegacyDataPreprocessor
        sys.modules['__main__'].DataPreprocessor = LegacyDataPreprocessor

        if not self.model_dir.exists():
            logger.warning(f"Model directory '{self.model_dir}' does not exist.")
            return

        for model_subdir in self.model_dir.iterdir():
            if model_subdir.is_dir() and not model_subdir.name.startswith("."):
                model_name = model_subdir.name
                model_path = model_subdir / "model.pkl"
                preprocessor_path = model_subdir / "preprocessor.pkl"
                metadata_path = model_subdir / "metadata.json"
                feature_names_path = model_subdir / "feature_names.json"
                calibration_path = model_subdir / "calibration_data.pkl"
                
                # Check if crucial files exist and are not empty
                if not (model_path.exists() and preprocessor_path.exists()):
                    logger.warning(f"Skipping model '{model_name}': model.pkl or preprocessor.pkl missing.")
                    continue
                    
                if model_path.stat().st_size == 0 or preprocessor_path.stat().st_size == 0:
                    logger.warning(f"Skipping model '{model_name}': model.pkl or preprocessor.pkl is empty (0 bytes).")
                    continue
                
                try:
                    logger.info(f"Loading model '{model_name}'...")
                    self.models[model_name] = joblib.load(model_path)
                    self.preprocessors[model_name] = joblib.load(preprocessor_path)
                    
                    if metadata_path.exists() and metadata_path.stat().st_size > 0:
                        with open(metadata_path, "r") as f:
                            self.metadata[model_name] = json.load(f)
                    else:
                        self.metadata[model_name] = {"name": model_name, "version": "1.0.0"}
                        
                    if feature_names_path.exists() and feature_names_path.stat().st_size > 0:
                        with open(feature_names_path, "r") as f:
                            self.feature_names[model_name] = json.load(f)
                            
                    if calibration_path.exists() and calibration_path.stat().st_size > 0:
                        self.calibration_data[model_name] = joblib.load(calibration_path)
                        
                    logger.info(f"Successfully loaded model '{model_name}'")
                except Exception as e:
                    logger.error(f"Error loading model '{model_name}': {e}", exc_info=True)
        
        # Set primary model
        if settings.PRIMARY_MODEL in self.models:
            self.primary_model = settings.PRIMARY_MODEL
        elif "xgboost_ensemble" in self.models:
            self.primary_model = "xgboost_ensemble"
        elif self.models:
            self.primary_model = list(self.models.keys())[0]
            
        if self.primary_model:
            logger.info(f"Primary model set to: '{self.primary_model}'")
        else:
            logger.warning("No models successfully loaded. API will start without active scoring models.")
    
    def get_model(self, model_name: str) -> Any:
        """Get cached model by name."""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not found. Available: {list(self.models.keys())}")
        return self.models[model_name]
    
    def get_primary_model(self) -> Any:
        """Get the primary production model."""
        if not self.primary_model:
            raise ValueError("No primary model set")
        return self.get_model(self.primary_model)
    
    def set_primary_model(self, model_name: str) -> None:
        """Set which model to use for production scoring."""
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not loaded")
        self.primary_model = model_name
        logger.info(f"Primary model set to: {model_name}")
    
    def get_preprocessor(self, model_name: str) -> Optional[Any]:
        """Get preprocessor for a model."""
        return self.preprocessors.get(model_name)
    
    def get_metadata(self, model_name: str) -> Dict[str, Any]:
        """Get model metadata."""
        return self.metadata.get(model_name, {})
    
    def get_feature_names(self, model_name: str) -> list[str]:
        """Get feature names for a model."""
        return self.feature_names.get(model_name, [])
    
    def get_calibration_data(self, model_name: str) -> Optional[Any]:
        """Get calibration data/tuner for a model."""
        return self.calibration_data.get(model_name)
    
    async def cleanup(self) -> None:
        """Clean up resources."""
        self.models.clear()
        self.preprocessors.clear()
        self.metadata.clear()
        self.feature_names.clear()
        self.calibration_data.clear()
        self.primary_model = None
        logger.info("ModelLoader cleaned up")
    
    def list_models(self) -> list[str]:
        """Get list of loaded model names."""
        return list(self.models.keys())