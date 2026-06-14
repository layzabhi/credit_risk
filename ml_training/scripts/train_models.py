"""
Training Pipeline for Credit Risk Assessment Models
Implements the full workflow: preprocessing → baseline → advanced → ensemble → validation
Based on thesis design: "Utilizing AI for Improved Credit Risk Assessment" (Baglarbasi, 2025)
"""

import os
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Tuple

import numpy as np
import pandas as pd
import yaml
from sklearn.model_selection import train_test_split, KFold, StratifiedKFold
from sklearn.preprocessing import StandardScaler, MinMaxScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, roc_curve, confusion_matrix, classification_report,
)
import xgboost as xgb
import lightgbm as lgb
import joblib
import pickle

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


class DataLoader:
    """Load and merge datasets from multiple sources."""
    
    def __init__(self, data_dir: str = "./data/raw"):
        self.data_dir = Path(data_dir)
    
    def load_datasets(self) -> pd.DataFrame:
        """Load and concatenate all available datasets."""
        dfs = []
        
        # Define datasets to load
        dataset_files = [
            "application_train.csv",
            "cs-training.csv",
            "german_credit_data.csv",
        ]
        
        for filename in dataset_files:
            filepath = self.data_dir / filename
            if filepath.exists():
                try:
                    df = pd.read_csv(filepath)
                    logger.info(f"Loaded {filename}: {len(df)} rows, {len(df.columns)} columns")
                    dfs.append(df)
                except Exception as e:
                    logger.warning(f"Failed to load {filename}: {e}")
        
        if not dfs:
            raise FileNotFoundError(f"No datasets found in {self.data_dir}")
        
        # Standardize column names and merge
        merged = pd.concat(dfs, ignore_index=True)
        logger.info(f"Merged dataset: {len(merged)} rows total")
        
        return merged


class DataPreprocessor:
    """Data preprocessing pipeline."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.scaler = None
        self.encoders = {}
    
    def fit_transform(self, X: pd.DataFrame, y: pd.Series = None) -> Tuple[pd.DataFrame, pd.Series]:
        """Fit preprocessor and transform data."""
        
        # 1. Handle missing values
        X = self._handle_missing_values(X)
        
        # 2. Detect and handle outliers
        X = self._handle_outliers(X)
        
        # 3. Encode categorical variables
        X = self._encode_categorical(X, fit=True)
        
        # 4. Normalize/Standardize numerical features
        X = self._scale_features(X, fit=True)
        
        logger.info(f"Preprocessing complete: {X.shape}")
        
        return X, y
    
    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Transform data using fitted preprocessor."""
        X = self._handle_missing_values(X)
        X = self._encode_categorical(X, fit=False)
        X = self._scale_features(X, fit=False)
        return X
    
    def _handle_missing_values(self, X: pd.DataFrame) -> pd.DataFrame:
        """Handle missing values."""
        strategy = self.config['data']['missing_values']['strategy']
        
        if strategy == 'drop':
            initial_rows = len(X)
            X = X.dropna()
            dropped = initial_rows - len(X)
            logger.info(f"Dropped {dropped} rows with missing values")
        
        elif strategy == 'impute':
            method = self.config['data']['missing_values']['impute_method']
            X = X.fillna(X.mean() if method == 'mean' else X.median())
            logger.info(f"Imputed missing values using {method}")
        
        return X
    
    def _handle_outliers(self, X: pd.DataFrame) -> pd.DataFrame:
        """Detect and handle outliers using IQR method."""
        if not self.config['data']['outliers']['enabled']:
            return X
        
        Q1 = X.quantile(0.25)
        Q3 = X.quantile(0.75)
        IQR = Q3 - Q1
        threshold = self.config['data']['outliers']['threshold']
        
        # Flag outliers
        outlier_mask = ((X < (Q1 - threshold * IQR)) | (X > (Q3 + threshold * IQR))).any(axis=1)
        outliers_count = outlier_mask.sum()
        
        if outliers_count > 0:
            logger.info(f"Detected {outliers_count} outliers")
            # Option: remove or cap
            X = X[~outlier_mask]
        
        return X
    
    def _encode_categorical(self, X: pd.DataFrame, fit: bool = False) -> pd.DataFrame:
        """Encode categorical variables."""
        categorical_cols = X.select_dtypes(include=['object']).columns
        
        for col in categorical_cols:
            if fit:
                encoder = LabelEncoder()
                X[col] = encoder.fit_transform(X[col].astype(str))
                self.encoders[col] = encoder
            else:
                if col in self.encoders:
                    X[col] = self.encoders[col].transform(X[col].astype(str))
        
        return X
    
    def _scale_features(self, X: pd.DataFrame, fit: bool = False) -> pd.DataFrame:
        """Normalize/standardize numerical features."""
        method = self.config['data']['normalization']
        
        if fit:
            if method == 'z_score':
                self.scaler = StandardScaler()
            else:  # minmax
                self.scaler = MinMaxScaler()
            
            X = pd.DataFrame(
                self.scaler.fit_transform(X),
                columns=X.columns,
                index=X.index,
            )
        else:
            if self.scaler:
                X = pd.DataFrame(
                    self.scaler.transform(X),
                    columns=X.columns,
                    index=X.index,
                )
        
        return X


class ModelTrainer:
    """Train and evaluate machine learning models."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.models = {}
        self.metrics = {}
    
    def train_baseline_models(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series,
    ) -> Dict[str, Any]:
        """Train baseline models for comparison."""
        
        baselines = self.config['baseline']
        results = {}
        
        # Logistic Regression
        if baselines['logistic_regression']['enabled']:
            logger.info("Training Logistic Regression...")
            lr = LogisticRegression(**baselines['logistic_regression']['params'])
            lr.fit(X_train, y_train)
            
            y_pred = lr.predict(X_val)
            y_proba = lr.predict_proba(X_val)[:, 1]
            
            results['logistic_regression'] = {
                'model': lr,
                'metrics': self._compute_metrics(y_val, y_pred, y_proba),
            }
        
        # Decision Tree
        if baselines['decision_tree']['enabled']:
            logger.info("Training Decision Tree...")
            dt = DecisionTreeClassifier(**baselines['decision_tree']['params'])
            dt.fit(X_train, y_train)
            
            y_pred = dt.predict(X_val)
            y_proba = dt.predict_proba(X_val)[:, 1]
            
            results['decision_tree'] = {
                'model': dt,
                'metrics': self._compute_metrics(y_val, y_pred, y_proba),
            }
        
        # Random Forest
        if baselines['random_forest']['enabled']:
            logger.info("Training Random Forest...")
            rf = RandomForestClassifier(**baselines['random_forest']['params'])
            rf.fit(X_train, y_train)
            
            y_pred = rf.predict(X_val)
            y_proba = rf.predict_proba(X_val)[:, 1]
            
            results['random_forest'] = {
                'model': rf,
                'metrics': self._compute_metrics(y_val, y_pred, y_proba),
            }
        
        # Log results
        for model_name, result in results.items():
            metrics = result['metrics']
            logger.info(
                f"{model_name}: F1={metrics['f1']:.4f}, "
                f"AUC={metrics['auc_roc']:.4f}, Accuracy={metrics['accuracy']:.4f}"
            )
        
        self.models.update({k: v['model'] for k, v in results.items()})
        self.metrics.update({k: v['metrics'] for k, v in results.items()})
        
        return results
    
    def train_xgboost(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series,
    ) -> Dict[str, Any]:
        """Train XGBoost ensemble model."""
        
        config = self.config['models']['xgboost']
        
        if not config['enabled']:
            logger.info("XGBoost training disabled")
            return {}
        
        logger.info("Training XGBoost...")
        
        # Create training set
        dtrain = xgb.DMatrix(X_train, label=y_train)
        dval = xgb.DMatrix(X_val, label=y_val)
        
        # Setup early stopping
        evals = [(dtrain, 'train'), (dval, 'eval')]
        evals_result = {}
        
        # Train
        model = xgb.train(
            params={k: v for k, v in config['params'].items() if k != 'objective'},
            dtrain=dtrain,
            num_boost_round=config['params']['n_estimators'],
            evals=evals,
            evals_result=evals_result,
            early_stopping_rounds=10,
            verbose_eval=False,
        )
        
        # Evaluate
        y_proba = model.predict(dval)
        y_pred = (y_proba >= 0.5).astype(int)
        
        metrics = self._compute_metrics(y_val, y_pred, y_proba)
        
        logger.info(
            f"XGBoost: F1={metrics['f1']:.4f}, "
            f"AUC={metrics['auc_roc']:.4f}, Accuracy={metrics['accuracy']:.4f}"
        )
        
        self.models['xgboost'] = model
        self.metrics['xgboost'] = metrics
        
        return {
            'model': model,
            'metrics': metrics,
            'evals_result': evals_result,
        }
    
    def train_lightgbm(
        self,
        X_train: pd.DataFrame,
        y_train: pd.Series,
        X_val: pd.DataFrame,
        y_val: pd.Series,
    ) -> Dict[str, Any]:
        """Train LightGBM ensemble model."""
        
        config = self.config['models']['lightgbm']
        
        if not config['enabled']:
            logger.info("LightGBM training disabled")
            return {}
        
        logger.info("Training LightGBM...")
        
        # Train
        model = lgb.LGBMClassifier(**config['params'])
        model.fit(
            X_train, y_train,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.early_stopping(10)],
        )
        
        # Evaluate
        y_proba = model.predict_proba(X_val)[:, 1]
        y_pred = model.predict(X_val)
        
        metrics = self._compute_metrics(y_val, y_pred, y_proba)
        
        logger.info(
            f"LightGBM: F1={metrics['f1']:.4f}, "
            f"AUC={metrics['auc_roc']:.4f}, Accuracy={metrics['accuracy']:.4f}"
        )
        
        self.models['lightgbm'] = model
        self.metrics['lightgbm'] = metrics
        
        return {
            'model': model,
            'metrics': metrics,
        }
    
    def _compute_metrics(self, y_true: pd.Series, y_pred: np.ndarray, y_proba: np.ndarray) -> Dict[str, float]:
        """Compute classification metrics."""
        return {
            'accuracy': accuracy_score(y_true, y_pred),
            'precision': precision_score(y_true, y_pred, zero_division=0),
            'recall': recall_score(y_true, y_pred, zero_division=0),
            'f1': f1_score(y_true, y_pred, zero_division=0),
            'auc_roc': roc_auc_score(y_true, y_proba),
        }


def main():
    """Main training pipeline."""
    
    # Load configuration
    with open('./config.yaml', 'r') as f:
        config = yaml.safe_load(f)
    
    logger.info("Credit Risk Assessment Model Training Pipeline")
    logger.info(f"Start time: {datetime.now()}")
    
    # Create output directories
    Path(config['output']['models_dir']).mkdir(parents=True, exist_ok=True)
    Path(config['output']['artifacts_dir']).mkdir(parents=True, exist_ok=True)
    
    # Load data
    logger.info("Loading data...")
    loader = DataLoader()
    df = loader.load_datasets()
    
    # Assume last column is target (y)
    X = df.iloc[:, :-1]
    y = df.iloc[:, -1]
    
    logger.info(f"Data shape: X={X.shape}, y={y.shape}")
    logger.info(f"Class distribution: {y.value_counts().to_dict()}")
    
    # Split data
    logger.info("Splitting data...")
    X_train, X_temp, y_train, y_temp = train_test_split(
        X, y,
        test_size=(1.0 - config['data']['train_size']),
        random_state=config['random_state'],
        stratify=y,
    )
    
    val_ratio = config['data']['val_size'] / (config['data']['val_size'] + config['data']['test_size'])
    X_val, X_test, y_val, y_test = train_test_split(
        X_temp, y_temp,
        test_size=(1.0 - val_ratio),
        random_state=config['random_state'],
        stratify=y_temp,
    )
    
    logger.info(f"Train: {X_train.shape}, Val: {X_val.shape}, Test: {X_test.shape}")
    
    # Preprocess
    logger.info("Preprocessing...")
    preprocessor = DataPreprocessor(config)
    X_train, _ = preprocessor.fit_transform(X_train, y_train)
    X_val = preprocessor.transform(X_val)
    X_test = preprocessor.transform(X_test)
    
    # Train models
    logger.info("Training models...")
    trainer = ModelTrainer(config)
    
    # Baselines
    trainer.train_baseline_models(X_train, y_train, X_val, y_val)
    
    # Advanced
    trainer.train_xgboost(X_train, y_train, X_val, y_val)
    trainer.train_lightgbm(X_train, y_train, X_val, y_val)
    
    # Save models and metrics
    logger.info("Saving artifacts...")
    for model_name, model in trainer.models.items():
        filepath = Path(config['output']['models_dir']) / f"{model_name}.pkl"
        joblib.dump(model, filepath)
        logger.info(f"Saved {model_name} to {filepath}")
    
    # Save metrics summary
    metrics_summary = {
        model_name: {
            'metrics': metrics,
            'timestamp': datetime.now().isoformat(),
        }
        for model_name, metrics in trainer.metrics.items()
    }
    
    metrics_file = Path(config['output']['models_dir']) / "metrics.json"
    with open(metrics_file, 'w') as f:
        json.dump(metrics_summary, f, indent=2)
    logger.info(f"Saved metrics to {metrics_file}")
    
    logger.info("Training complete!")
    
    # Print summary
    print("\n" + "="*60)
    print("MODEL PERFORMANCE SUMMARY")
    print("="*60)
    for model_name, metrics in trainer.metrics.items():
        print(f"\n{model_name.upper()}:")
        print(f"  Accuracy: {metrics['accuracy']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall: {metrics['recall']:.4f}")
        print(f"  F1-Score: {metrics['f1']:.4f}")
        print(f"  AUC-ROC: {metrics['auc_roc']:.4f}")


if __name__ == "__main__":
    main()