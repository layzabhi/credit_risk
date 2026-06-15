"""
Computes SHAP explanations on a test dataset sample.
Verifies that the SHAPExplainer class integrates properly with the trained ensemble.
"""

import os
import sys
import joblib
import pandas as pd
from pathlib import Path

# Add backend directory to path
sys.path.append(str(Path(__file__).resolve().parents[2] / "backend"))
from app.services.explainer import SHAPExplainer

def main():
    processed_dir = Path("c:/All Projects/credit_risk_project/ml_training/data/processed")
    models_dir = Path("c:/All Projects/credit_risk_project/ml_training/models")
    
    print("Loading model and test data splits...")
    model = joblib.load(models_dir / "stacking_ensemble.pkl")
    
    # Load raw and processed test sets
    test_raw = pd.read_csv(processed_dir / "test_raw.csv")
    test_proc = pd.read_csv(processed_dir / "test.csv").drop(columns=["default"])
    
    # Take a small sample of 5 rows to explain
    sample_raw = test_raw.head(5)
    sample_proc = test_proc.head(5)
    
    print("Initializing SHAPExplainer on trained ensemble...")
    explainer = SHAPExplainer(model=model, background_data=test_proc.head(100).values)
    
    print("Generating explanations for test sample...")
    for idx in range(len(sample_raw)):
        row_raw = sample_raw.iloc[[idx]]
        row_proc = sample_proc.iloc[[idx]]
        
        # Run prediction probability
        prob = float(model.predict_proba(row_proc)[:, 1][0])
        
        # Get SHAP explanation
        explanation = explainer.explain(
            original_X=row_raw,
            preprocessed_X=row_proc,
            prediction=prob
        )
        
        print(f"\n--- Applicant #{idx+1} (Prob: {prob:.4f}) ---")
        print("Top influencing features:")
        for feat in explanation.top_features:
            print(f"  - {feat.name}: {feat.direction} impact ({feat.impact:.4f})")
            
    print("\nSHAP explanations generated and verified successfully!")

if __name__ == "__main__":
    main()
