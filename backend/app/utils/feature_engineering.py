"""
Feature engineering helpers for Credit Risk Assessment System.
Supports both single applicant dictionaries and pandas DataFrames.
"""

import numpy as np
import pandas as pd


def add_engineered_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate derived financial and demographic features for credit risk modeling.
    Works on a pandas DataFrame in-place or returning a copy.
    """
    df = df.copy()

    # 1. Loan to Income Ratio
    df["loan_to_income_ratio"] = df["loan_amount"] / (df["income"] + 1.0)

    # 2. Assets to Loan Ratio
    df["assets_to_loan_ratio"] = df["assets_value"] / (df["loan_amount"] + 1.0)

    # 3. Debt-to-Assets Ratio (Total annual debt payments / Total assets)
    # Annual debt payments = DTI * Income
    df["total_annual_debt"] = df["debt_to_income_ratio"] * df["income"]
    df["debt_to_assets_ratio"] = df["total_annual_debt"] / (df["assets_value"] + 1.0)

    # 4. Income per Dependent
    df["income_per_dependent"] = df["income"] / (df["number_of_dependents"] + 1.0)

    # 5. Employment stability (Years at job relative to age)
    df["years_at_job_to_age_ratio"] = df["years_at_current_job"] / (df["age"] - 17.0).clip(lower=1.0)

    # 6. Interaction terms
    df["credit_score_age_interaction"] = df["credit_score"] * df["age"]

    # 7. Risk Indicators
    df["is_high_risk_dti"] = (df["debt_to_income_ratio"] > 0.4).astype(float)
    df["is_subprime_credit"] = (df["credit_score"] < 620).astype(float)
    df["has_previous_defaults"] = (df["previous_defaults"] > 0).astype(float)

    # Cleanup temporary columns
    if "total_annual_debt" in df.columns:
        df = df.drop(columns=["total_annual_debt"])

    return df
