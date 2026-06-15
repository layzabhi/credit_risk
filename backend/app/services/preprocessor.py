"""
Data preprocessing service for feature engineering and transformation.
Handles encoding, scaling, and feature creation.
"""

import logging
from typing import Tuple, Optional, Dict, Any

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder

from app.utils.feature_engineering import add_engineered_features

logger = logging.getLogger(__name__)


class DataPreprocessor:
    """
    Data preprocessing pipeline for scoring requests.
    
    Handles:
    - Categorical encoding
    - Feature scaling
    - Feature engineering
    - Missing value handling
    """
    
    def __init__(self, version: str = "1.0"):
        """Initialize preprocessor."""
        self.version = version
        self.scaler = StandardScaler()
        self.encoders: Dict[str, LabelEncoder] = {}
        self.feature_names: Optional[list] = None
        self.categorical_cols = [
            "gender",
            "education_level",
            "marital_status",
            "loan_purpose",
            "employment_status",
            "payment_history",
        ]
        logger.info(f"DataPreprocessor v{version} initialized")
    
    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None) -> "DataPreprocessor":
        """
        Fit preprocessor on training data.
        
        Args:
            X: Training features
            y: Target variable (optional)
            
        Returns:
            Self for chaining
        """
        logger.info(f"Fitting preprocessor on {len(X)} rows...")
        X_copy = X.copy()
        
        # 1. Fit categorical encoders
        for col in self.categorical_cols:
            if col in X_copy.columns:
                le = LabelEncoder()
                # Convert to string and add an 'Unknown' class to handle unseen data during transform
                unique_vals = X_copy[col].astype(str).unique().tolist()
                if "Unknown" not in unique_vals:
                    unique_vals.append("Unknown")
                le.fit(unique_vals)
                self.encoders[col] = le
                
        # Apply encoding for numerical fitting
        X_encoded = self._encode_categorical(X_copy, fit=True)
        
        # 2. Engineer features
        X_engineered = self._engineer_features(X_encoded)
        
        # 3. Fit scaler on numerical columns
        # All columns not in categorical_cols are numerical
        self.numerical_cols = [col for col in X_engineered.columns if col not in self.categorical_cols]
        
        if self.numerical_cols:
            # Fill NaNs with median/mean before scaling
            X_num = X_engineered[self.numerical_cols].fillna(X_engineered[self.numerical_cols].median())
            self.scaler.fit(X_num)
            
        # Store feature names
        self.feature_names = list(X_engineered.columns)
        logger.info(f"Preprocessor fit complete. Features: {self.feature_names}")
        return self
    
    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """
        Transform data using fitted preprocessor.
        
        Args:
            X: Data to transform
            
        Returns:
            Transformed DataFrame
        """
        if self.feature_names is None:
            raise ValueError("Preprocessor has not been fitted yet.")
            
        X_copy = X.copy()
        
        # 1. Encode categorical features
        X_encoded = self._encode_categorical(X_copy, fit=False)
        
        # 2. Engineer features
        X_engineered = self._engineer_features(X_encoded)
        
        # Ensure all expected columns are present
        for col in self.feature_names:
            if col not in X_engineered.columns:
                # Add missing column with 0
                X_engineered[col] = 0.0
                
        # Align column order with feature_names
        X_engineered = X_engineered[self.feature_names]
        
        # 3. Scale numerical features
        if self.numerical_cols:
            # Fill NaNs
            X_num = X_engineered[self.numerical_cols].fillna(0.0)
            X_scaled = self.scaler.transform(X_num)
            X_engineered[self.numerical_cols] = X_scaled
            
        return X_engineered
    
    def fit_transform(self, X: pd.DataFrame, y: Optional[pd.Series] = None) -> pd.DataFrame:
        """Fit and transform in one step."""
        return self.fit(X, y).transform(X)
    
    def _encode_categorical(self, X: pd.DataFrame, fit: bool = False) -> pd.DataFrame:
        """Encode categorical variables using fitted LabelEncoders."""
        X_encoded = X.copy()
        for col in self.categorical_cols:
            if col in X_encoded.columns and col in self.encoders:
                le = self.encoders[col]
                # Map unseen values to 'Unknown'
                classes = set(le.classes_)
                X_encoded[col] = X_encoded[col].astype(str).apply(
                    lambda val: val if val in classes else "Unknown"
                )
                X_encoded[col] = le.transform(X_encoded[col])
        return X_encoded
    
    def _scale_numerical(self, X: pd.DataFrame, fit: bool = False) -> pd.DataFrame:
        """Scale numerical features using fitted StandardScaler."""
        # Handled inside fit and transform directly
        return X
    
    def _engineer_features(self, X: pd.DataFrame) -> pd.DataFrame:
        """Create additional engineered features."""
        return add_engineered_features(X)
    
    def get_feature_names(self) -> list:
        """Get list of feature names after preprocessing."""
        return self.feature_names or []