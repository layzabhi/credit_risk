"""
Training Pipeline for Credit Risk Assessment Models
Implements the full workflow: preprocessing → baseline → advanced → ensemble → validation
Based on thesis design: "Utilizing AI for Improved Credit Risk Assessment" (Baglarbasi, 2025)
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Tuple

# Add backend to path for feature engineering import
sys.path.append(str(Path(__file__).resolve().parents[2] / "backend"))
from app.utils.feature_engineering import add_engineered_features

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
    precision_recall_curve,
)
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline
import xgboost as xgb
import lightgbm as lgb
import joblib
import pickle
import shap
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


def map_application_train(df: pd.DataFrame) -> pd.DataFrame:
    mapped = pd.DataFrame()
    
    # Demographics
    mapped["age"] = np.round(-df["DAYS_BIRTH"] / 365.25).fillna(35).astype(int)
    mapped["gender"] = df["CODE_GENDER"].map({"M": "Male", "F": "Female"}).fillna("Non-binary")
    
    edu_map = {
        "Secondary / secondary special": "High School",
        "Higher education": "Bachelor",
        "Incomplete higher": "High School",
        "Academic degree": "PhD",
        "Lower secondary": "High School"
    }
    mapped["education_level"] = df["NAME_EDUCATION_TYPE"].map(edu_map).fillna("High School")
    
    family_map = {
        "Married": "Married",
        "Single / not married": "Single",
        "Civil marriage": "Married",
        "Separated": "Divorced",
        "Widow": "Widowed"
    }
    mapped["marital_status"] = df["NAME_FAMILY_STATUS"].map(family_map).fillna("Single")
    
    # Financial
    mapped["income"] = df["AMT_INCOME_TOTAL"].fillna(50000)
    ext_src = df["EXT_SOURCE_2"].fillna(df["EXT_SOURCE_2"].mean()).fillna(0.5)
    mapped["credit_score"] = (300 + 550 * ext_src).astype(int)
    mapped["loan_amount"] = df["AMT_CREDIT"].fillna(20000)
    
    np.random.seed(42)
    mapped["loan_purpose"] = np.random.choice(
        ["Personal", "Auto", "Home", "Education", "Business"], size=len(df)
    )
    
    # Employment
    mapped["employment_status"] = df["DAYS_EMPLOYED"].apply(
        lambda x: "Unemployed" if x > 0 else "Employed"
    )
    mapped["years_at_current_job"] = df["DAYS_EMPLOYED"].apply(
        lambda x: max(0, int(round(-x / 365.25))) if x <= 0 else 0
    )
    
    # History
    targets = df["TARGET"].values
    histories = []
    for t in targets:
        if t == 1:
            histories.append(np.random.choice(["Poor", "Fair", "Good"], p=[0.65, 0.25, 0.10]))
        else:
            histories.append(np.random.choice(["Good", "Fair", "Poor"], p=[0.75, 0.20, 0.05]))
    mapped["payment_history"] = histories
    
    annuity = df["AMT_ANNUITY"].fillna(df["AMT_ANNUITY"].mean()).fillna(mapped["loan_amount"] * 0.1).fillna(2000)
    monthly_income = mapped["income"] / 12.0
    mapped["debt_to_income_ratio"] = (annuity / (monthly_income + 1.0)).clip(0.0, 1.0)
    
    real_estate = (df["FLAG_OWN_REALTY"] == "Y").astype(float)
    car = (df["FLAG_OWN_CAR"] == "Y").astype(float)
    mapped["assets_value"] = 140000 * real_estate + 25000 * car
    
    mapped["previous_defaults"] = df["DEF_30_CNT_SOCIAL_CIRCLE"].fillna(0).astype(int)
    mapped["number_of_dependents"] = df["CNT_CHILDREN"].fillna(0).astype(int)
    
    # Target (last column)
    mapped["default"] = df["TARGET"].fillna(0).astype(int)
    
    # Fill any remaining NaNs to guarantee a clean dataframe
    mapped["age"] = mapped["age"].fillna(35).astype(int)
    mapped["gender"] = mapped["gender"].fillna("Non-binary")
    mapped["education_level"] = mapped["education_level"].fillna("High School")
    mapped["marital_status"] = mapped["marital_status"].fillna("Single")
    mapped["income"] = mapped["income"].fillna(50000)
    mapped["credit_score"] = mapped["credit_score"].fillna(600).astype(int)
    mapped["loan_amount"] = mapped["loan_amount"].fillna(20000)
    mapped["loan_purpose"] = mapped["loan_purpose"].fillna("Personal")
    mapped["employment_status"] = mapped["employment_status"].fillna("Employed")
    mapped["years_at_current_job"] = mapped["years_at_current_job"].fillna(0).astype(int)
    mapped["payment_history"] = mapped["payment_history"].fillna("Good")
    mapped["debt_to_income_ratio"] = mapped["debt_to_income_ratio"].fillna(0.35)
    mapped["assets_value"] = mapped["assets_value"].fillna(0)
    mapped["previous_defaults"] = mapped["previous_defaults"].fillna(0).astype(int)
    mapped["number_of_dependents"] = mapped["number_of_dependents"].fillna(0).astype(int)
    mapped["default"] = mapped["default"].fillna(0).astype(int)
    
    return mapped


def map_cs_training(df: pd.DataFrame) -> pd.DataFrame:
    mapped = pd.DataFrame()
    
    # Demographics
    mapped["age"] = df["age"].fillna(45).astype(int)
    np.random.seed(42)
    mapped["gender"] = np.random.choice(["Male", "Female"], size=len(df))
    mapped["education_level"] = np.random.choice(
        ["High School", "Bachelor", "Master"], size=len(df), p=[0.5, 0.4, 0.1]
    )
    mapped["marital_status"] = np.random.choice(
        ["Single", "Married", "Divorced"], size=len(df), p=[0.3, 0.6, 0.1]
    )
    
    # Financial
    monthly_inc = df["MonthlyIncome"].fillna(df["MonthlyIncome"].median()).fillna(5000)
    mapped["income"] = monthly_inc * 12.0
    
    util = df["RevolvingUtilizationOfUnsecuredLines"].fillna(0.3)
    late_90 = df["NumberOfTimes90DaysLate"].fillna(0)
    late_30 = df["NumberOfTime30-59DaysPastDueNotWorse"].fillna(0)
    score = 750 - (util * 100) - (late_90 * 80) - (late_30 * 30)
    mapped["credit_score"] = score.clip(300, 850).astype(int)
    mapped["loan_amount"] = (mapped["income"] * 0.3).clip(5000, 100000)
    mapped["loan_purpose"] = np.random.choice(
        ["Personal", "Auto", "Home", "Education", "Business"], size=len(df)
    )
    
    # Employment
    mapped["employment_status"] = mapped["income"].apply(
        lambda x: "Employed" if x > 0 else "Unemployed"
    )
    mapped["years_at_current_job"] = np.random.randint(1, 15, size=len(df))
    
    # History
    histories = []
    # Vectorized checks for speed
    l90 = df["NumberOfTimes90DaysLate"].fillna(0).values
    l30 = df["NumberOfTime30-59DaysPastDueNotWorse"].fillna(0).values
    for i in range(len(df)):
        if l90[i] > 0:
            histories.append("Poor")
        elif l30[i] > 0:
            histories.append("Fair")
        else:
            histories.append("Good")
    mapped["payment_history"] = histories
    
    mapped["debt_to_income_ratio"] = df["DebtRatio"].fillna(0.35).clip(0.0, 1.0)
    re_loans = df["NumberRealEstateLoansOrLines"].fillna(0)
    mapped["assets_value"] = re_loans * 150000
    mapped["previous_defaults"] = late_90.astype(int)
    mapped["number_of_dependents"] = df["NumberOfDependents"].fillna(0).astype(int)
    
    # Target (last column)
    mapped["default"] = df["SeriousDlqin2yrs"].fillna(0).astype(int)
    
    # Fill any remaining NaNs to guarantee a clean dataframe
    mapped["age"] = mapped["age"].fillna(45).astype(int)
    mapped["gender"] = mapped["gender"].fillna("Non-binary")
    mapped["education_level"] = mapped["education_level"].fillna("High School")
    mapped["marital_status"] = mapped["marital_status"].fillna("Single")
    mapped["income"] = mapped["income"].fillna(50000)
    mapped["credit_score"] = mapped["credit_score"].fillna(600).astype(int)
    mapped["loan_amount"] = mapped["loan_amount"].fillna(20000)
    mapped["loan_purpose"] = mapped["loan_purpose"].fillna("Personal")
    mapped["employment_status"] = mapped["employment_status"].fillna("Employed")
    mapped["years_at_current_job"] = mapped["years_at_current_job"].fillna(0).astype(int)
    mapped["payment_history"] = mapped["payment_history"].fillna("Good")
    mapped["debt_to_income_ratio"] = mapped["debt_to_income_ratio"].fillna(0.35)
    mapped["assets_value"] = mapped["assets_value"].fillna(0)
    mapped["previous_defaults"] = mapped["previous_defaults"].fillna(0).astype(int)
    mapped["number_of_dependents"] = mapped["number_of_dependents"].fillna(0).astype(int)
    mapped["default"] = mapped["default"].fillna(0).astype(int)
    
    return mapped


def map_german_credit(df: pd.DataFrame) -> pd.DataFrame:
    mapped = pd.DataFrame()
    
    # Demographics
    mapped["age"] = df["Age"].fillna(35).astype(int)
    mapped["gender"] = df["Sex"].map({"male": "Male", "female": "Female"}).fillna("Male")
    
    edu_map = {3: "PhD", 2: "Bachelor", 1: "High School", 0: "High School"}
    mapped["education_level"] = df["Job"].map(edu_map).fillna("High School")
    np.random.seed(42)
    mapped["marital_status"] = np.random.choice(
        ["Single", "Married", "Divorced"], size=len(df), p=[0.4, 0.5, 0.1]
    )
    
    # Financial
    income_map = {3: 80000, 2: 50000, 1: 30000, 0: 15000}
    mapped["income"] = df["Job"].map(income_map).fillna(40000)
    
    checking_map = {"little": 550, "moderate": 650, "rich": 750}
    score = df["Checking account"].map(checking_map).fillna(700)
    mapped["credit_score"] = score.astype(int)
    mapped["loan_amount"] = df["Credit amount"].fillna(3000)
    
    purpose_map = {
        "radio/TV": "Personal",
        "education": "Education",
        "furniture/equipment": "Home",
        "car": "Auto",
        "business": "Business",
        "domestic appliances": "Personal",
        "repairs": "Personal",
        "vacation/others": "Personal"
    }
    mapped["loan_purpose"] = df["Purpose"].map(purpose_map).fillna("Personal")
    
    # Employment
    mapped["employment_status"] = df["Job"].apply(
        lambda x: "Unemployed" if x == 0 else "Employed"
    )
    mapped["years_at_current_job"] = df["Job"].map({3: 8, 2: 5, 1: 3, 0: 0}).fillna(3)
    
    # History
    mapped["payment_history"] = df["Checking account"].map(
        {"little": "Poor", "moderate": "Fair", "rich": "Good"}
    ).fillna("Good")
    mapped["debt_to_income_ratio"] = (df["Credit amount"] / (mapped["income"] + 1.0)).clip(0.0, 1.0)
    mapped["assets_value"] = df["Housing"].map({"own": 100000, "rent": 10000, "free": 20000}).fillna(20000)
    mapped["previous_defaults"] = df["Checking account"].apply(lambda x: 1 if x == "little" else 0)
    mapped["number_of_dependents"] = np.random.choice([0, 1, 2], size=len(df), p=[0.7, 0.2, 0.1])
    
    # Target (last column)
    if "Risk" in df.columns:
        mapped["default"] = df["Risk"].map({"good": 0, "bad": 1}).fillna(0).astype(int)
    else:
        default_prob = []
        for idx, row in df.iterrows():
            prob = 0.15
            if row.get("Saving accounts") == "little":
                prob += 0.15
            if row.get("Checking account") == "little":
                prob += 0.15
            if row.get("Credit amount", 0) > 5000:
                prob += 0.15
            default_prob.append(np.random.choice([0, 1], p=[1 - min(0.9, prob), min(0.9, prob)]))
        mapped["default"] = default_prob
        
    return mapped


class DataLoader:
    """Load and merge datasets from multiple sources."""
    
    def __init__(self, data_dir: str = "./data/raw"):
        self.data_dir = Path(data_dir)
    
    def load_datasets(self) -> pd.DataFrame:
        """Load, standardize, and concatenate all available datasets."""
        dfs = []
        
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
                    
                    if filename == "application_train.csv":
                        df_mapped = map_application_train(df)
                    elif filename == "cs-training.csv":
                        df_mapped = map_cs_training(df)
                    elif filename == "german_credit_data.csv":
                        df_mapped = map_german_credit(df)
                        
                    logger.info(f"Mapped {filename} to Credit Risk schema - shape: {df_mapped.shape}")
                    dfs.append(df_mapped)
                except Exception as e:
                    logger.warning(f"Failed to load/map {filename}: {e}")
        
        if not dfs:
            raise FileNotFoundError(f"No datasets found in {self.data_dir}")
        
        merged = pd.concat(dfs, ignore_index=True)
        logger.info(f"Merged dataset: {len(merged)} rows total")
        
        return merged


class DataPreprocessor:
    """Data preprocessing pipeline."""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.scaler = None
        self.encoders = {}
        self.ohe = None
        self.ohe_cols = None
    
    def fit_transform(self, X: pd.DataFrame, y: pd.Series = None) -> Tuple[pd.DataFrame, pd.Series]:
        """Fit preprocessor and transform data."""
        
        # 1. Handle missing values
        X = self._handle_missing_values(X)
        if y is not None:
            y = y.loc[X.index]
        
        # 2. Detect and handle outliers
        X = self._handle_outliers(X)
        if y is not None:
            y = y.loc[X.index]
        
        # 3. Encode categorical variables
        X = self._encode_categorical(X, fit=True)
        
        # 3.5. Feature engineering
        X = add_engineered_features(X)
        
        # 4. Normalize/Standardize numerical features
        X = self._scale_features(X, fit=True)
        
        logger.info(f"Preprocessing complete: {X.shape}")
        
        return X, y
    
    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        """Transform data using fitted preprocessor."""
        X = self._handle_missing_values(X)
        X = self._encode_categorical(X, fit=False)
        X = add_engineered_features(X)
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
            X = X.fillna(X.mean(numeric_only=True) if method == 'mean' else X.median(numeric_only=True))
            logger.info(f"Imputed missing values using {method}")
        
        return X
    
    def _handle_outliers(self, X: pd.DataFrame) -> pd.DataFrame:
        """Handle outliers using IQR method"""
        if not self.config['data']['outliers']['enabled']:
            return X
        
        numeric_cols = X.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) == 0:
            return X
        
        Q1 = X[numeric_cols].quantile(0.25)
        Q3 = X[numeric_cols].quantile(0.75)
        IQR = Q3 - Q1
        threshold = self.config['data']['outliers']['threshold']
        
        # Create outlier mask
        outlier_mask = ((X[numeric_cols] < (Q1 - threshold * IQR)) | (X[numeric_cols] > (Q3 + threshold * IQR))).any(axis=1)
        outliers_count = outlier_mask.sum()
        
        logger.info(f"Detected {outliers_count} outliers, removing...")
        
        # Remove outliers
        X_cleaned = X[~outlier_mask]
        
        logger.info(f"Removed {outliers_count} rows, remaining: {len(X_cleaned)}")
        
        return X_cleaned
    
    def _encode_categorical(self, X: pd.DataFrame, fit: bool = False) -> pd.DataFrame:
        """Encode categorical variables: ordinal for hierarchy, one-hot for nominal."""
        X = X.copy()
        
        # 1. Ordinal mapping
        history_map = {"Poor": 0, "Fair": 1, "Good": 2}
        edu_map = {"High School": 0, "Bachelor": 1, "Master": 2, "PhD": 3}
        
        if "payment_history" in X.columns:
            X["payment_history"] = X["payment_history"].map(history_map).fillna(2)
        if "education_level" in X.columns:
            X["education_level"] = X["education_level"].map(edu_map).fillna(0)
            
        # 2. Binary mapping
        if "gender" in X.columns:
            X["gender"] = X["gender"].map({"Male": 1, "Female": 0}).fillna(0)
        if "employment_status" in X.columns:
            X["employment_status"] = X["employment_status"].map({"Employed": 1, "Unemployed": 0}).fillna(1)
            
        # 3. Nominal columns to one-hot encode
        nominal_cols = [col for col in ["marital_status", "loan_purpose"] if col in X.columns]
        
        if fit:
            from sklearn.preprocessing import OneHotEncoder
            self.ohe = OneHotEncoder(sparse_output=False, handle_unknown='ignore', drop='first')
            if nominal_cols:
                ohe_data = self.ohe.fit_transform(X[nominal_cols])
                self.ohe_cols = self.ohe.get_feature_names_out(nominal_cols)
                ohe_df = pd.DataFrame(ohe_data, columns=self.ohe_cols, index=X.index)
                X = pd.concat([X.drop(columns=nominal_cols), ohe_df], axis=1)
        else:
            if self.ohe is not None and nominal_cols:
                ohe_data = self.ohe.transform(X[nominal_cols])
                ohe_df = pd.DataFrame(ohe_data, columns=self.ohe_cols, index=X.index)
                X = pd.concat([X.drop(columns=nominal_cols), ohe_df], axis=1)
                
        # Ensure all bool columns are converted to int
        bool_cols = X.select_dtypes(include=['bool']).columns
        X[bool_cols] = X[bool_cols].astype(int)
        
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
        
        # Prepare training data with SMOTE if enabled (only for final fit)
        X_train_fit, y_train_fit = X_train, y_train
        if self.config.get('training', {}).get('smote', {}).get('enabled', False):
            smote_cfg = self.config['training']['smote']
            logger.info("Applying SMOTE to training data for final model fit...")
            smote = SMOTE(
                sampling_strategy=smote_cfg.get('sampling_strategy', 0.5),
                random_state=smote_cfg.get('random_state', 42)
            )
            X_train_fit, y_train_fit = smote.fit_resample(X_train, y_train)
            logger.info(f"Final training set shape after SMOTE: X={X_train_fit.shape}, y={y_train_fit.shape}")
        
        # Logistic Regression
        if baselines['logistic_regression']['enabled']:
            logger.info("Training Logistic Regression...")
            lr = LogisticRegression(**baselines['logistic_regression']['params'])
            
            # Run Cross-Validation
            cv_metrics = self.train_with_cross_validation(X_train, y_train, lr)
            logger.info(
                f"Logistic Regression CV: Accuracy={cv_metrics['accuracy']:.4f}, "
                f"Precision={cv_metrics['precision']:.4f}, Recall={cv_metrics['recall']:.4f}, "
                f"F1={cv_metrics['f1']:.4f}, AUC={cv_metrics['auc_roc']:.4f}"
            )
            
            lr.fit(X_train_fit, y_train_fit)
            
            y_proba = lr.predict_proba(X_val)[:, 1]
            
            # Threshold optimization
            threshold = 0.5
            if self.config.get('metrics', {}).get('threshold_optimization', {}).get('enabled', False):
                min_recall = self.config['metrics']['threshold_optimization'].get('min_recall', 0.80)
                opt_metrics = self.compute_optimal_metrics(y_val, y_proba, min_recall=min_recall)
                if opt_metrics is not None:
                    threshold = opt_metrics['threshold']
            
            y_pred = (y_proba >= threshold).astype(int)
            metrics = self._compute_metrics(y_val, y_pred, y_proba)
            metrics['optimal_threshold'] = threshold
            
            results['logistic_regression'] = {
                'model': lr,
                'metrics': metrics,
            }
        
        # Decision Tree
        if baselines['decision_tree']['enabled']:
            logger.info("Training Decision Tree...")
            dt = DecisionTreeClassifier(**baselines['decision_tree']['params'])
            
            # Run Cross-Validation
            cv_metrics = self.train_with_cross_validation(X_train, y_train, dt)
            logger.info(
                f"Decision Tree CV: Accuracy={cv_metrics['accuracy']:.4f}, "
                f"Precision={cv_metrics['precision']:.4f}, Recall={cv_metrics['recall']:.4f}, "
                f"F1={cv_metrics['f1']:.4f}, AUC={cv_metrics['auc_roc']:.4f}"
            )
            
            dt.fit(X_train_fit, y_train_fit)
            
            y_proba = dt.predict_proba(X_val)[:, 1]
            
            # Threshold optimization
            threshold = 0.5
            if self.config.get('metrics', {}).get('threshold_optimization', {}).get('enabled', False):
                min_recall = self.config['metrics']['threshold_optimization'].get('min_recall', 0.80)
                opt_metrics = self.compute_optimal_metrics(y_val, y_proba, min_recall=min_recall)
                if opt_metrics is not None:
                    threshold = opt_metrics['threshold']
            
            y_pred = (y_proba >= threshold).astype(int)
            metrics = self._compute_metrics(y_val, y_pred, y_proba)
            metrics['optimal_threshold'] = threshold
            
            results['decision_tree'] = {
                'model': dt,
                'metrics': metrics,
            }
        
        # Random Forest
        if baselines['random_forest']['enabled']:
            logger.info("Training Random Forest...")
            rf = RandomForestClassifier(**baselines['random_forest']['params'])
            
            # Run Cross-Validation
            cv_metrics = self.train_with_cross_validation(X_train, y_train, rf)
            logger.info(
                f"Random Forest CV: Accuracy={cv_metrics['accuracy']:.4f}, "
                f"Precision={cv_metrics['precision']:.4f}, Recall={cv_metrics['recall']:.4f}, "
                f"F1={cv_metrics['f1']:.4f}, AUC={cv_metrics['auc_roc']:.4f}"
            )
            
            rf.fit(X_train_fit, y_train_fit)
            
            y_proba = rf.predict_proba(X_val)[:, 1]
            
            # Threshold optimization
            threshold = 0.5
            if self.config.get('metrics', {}).get('threshold_optimization', {}).get('enabled', False):
                min_recall = self.config['metrics']['threshold_optimization'].get('min_recall', 0.80)
                opt_metrics = self.compute_optimal_metrics(y_val, y_proba, min_recall=min_recall)
                if opt_metrics is not None:
                    threshold = opt_metrics['threshold']
            
            y_pred = (y_proba >= threshold).astype(int)
            metrics = self._compute_metrics(y_val, y_pred, y_proba)
            metrics['optimal_threshold'] = threshold
            
            results['random_forest'] = {
                'model': rf,
                'metrics': metrics,
            }
        
        # Log results
        for model_name, result in results.items():
            metrics = result['metrics']
            logger.info(
                f"{model_name}: F1={metrics['f1']:.4f}, "
                f"AUC={metrics['auc_roc']:.4f}, Accuracy={metrics['accuracy']:.4f}, "
                f"Thresh={metrics.get('optimal_threshold', 0.5):.4f}"
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
        
        # Use scale_pos_weight from config if defined, otherwise calculate dynamically
        scale_pos_weight = config['params'].get('scale_pos_weight', (len(y_train) - sum(y_train)) / sum(y_train))
        
        # Setup XGBClassifier for CV
        xgb_cv_params = {k: v for k, v in config['params'].items() if k not in ['n_estimators', 'objective', 'eval_metric', 'verbose', 'scale_pos_weight', 'random_state', 'n_jobs']}
        xgb_clf = xgb.XGBClassifier(
            **xgb_cv_params,
            n_estimators=config['params'].get('n_estimators', 200),
            objective=config['params'].get('objective', 'binary:logistic'),
            scale_pos_weight=scale_pos_weight,
            eval_metric='logloss',
            random_state=config['params'].get('random_state', 42),
            n_jobs=-1
        )
        
        # Run Cross-Validation
        cv_metrics = self.train_with_cross_validation(X_train, y_train, xgb_clf)
        logger.info(
            f"XGBoost CV: Accuracy={cv_metrics['accuracy']:.4f}, "
            f"Precision={cv_metrics['precision']:.4f}, Recall={cv_metrics['recall']:.4f}, "
            f"F1={cv_metrics['f1']:.4f}, AUC={cv_metrics['auc_roc']:.4f}"
        )
        
        # Prepare training data with SMOTE if enabled (only for final fit)
        X_train_fit, y_train_fit = X_train, y_train
        if self.config.get('training', {}).get('smote', {}).get('enabled', False):
            smote_cfg = self.config['training']['smote']
            logger.info("Applying SMOTE to training data for final model fit...")
            smote = SMOTE(
                sampling_strategy=smote_cfg.get('sampling_strategy', 0.5),
                random_state=smote_cfg.get('random_state', 42)
            )
            X_train_fit, y_train_fit = smote.fit_resample(X_train, y_train)
            logger.info(f"Final training set shape after SMOTE: X={X_train_fit.shape}, y={y_train_fit.shape}")
        
        # Create final training set
        dtrain = xgb.DMatrix(X_train_fit, label=y_train_fit)
        dval = xgb.DMatrix(X_val, label=y_val)
        
        # Setup early stopping
        evals = [(dtrain, 'train'), (dval, 'eval')]
        evals_result = {}
        
        # Set up params, applying scale_pos_weight from config if defined, otherwise calculate dynamically
        params = {k: v for k, v in config['params'].items() if k != 'objective'}
        if 'scale_pos_weight' not in params:
            params['scale_pos_weight'] = (len(y_train_fit) - sum(y_train_fit)) / sum(y_train_fit)
        params['objective'] = config['params'].get('objective', 'binary:logistic')
        
        # Train
        model = xgb.train(
            params=params,
            dtrain=dtrain,
            num_boost_round=config['params']['n_estimators'],
            evals=evals,
            evals_result=evals_result,
            early_stopping_rounds=10,
            verbose_eval=False,
        )
        
        # Evaluate
        y_proba = model.predict(dval)
        
        # Threshold optimization
        threshold = 0.5
        if self.config.get('metrics', {}).get('threshold_optimization', {}).get('enabled', False):
            min_recall = self.config['metrics']['threshold_optimization'].get('min_recall', 0.80)
            opt_metrics = self.compute_optimal_metrics(y_val, y_proba, min_recall=min_recall)
            if opt_metrics is not None:
                threshold = opt_metrics['threshold']
                
        y_pred = (y_proba >= threshold).astype(int)
        metrics = self._compute_metrics(y_val, y_pred, y_proba)
        metrics['optimal_threshold'] = threshold
        
        logger.info(
            f"XGBoost: F1={metrics['f1']:.4f}, "
            f"AUC={metrics['auc_roc']:.4f}, Accuracy={metrics['accuracy']:.4f}, "
            f"Thresh={metrics.get('optimal_threshold', 0.5):.4f}"
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
        
        # Set up base model for CV
        model = lgb.LGBMClassifier(**config['params'])
        
        # Run Cross-Validation
        cv_metrics = self.train_with_cross_validation(X_train, y_train, model)
        logger.info(
            f"LightGBM CV: Accuracy={cv_metrics['accuracy']:.4f}, "
            f"Precision={cv_metrics['precision']:.4f}, Recall={cv_metrics['recall']:.4f}, "
            f"F1={cv_metrics['f1']:.4f}, AUC={cv_metrics['auc_roc']:.4f}"
        )
        
        # Prepare training data with SMOTE if enabled (only for final fit)
        X_train_fit, y_train_fit = X_train, y_train
        if self.config.get('training', {}).get('smote', {}).get('enabled', False):
            smote_cfg = self.config['training']['smote']
            logger.info("Applying SMOTE to training data for final model fit...")
            smote = SMOTE(
                sampling_strategy=smote_cfg.get('sampling_strategy', 0.5),
                random_state=smote_cfg.get('random_state', 42)
            )
            X_train_fit, y_train_fit = smote.fit_resample(X_train, y_train)
            logger.info(f"Final training set shape after SMOTE: X={X_train_fit.shape}, y={y_train_fit.shape}")
        
        # Fit final model
        model.fit(
            X_train_fit, y_train_fit,
            eval_set=[(X_val, y_val)],
            callbacks=[lgb.early_stopping(10)],
        )
        
        # Evaluate
        y_proba = model.predict_proba(X_val)[:, 1]
        
        # Threshold optimization
        threshold = 0.5
        if self.config.get('metrics', {}).get('threshold_optimization', {}).get('enabled', False):
            min_recall = self.config['metrics']['threshold_optimization'].get('min_recall', 0.80)
            opt_metrics = self.compute_optimal_metrics(y_val, y_proba, min_recall=min_recall)
            if opt_metrics is not None:
                threshold = opt_metrics['threshold']
                
        y_pred = (y_proba >= threshold).astype(int)
        metrics = self._compute_metrics(y_val, y_pred, y_proba)
        metrics['optimal_threshold'] = threshold
        
        logger.info(
            f"LightGBM: F1={metrics['f1']:.4f}, "
            f"AUC={metrics['auc_roc']:.4f}, Accuracy={metrics['accuracy']:.4f}, "
            f"Thresh={metrics.get('optimal_threshold', 0.5):.4f}"
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
    
    def compute_optimal_metrics(self, y_true: pd.Series, y_pred_proba: np.ndarray, min_recall: float = 0.80) -> Dict[str, float]:
        """Compute metrics using optimal decision threshold for target recall."""
        precision, recall, thresholds = precision_recall_curve(y_true, y_pred_proba)
        
        # recall is decreasing, precision is increasing
        # Find index where recall >= min_recall
        valid_idx = np.where(recall[:-1] >= min_recall)[0]
        if len(valid_idx) == 0:
            idx = np.argmax(recall[:-1])
        else:
            idx = valid_idx[-1]
            
        optimal_threshold = thresholds[idx]
        optimal_precision = precision[idx]
        optimal_recall = recall[idx]
        
        f1 = 0.0
        if (optimal_precision + optimal_recall) > 0:
            f1 = 2 * (optimal_precision * optimal_recall) / (optimal_precision + optimal_recall)
            
        return {
            'threshold': float(optimal_threshold),
            'precision': float(optimal_precision),
            'recall': float(optimal_recall),
            'f1': float(f1)
        }

    def train_with_cross_validation(self, X_train: pd.DataFrame, y_train: pd.Series, model: Any, cv: int = 5) -> Dict[str, float]:
        """Train model with Stratified K-Fold cross-validation, applying SMOTE on training folds if enabled."""
        from sklearn.model_selection import StratifiedKFold, cross_validate
        
        scoring = {
            'accuracy': 'accuracy',
            'precision': 'precision',
            'recall': 'recall',
            'f1': 'f1',
            'roc_auc': 'roc_auc'
        }
        
        # Ensure Stratified K-Fold
        skf = StratifiedKFold(n_splits=cv, shuffle=True, random_state=self.config.get('random_state', 42))
        
        # Build pipeline with SMOTE if enabled
        if self.config.get('training', {}).get('smote', {}).get('enabled', False):
            smote_cfg = self.config['training']['smote']
            smote = SMOTE(
                sampling_strategy=smote_cfg.get('sampling_strategy', 0.5),
                random_state=smote_cfg.get('random_state', 42)
            )
            # ImbPipeline applies SMOTE only to the fit step (training folds), not validation folds
            estimator = ImbPipeline([
                ('smote', smote),
                ('model', model)
            ])
        else:
            estimator = model
            
        cv_results = cross_validate(
            estimator, X_train, y_train,
            cv=skf,
            scoring=scoring,
            return_train_score=True,
            n_jobs=-1
        )
        
        return {
            'accuracy': cv_results['test_accuracy'].mean(),
            'precision': cv_results['test_precision'].mean(),
            'recall': cv_results['test_recall'].mean(),
            'f1': cv_results['test_f1'].mean(),
            'auc_roc': cv_results['test_roc_auc'].mean(),
        }


def run_shap_explainability(model, X_sample: pd.DataFrame, output_dir: Path):
    """Generate SHAP feature importance and decision example plots."""
    logger.info("Running SHAP explainability analysis...")
    try:
        # Use TreeExplainer
        explainer = shap.TreeExplainer(model)
        
        # Calculate SHAP values
        logger.info(f"Computing SHAP values on sample of size {len(X_sample)}...")
        shap_values = explainer(X_sample)
        
        # 1. Feature Importance Summary Plot
        plt.figure(figsize=(10, 6))
        shap.summary_plot(shap_values, X_sample, show=False)
        importance_path = output_dir / "shap_feature_importance.png"
        plt.tight_layout()
        plt.savefig(importance_path, dpi=300)
        plt.close()
        logger.info(f"Saved SHAP feature importance plot to {importance_path}")
        
        # 2. Individual Decision Examples (Waterfall Plot)
        # We will save waterfall plots for the first 3 samples
        for i in range(min(3, len(X_sample))):
            plt.figure(figsize=(10, 5))
            shap.plots.waterfall(shap_values[i], show=False)
            waterfall_path = output_dir / f"shap_decision_example_{i}.png"
            plt.tight_layout()
            plt.savefig(waterfall_path, dpi=300)
            plt.close()
            logger.info(f"Saved SHAP decision example plot to {waterfall_path}")
            
    except Exception as e:
        logger.warning(f"Failed to generate SHAP explainability plots: {e}", exc_info=True)


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
    
    # Select target and features by column names
    X = df.drop(columns=["default"])
    y = df["default"]
    
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
    X_train, y_train = preprocessor.fit_transform(X_train, y_train)
    X_val = preprocessor.transform(X_val)
    y_val = y_val.loc[X_val.index]
    X_test = preprocessor.transform(X_test)
    y_test = y_test.loc[X_test.index]
    
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
        
    if config['output'].get('save_preprocessing', True):
        preprocessor_filepath = Path(config['output']['models_dir']) / "preprocessor.pkl"
        joblib.dump(preprocessor, preprocessor_filepath)
        logger.info(f"Saved preprocessor to {preprocessor_filepath}")
    
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
    
    # Run SHAP Explainability on the best model (XGBoost)
    if config.get('shap', {}).get('enabled', False):
        xgb_model = trainer.models.get('xgboost')
        if xgb_model is not None:
            shap_sample_size = min(100, len(X_val))
            X_shap_sample = X_val.sample(shap_sample_size, random_state=42)
            run_shap_explainability(
                xgb_model, 
                X_shap_sample, 
                Path(config['output']['artifacts_dir'])
            )
            
    logger.info("Training complete!")
    
    # Print summary
    print("\n" + "="*60)
    print("MODEL PERFORMANCE SUMMARY")
    print("="*60)
    for model_name, metrics in trainer.metrics.items():
        print(f"\n{model_name.upper()}:")
        if 'optimal_threshold' in metrics:
            print(f"  Optimal Threshold: {metrics['optimal_threshold']:.4f}")
        print(f"  Accuracy: {metrics['accuracy']:.4f}")
        print(f"  Precision: {metrics['precision']:.4f}")
        print(f"  Recall: {metrics['recall']:.4f}")
        print(f"  F1-Score: {metrics['f1']:.4f}")
        print(f"  AUC-ROC: {metrics['auc_roc']:.4f}")


if __name__ == "__main__":
    main()