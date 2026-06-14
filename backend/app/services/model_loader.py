"""
Model loading and caching service.
Manages ML model artifacts and lifecycle.
"""

import logging
import os
from pathlib import Path
from typing import Dict, Any, Optional

import joblib
import json

logger = logging.getLogger(__name__)


class ModelLoader:
    """
    Load and cache ML models for inference.
    
    Handles:
    - Model loading from disk
    - Preprocessor fitting
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
        self.metadata: Dict[str, Any] = {}
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
          - lightgbm/
            ...
        """
        try:
            # TODO: Iterate through model directories
            # Load model.pkl using joblib
            # Load preprocessor.pkl
            # Load metadata.json
            # Store in self.models dict
            
            logger.info(f"Loaded {len(self.models)} models")
        except Exception as e:
            logger.error(f"Failed to load models: {e}", exc_info=True)
            raise
    
    def get_model(self, model_name: str) -> Any:
        """
        Get cached model by name.
        
        Args:
            model_name: Name of model (e.g., "xgboost_ensemble")
            
        Returns:
            Loaded model object
        """
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
        # TODO: Return fitted preprocessor for model
        pass
    
    def get_metadata(self, model_name: str) -> Dict[str, Any]:
        """Get model metadata."""
        return self.metadata.get(model_name, {})
    
    async def cleanup(self) -> None:
        """Clean up resources."""
        self.models.clear()
        self.metadata.clear()
        logger.info("ModelLoader cleaned up")
    
    def list_models(self) -> list[str]:
        """Get list of loaded model names."""
        return list(self.models.keys())