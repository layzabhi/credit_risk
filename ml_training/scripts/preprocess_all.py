"""
Preprocesses the raw Kaggle/UCI data, maps columns to our schema,
and saves the train/val/test splits to processed/ directory.
"""

import os
import sys
import pandas as pd
import numpy as np
import joblib
from pathlib import Path

# Add backend directory to path so we can import the preprocessor
sys.path.append(str(Path(__file__).resolve().parents[2] / "backend"))

from app.services.preprocessor import DataPreprocessor

def main():
    raw_path = Path("c:/All Projects/credit_risk_project/ml_training/data/raw/application_train.csv")
    processed_dir = Path("c:/All Projects/credit_risk_project/ml_training/data/processed")
    processed_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Loading raw dataset from {raw_path}...")
    # Read a sample of 25,000 rows to ensure fast and responsive training in sandbox
    df_raw = pd.read_csv(raw_path, nrows=25000)
    print(f"Loaded {len(df_raw)} rows.")
    
    print("Mapping columns to Credit Risk API schema...")
    df_mapped = pd.DataFrame()
    
    # Demographics
    df_mapped["age"] = np.round(-df_raw["DAYS_BIRTH"] / 365.25).fillna(35).astype(int)
    df_mapped["gender"] = df_raw["CODE_GENDER"].map({"M": "Male", "F": "Female"}).fillna("Non-binary")
    
    edu_map = {
        "Secondary / secondary special": "High School",
        "Higher education": "Bachelor",
        "Incomplete higher": "High School",
        "Academic degree": "PhD",
        "Lower secondary": "High School"
    }
    df_mapped["education_level"] = df_raw["NAME_EDUCATION_TYPE"].map(edu_map).fillna("High School")
    
    family_map = {
        "Married": "Married",
        "Single / not married": "Single",
        "Civil marriage": "Married",
        "Separated": "Divorced",
        "Widow": "Widowed"
    }
    df_mapped["marital_status"] = df_raw["NAME_FAMILY_STATUS"].map(family_map).fillna("Single")
    
    # Financial
    df_mapped["income"] = df_raw["AMT_INCOME_TOTAL"].fillna(50000)
    ext_src = df_raw["EXT_SOURCE_2"].fillna(df_raw["EXT_SOURCE_2"].mean()).fillna(0.5)
    df_mapped["credit_score"] = (300 + 550 * ext_src).astype(int)
    df_mapped["loan_amount"] = df_raw["AMT_CREDIT"].fillna(20000)
    
    np.random.seed(42)
    df_mapped["loan_purpose"] = np.random.choice(
        ["Personal", "Auto", "Home", "Education", "Business"], size=len(df_raw)
    )
    
    # Employment
    df_mapped["employment_status"] = df_raw["DAYS_EMPLOYED"].apply(
        lambda x: "Unemployed" if x > 0 else "Employed"
    ).fillna("Employed")
    df_mapped["years_at_current_job"] = df_raw["DAYS_EMPLOYED"].apply(
        lambda x: max(0, int(round(-x / 365.25))) if x <= 0 else 0
    ).fillna(0).astype(int)
    
    # History
    targets = df_raw["TARGET"].fillna(0).values
    histories = []
    for t in targets:
        if t == 1:
            histories.append(np.random.choice(["Poor", "Fair", "Good"], p=[0.65, 0.25, 0.10]))
        else:
            histories.append(np.random.choice(["Good", "Fair", "Poor"], p=[0.75, 0.20, 0.05]))
    df_mapped["payment_history"] = histories
    
    annuity = df_raw["AMT_ANNUITY"].fillna(df_raw["AMT_ANNUITY"].mean()).fillna(df_mapped["loan_amount"] * 0.1).fillna(2000)
    monthly_income = df_mapped["income"] / 12.0
    df_mapped["debt_to_income_ratio"] = (annuity / (monthly_income + 1.0)).clip(0.0, 1.0)
    
    real_estate = (df_raw["FLAG_OWN_REALTY"] == "Y").astype(float)
    car = (df_raw["FLAG_OWN_CAR"] == "Y").astype(float)
    df_mapped["assets_value"] = 140000 * real_estate + 25000 * car
    
    df_mapped["previous_defaults"] = df_raw["DEF_30_CNT_SOCIAL_CIRCLE"].fillna(0).astype(int)
    df_mapped["number_of_dependents"] = df_raw["CNT_CHILDREN"].fillna(0).astype(int)
    
    # Target
    df_mapped["default"] = df_raw["TARGET"].fillna(0).astype(int)
    
    # Fill any remaining NaNs to guarantee a clean dataframe
    df_mapped["age"] = df_mapped["age"].fillna(35).astype(int)
    df_mapped["gender"] = df_mapped["gender"].fillna("Non-binary")
    df_mapped["education_level"] = df_mapped["education_level"].fillna("High School")
    df_mapped["marital_status"] = df_mapped["marital_status"].fillna("Single")
    df_mapped["income"] = df_mapped["income"].fillna(50000)
    df_mapped["credit_score"] = df_mapped["credit_score"].fillna(600).astype(int)
    df_mapped["loan_amount"] = df_mapped["loan_amount"].fillna(20000)
    df_mapped["loan_purpose"] = df_mapped["loan_purpose"].fillna("Personal")
    df_mapped["employment_status"] = df_mapped["employment_status"].fillna("Employed")
    df_mapped["years_at_current_job"] = df_mapped["years_at_current_job"].fillna(0).astype(int)
    df_mapped["payment_history"] = df_mapped["payment_history"].fillna("Good")
    df_mapped["debt_to_income_ratio"] = df_mapped["debt_to_income_ratio"].fillna(0.35)
    df_mapped["assets_value"] = df_mapped["assets_value"].fillna(0)
    df_mapped["previous_defaults"] = df_mapped["previous_defaults"].fillna(0).astype(int)
    df_mapped["number_of_dependents"] = df_mapped["number_of_dependents"].fillna(0).astype(int)
    df_mapped["default"] = df_mapped["default"].fillna(0).astype(int)
    
    print("Fitting DataPreprocessor on mapped dataset...")
    # Extract features X and target y
    X = df_mapped.drop(columns=["default"])
    y = df_mapped["default"]
    
    preprocessor = DataPreprocessor()
    X_trans = preprocessor.fit_transform(X, y)
    
    # Split datasets
    print("Splitting dataset into train/val/test splits...")
    np.random.seed(42)
    indices = np.random.permutation(len(df_mapped))
    
    train_end = int(0.70 * len(df_mapped))
    val_end = int(0.85 * len(df_mapped))
    
    train_idx = indices[:train_end]
    val_idx = indices[train_end:val_end]
    test_idx = indices[val_end:]
    
    # Save target mapping separately or keep target in split files
    # Let's save processed splits with targets included as the first column
    train_df = X_trans.iloc[train_idx].copy()
    train_df.insert(0, "default", y.iloc[train_idx].values)
    
    val_df = X_trans.iloc[val_idx].copy()
    val_df.insert(0, "default", y.iloc[val_idx].values)
    
    test_df = X_trans.iloc[test_idx].copy()
    test_df.insert(0, "default", y.iloc[test_idx].values)
    
    train_df.to_csv(processed_dir / "train.csv", index=False)
    val_df.to_csv(processed_dir / "val.csv", index=False)
    test_df.to_csv(processed_dir / "test.csv", index=False)
    
    # Save the original un-preprocessed mapped split files for explanations testing
    X.iloc[train_idx].to_csv(processed_dir / "train_raw.csv", index=False)
    X.iloc[val_idx].to_csv(processed_dir / "val_raw.csv", index=False)
    X.iloc[test_idx].to_csv(processed_dir / "test_raw.csv", index=False)
    
    # Save preprocessor artifact
    joblib.dump(preprocessor, processed_dir / "preprocessor.pkl")
    print(f"Saved processed datasets and fitted preprocessor to: {processed_dir}")

if __name__ == "__main__":
    main()
