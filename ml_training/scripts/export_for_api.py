"""
Exports trained model ensemble, preprocessor, and metadata to backend/ml_models/xgboost_ensemble.
This populates the backend model registry directory and enables API serving.
"""

import shutil
import json
import joblib
from pathlib import Path

def main():
    models_src_dir = Path("c:/All Projects/credit_risk_project/ml_training/models")
    processed_src_dir = Path("c:/All Projects/credit_risk_project/ml_training/data/processed")
    
    # Destination directory inside the backend
    dest_dir = Path("c:/All Projects/credit_risk_project/backend/ml_models/xgboost_ensemble")
    dest_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Exporting model artifacts to: {dest_dir}...")
    
    # 1. Copy model.pkl (from Stacking Ensemble)
    shutil.copy(models_src_dir / "stacking_ensemble.pkl", dest_dir / "model.pkl")
    print("✔ Exported model.pkl")
    
    # 2. Copy preprocessor.pkl
    shutil.copy(processed_src_dir / "preprocessor.pkl", dest_dir / "preprocessor.pkl")
    print("✔ Exported preprocessor.pkl")
    
    # 3. Copy calibration_data.pkl (from ThresholdTuner)
    shutil.copy(models_src_dir / "threshold_tuner.pkl", dest_dir / "calibration_data.pkl")
    print("✔ Exported calibration_data.pkl")
    
    # 4. Generate and save feature_names.json
    preprocessor = joblib.load(processed_src_dir / "preprocessor.pkl")
    features = preprocessor.get_feature_names()
    with open(dest_dir / "feature_names.json", "w") as f:
        json.dump(features, f, indent=2)
    print(f"✔ Exported feature_names.json ({len(features)} features)")
    
    # 5. Generate and save metadata.json
    metrics = {}
    metrics_path = models_src_dir / "metrics.json"
    if metrics_path.exists():
        with open(metrics_path, "r") as f:
            all_metrics = json.load(f)
            metrics = all_metrics.get("stacking_ensemble", {})
            
    metadata = {
        "name": "xgboost_ensemble",
        "version": "2.0.0",
        "framework": "scikit-learn",
        "model_type": "StackingClassifier",
        "training_samples": 17500,  # 70% of 25k sample size
        "metrics": metrics,
        "notes": "Stacking ensemble combining LogisticRegression, RandomForest, and XGBoost with LogisticRegression meta-learner."
    }
    
    with open(dest_dir / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    print("✔ Exported metadata.json")
    
    print("Model export completed successfully!")

if __name__ == "__main__":
    main()
