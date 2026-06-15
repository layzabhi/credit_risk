"""
Calibrates model probability decision thresholds using validation predictions.
Saves the optimal fitted ThresholdTuner object.
"""

import os
import sys
import joblib
import pandas as pd
import numpy as np
from pathlib import Path

# Add backend to path to import ThresholdTuner
sys.path.append(str(Path(__file__).resolve().parents[2] / "backend"))
from app.services.scorer import ThresholdTuner

def main():
    processed_dir = Path("c:/All Projects/credit_risk_project/ml_training/data/processed")
    models_dir = Path("c:/All Projects/credit_risk_project/ml_training/models")
    
    print("Loading Stacking Ensemble model and validation split...")
    model = joblib.load(models_dir / "stacking_ensemble.pkl")
    
    val_df = pd.read_csv(processed_dir / "val.csv")
    X_val = val_df.drop(columns=["default"])
    y_val = val_df["default"].values
    
    # Predict probabilities
    print("Generating validation probabilities...")
    val_probs = model.predict_proba(X_val)[:, 1]
    
    # Instantiate and fit tuner
    print("Fitting ThresholdTuner...")
    tuner = ThresholdTuner(validation_probs=val_probs, validation_labels=y_val)
    
    print(f"Optimal probability decision threshold: {tuner.optimal_threshold:.4f}")
    
    # Save tuner
    joblib.dump(tuner, models_dir / "threshold_tuner.pkl")
    print("ThresholdTuner saved successfully!")

if __name__ == "__main__":
    main()
