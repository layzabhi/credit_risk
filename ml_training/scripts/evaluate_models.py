"""
Trains baseline classifiers and advanced ensemble models (XGBoost, Stacking).
Evaluates performance and saves the trained Stacking Ensemble model.
"""

import os
import json
import joblib
import pandas as pd
from pathlib import Path
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb

def main():
    processed_dir = Path("c:/All Projects/credit_risk_project/ml_training/data/processed")
    models_dir = Path("c:/All Projects/credit_risk_project/ml_training/models")
    models_dir.mkdir(parents=True, exist_ok=True)
    
    print("Loading preprocessed splits...")
    train_df = pd.read_csv(processed_dir / "train.csv")
    val_df = pd.read_csv(processed_dir / "val.csv")
    test_df = pd.read_csv(processed_dir / "test.csv")
    
    X_train = train_df.drop(columns=["default"])
    y_train = train_df["default"]
    
    X_val = val_df.drop(columns=["default"])
    y_val = val_df["default"]
    
    X_test = test_df.drop(columns=["default"])
    y_test = test_df["default"]
    
    print(f"Training shapes: X_train={X_train.shape}, y_train={y_train.shape}")
    
    # Initialize base models
    print("Training Logistic Regression baseline...")
    model_lr = LogisticRegression(
        max_iter=1000,
        class_weight="balanced",
        solver="saga",
        random_state=42
    )
    model_lr.fit(X_train, y_train)
    
    print("Training Random Forest baseline...")
    model_rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        class_weight="balanced",
        n_jobs=-1,
        random_state=42
    )
    model_rf.fit(X_train, y_train)
    
    print("Training XGBoost classifier...")
    # Compute scale_pos_weight for imbalanced classes
    neg_count = sum(y_train == 0)
    pos_count = sum(y_train == 1)
    ratio = neg_count / max(1, pos_count)
    
    model_xgb = xgb.XGBClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.05,
        scale_pos_weight=ratio,
        n_jobs=-1,
        random_state=42,
        eval_metric="logloss"
    )
    model_xgb.fit(X_train, y_train)
    
    # Train Stacking Ensemble
    print("Training Stacking Classifier ensemble...")
    estimators = [
        ('lr', model_lr),
        ('rf', model_rf),
        ('xgb', model_xgb)
    ]
    
    model_stack = StackingClassifier(
        estimators=estimators,
        final_estimator=LogisticRegression(class_weight="balanced"),
        cv=3,
        n_jobs=-1
    )
    model_stack.fit(X_train, y_train)
    
    # Evaluation
    print("Evaluating models on test set...")
    models = {
        "logistic_regression": model_lr,
        "random_forest": model_rf,
        "xgboost": model_xgb,
        "stacking_ensemble": model_stack
    }
    
    metrics = {}
    for name, clf in models.items():
        preds = clf.predict(X_test)
        probs = clf.predict_proba(X_test)[:, 1]
        
        acc = accuracy_score(y_test, preds)
        prec = precision_score(y_test, preds, zero_division=0)
        rec = recall_score(y_test, preds, zero_division=0)
        f1 = f1_score(y_test, preds, zero_division=0)
        auc = roc_auc_score(y_test, probs)
        
        print(f"[{name}] Acc: {acc:.4f}, Prec: {prec:.4f}, Rec: {rec:.4f}, F1: {f1:.4f}, AUC: {auc:.4f}")
        metrics[name] = {
            "accuracy": float(acc),
            "precision": float(prec),
            "recall": float(rec),
            "f1_score": float(f1),
            "auc_roc": float(auc)
        }
        
    # Save metrics
    with open(models_dir / "metrics.json", "w") as f:
        json.dump(metrics, f, indent=2)
        
    # Save the final ensemble model
    joblib.dump(model_stack, models_dir / "stacking_ensemble.pkl")
    print(f"Saved metrics and Stacking Ensemble model to: {models_dir}")

if __name__ == "__main__":
    main()
