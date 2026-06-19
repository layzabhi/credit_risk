import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

import numpy as np
import pandas as pd
import joblib
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.colors import LinearSegmentedColormap
import seaborn as sns
from sklearn.metrics import (
    roc_curve,
    auc,
    precision_recall_curve,
    average_precision_score,
    confusion_matrix,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
)
from sklearn.calibration import calibration_curve

# Add backend to path for any shared utilities
sys.path.append(str(Path(__file__).resolve().parents[2] / "backend"))

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────
# Paths
# ──────────────────────────────────────────────
PROJECT_ROOT = Path("c:/All Projects/credit_risk_project")
RAW_DATA_DIR = PROJECT_ROOT / "ml_training" / "data" / "raw"
PROCESSED_DIR = PROJECT_ROOT / "ml_training" / "data" / "processed"
MODELS_DIR = PROJECT_ROOT / "ml_training" / "ml_models"
OUTPUT_DIR = PROJECT_ROOT / "ml_training" / "ml_artifacts" / "visualizations"


# ──────────────────────────────────────────────
# Style Configuration
# ──────────────────────────────────────────────
PALETTE = {
    "primary": "#6366f1",
    "secondary": "#7c3aed",
    "success": "#10b981",
    "warning": "#f59e0b",
    "danger": "#ef4444",
    "info": "#3b82f6",
    "dark": "#1e1b4b",
    "light": "#e0e7ff",
    "bg": "#fafbff",
    "text": "#1e293b",
    "muted": "#94a3b8",
}

MODEL_COLORS = {
    "logistic_regression": "#6366f1",
    "decision_tree": "#f59e0b",
    "random_forest": "#10b981",
    "xgboost": "#ef4444",
    "lightgbm": "#3b82f6",
    "stacking_ensemble": "#7c3aed",
}

MODEL_LABELS = {
    "logistic_regression": "Logistic Regression",
    "decision_tree": "Decision Tree",
    "random_forest": "Random Forest",
    "xgboost": "XGBoost",
    "lightgbm": "LightGBM",
    "stacking_ensemble": "Stacking Ensemble",
}


def _apply_style():
    """Apply a consistent, publication-quality style to all plots."""
    plt.rcParams.update({
        "figure.facecolor": PALETTE["bg"],
        "axes.facecolor": "#ffffff",
        "axes.edgecolor": "#e2e8f0",
        "axes.labelcolor": PALETTE["text"],
        "axes.titlesize": 14,
        "axes.titleweight": "bold",
        "axes.labelsize": 11,
        "axes.grid": True,
        "grid.color": "#f1f5f9",
        "grid.linewidth": 0.8,
        "xtick.color": PALETTE["muted"],
        "ytick.color": PALETTE["muted"],
        "xtick.labelsize": 9,
        "ytick.labelsize": 9,
        "legend.fontsize": 9,
        "legend.framealpha": 0.9,
        "legend.edgecolor": "#e2e8f0",
        "font.family": "sans-serif",
        "font.sans-serif": ["Segoe UI", "Arial", "Helvetica", "DejaVu Sans"],
        "savefig.dpi": 300,
        "savefig.bbox": "tight",
        "savefig.pad_inches": 0.3,
    })


def _save_figure(fig: plt.Figure, name: str):
    """Save a figure to the output directory."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    filepath = OUTPUT_DIR / f"{name}.png"
    fig.savefig(filepath)
    plt.close(fig)
    logger.info(f"Saved: {filepath}")


# ──────────────────────────────────────────────
# Data Loading Helpers
# ──────────────────────────────────────────────
def _map_raw_csv(filepath: Path) -> Optional[pd.DataFrame]:
    """Map a raw CSV file to the credit risk schema using train_models mapping functions."""
    try:
        # Import mapping functions from the sibling train_models script
        scripts_dir = Path(__file__).resolve().parent
        if str(scripts_dir) not in sys.path:
            sys.path.insert(0, str(scripts_dir))
        from train_models import map_application_train, map_cs_training, map_german_credit

        df = pd.read_csv(filepath, nrows=25000)
        name = filepath.name.lower()

        if "application_train" in name:
            return map_application_train(df)
        elif "cs-training" in name:
            return map_cs_training(df)
        elif "german_credit" in name:
            return map_german_credit(df)
        else:
            logger.warning(f"No mapping function for {filepath.name}")
            return None
    except Exception as e:
        logger.warning(f"Failed to map {filepath.name}: {e}")
        return None


def load_raw_mapped_data() -> pd.DataFrame:
    """Load raw data. Prefers processed splits, falls back to mapping raw CSVs."""
    # Try processed splits first
    dfs = []
    for split in ["train_raw.csv", "val_raw.csv", "test_raw.csv"]:
        path = PROCESSED_DIR / split
        if path.exists():
            df_part = pd.read_csv(path)
            processed_path = PROCESSED_DIR / split.replace("_raw", "")
            if processed_path.exists():
                df_proc = pd.read_csv(processed_path)
                if "default" in df_proc.columns:
                    df_part["default"] = df_proc["default"].values
            dfs.append(df_part)
    if dfs:
        return pd.concat(dfs, ignore_index=True)


    # Fall back to raw CSV files and apply mapping
    logger.info("Processed splits not found, loading from raw CSVs...")
    for csv_file in sorted(RAW_DATA_DIR.glob("*.csv")):
        mapped = _map_raw_csv(csv_file)
        if mapped is not None:
            dfs.append(mapped)
            logger.info(f"  Mapped {csv_file.name}: {len(mapped)} rows")

    if not dfs:
        raise FileNotFoundError(f"No data CSVs found in {RAW_DATA_DIR} or {PROCESSED_DIR}")
    return pd.concat(dfs, ignore_index=True)


def load_processed_splits():
    """Load processed train/val/test CSVs. Falls back to splitting raw mapped data."""
    train_path = PROCESSED_DIR / "train.csv"
    if train_path.exists():
        train = pd.read_csv(PROCESSED_DIR / "train.csv")
        val = pd.read_csv(PROCESSED_DIR / "val.csv")
        test = pd.read_csv(PROCESSED_DIR / "test.csv")
        return train, val, test

    # Fall back: load raw mapped data and do a simple split
    logger.info("Processed CSVs not found, creating splits from raw data...")
    from sklearn.model_selection import train_test_split

    df = load_raw_mapped_data()
    train_df, temp_df = train_test_split(df, test_size=0.30, random_state=42, stratify=df["default"])
    val_df, test_df = train_test_split(temp_df, test_size=0.50, random_state=42, stratify=temp_df["default"])
    return train_df, val_df, test_df


def load_metrics() -> Dict[str, Any]:
    """Load saved metrics.json, searching top-level and subdirectories."""
    # Check top-level
    metrics_path = MODELS_DIR / "metrics.json"
    if metrics_path.exists():
        with open(metrics_path, "r") as f:
            return json.load(f)

    # Check subdirectories for metadata.json files and construct metrics dict
    metrics = {}
    for subdir in MODELS_DIR.iterdir():
        if subdir.is_dir():
            meta_path = subdir / "metadata.json"
            if meta_path.exists():
                with open(meta_path, "r") as f:
                    meta = json.load(f)
                model_name = meta.get("name", subdir.name)
                if "metrics" in meta:
                    metrics[model_name] = meta["metrics"]
                    logger.info(f"Loaded metrics for {model_name} from {meta_path.name}")

    if not metrics:
        logger.warning(f"No metrics found in {MODELS_DIR}")
    return metrics


def load_models() -> Dict[str, Any]:
    """Load .pkl model files from models directory and its subdirectories."""
    models = {}
    skip_stems = {"preprocessor", "threshold_tuner"}

    # Top-level .pkl files
    for pkl_file in MODELS_DIR.glob("*.pkl"):
        if pkl_file.stem in skip_stems:
            continue
        try:
            models[pkl_file.stem] = joblib.load(pkl_file)
            logger.info(f"Loaded model: {pkl_file.stem}")
        except Exception as e:
            logger.warning(f"Could not load {pkl_file.stem}: {e}")

    # Subdirectory model.pkl files (e.g. models/xgboost/model.pkl)
    for subdir in MODELS_DIR.iterdir():
        if subdir.is_dir():
            model_pkl = subdir / "model.pkl"
            if model_pkl.exists():
                try:
                    models[subdir.name] = joblib.load(model_pkl)
                    logger.info(f"Loaded model: {subdir.name} (from {subdir.name}/model.pkl)")
                except Exception as e:
                    logger.warning(f"Could not load {subdir.name}/model.pkl: {e}")

    return models


# ══════════════════════════════════════════════
# PLOT 1 — Target Class Distribution
# ══════════════════════════════════════════════
def plot_class_distribution(df_raw: pd.DataFrame):
    """Bar chart showing default vs non-default class balance."""
    _apply_style()
    fig, axes = plt.subplots(1, 2, figsize=(12, 5), gridspec_kw={"width_ratios": [1, 1.4]})

    # --- Pie chart ---
    counts = df_raw["default"].value_counts().sort_index()
    labels = ["Non-Default (0)", "Default (1)"]
    colors = [PALETTE["success"], PALETTE["danger"]]
    explode = (0.03, 0.06)

    wedges, texts, autotexts = axes[0].pie(
        counts.values,
        labels=labels,
        autopct="%1.1f%%",
        colors=colors,
        explode=explode,
        startangle=140,
        textprops={"fontsize": 10, "fontweight": "bold"},
        pctdistance=0.55,
        wedgeprops={"edgecolor": "white", "linewidth": 2},
    )
    for t in autotexts:
        t.set_color("white")
    axes[0].set_title("Class Proportion", fontsize=13, fontweight="bold", pad=12)

    # --- Bar chart ---
    bars = axes[1].bar(
        labels,
        counts.values,
        color=colors,
        edgecolor="white",
        linewidth=1.5,
        width=0.55,
        zorder=3,
    )
    for bar, val in zip(bars, counts.values):
        axes[1].text(
            bar.get_x() + bar.get_width() / 2,
            bar.get_height() + counts.max() * 0.02,
            f"{val:,}",
            ha="center",
            va="bottom",
            fontsize=11,
            fontweight="bold",
            color=PALETTE["text"],
        )

    imbalance_ratio = counts.iloc[0] / max(counts.iloc[1], 1)
    axes[1].set_title(
        f"Class Counts  (Imbalance Ratio ≈ {imbalance_ratio:.1f}:1)",
        fontsize=13,
        fontweight="bold",
        pad=12,
    )
    axes[1].set_ylabel("Number of Samples")
    axes[1].set_ylim(0, counts.max() * 1.18)

    fig.suptitle("Target Variable Distribution — Credit Default", fontsize=15, fontweight="bold", y=1.02)
    fig.tight_layout()
    _save_figure(fig, "01_class_distribution")


# ══════════════════════════════════════════════
# PLOT 2 — Feature Distributions (Numerical)
# ══════════════════════════════════════════════
def plot_feature_distributions(df_raw: pd.DataFrame):
    """Histograms of key numerical features split by target class."""
    _apply_style()
    numerical_features = [
        "age", "income", "credit_score", "loan_amount",
        "debt_to_income_ratio", "assets_value", "years_at_current_job",
        "previous_defaults", "number_of_dependents",
    ]
    available = [f for f in numerical_features if f in df_raw.columns]

    n_cols = 3
    n_rows = int(np.ceil(len(available) / n_cols))
    fig, axes = plt.subplots(n_rows, n_cols, figsize=(16, 4.2 * n_rows))
    axes = axes.flatten()

    for idx, feat in enumerate(available):
        ax = axes[idx]
        for cls, color, label in [
            (0, PALETTE["success"], "Non-Default"),
            (1, PALETTE["danger"], "Default"),
        ]:
            subset = df_raw.loc[df_raw["default"] == cls, feat].dropna()
            ax.hist(
                subset,
                bins=40,
                alpha=0.55,
                color=color,
                label=label,
                edgecolor="white",
                linewidth=0.5,
                density=True,
            )
        ax.set_title(feat.replace("_", " ").title(), fontsize=11, fontweight="bold")
        ax.legend(fontsize=8, loc="upper right")
        ax.set_ylabel("Density")

    # Hide unused axes
    for j in range(len(available), len(axes)):
        axes[j].set_visible(False)

    fig.suptitle("Numerical Feature Distributions by Default Class", fontsize=15, fontweight="bold", y=1.01)
    fig.tight_layout()
    _save_figure(fig, "02_feature_distributions")


# ══════════════════════════════════════════════
# PLOT 3 — Categorical Feature Breakdown
# ══════════════════════════════════════════════
def plot_categorical_features(df_raw: pd.DataFrame):
    """Stacked bar charts of categorical features vs default rate."""
    _apply_style()
    cat_features = ["gender", "education_level", "marital_status", "employment_status", "payment_history", "loan_purpose"]
    available = [f for f in cat_features if f in df_raw.columns]

    n_cols = 3
    n_rows = int(np.ceil(len(available) / n_cols))
    fig, axes = plt.subplots(n_rows, n_cols, figsize=(16, 5 * n_rows))
    axes = axes.flatten()

    for idx, feat in enumerate(available):
        ax = axes[idx]
        ct = pd.crosstab(df_raw[feat], df_raw["default"], normalize="index") * 100
        ct.columns = ["Non-Default %", "Default %"]
        ct.sort_values("Default %", ascending=True).plot.barh(
            stacked=True,
            ax=ax,
            color=[PALETTE["success"], PALETTE["danger"]],
            edgecolor="white",
            linewidth=0.8,
        )
        ax.set_title(feat.replace("_", " ").title(), fontsize=11, fontweight="bold")
        ax.set_xlabel("Percentage")
        ax.legend(fontsize=8, loc="lower right")
        ax.set_xlim(0, 100)

    for j in range(len(available), len(axes)):
        axes[j].set_visible(False)

    fig.suptitle("Categorical Feature Breakdown — Default Rate", fontsize=15, fontweight="bold", y=1.01)
    fig.tight_layout()
    _save_figure(fig, "03_categorical_features")


# ══════════════════════════════════════════════
# PLOT 4 — Correlation Heatmap
# ══════════════════════════════════════════════
def plot_correlation_heatmap(df_raw: pd.DataFrame):
    """Pearson correlation heatmap of numerical features + target."""
    _apply_style()

    # Encode ordinal columns for correlation calculation
    df_corr = df_raw.copy()
    ordinal_maps = {
        "payment_history": {"Poor": 0, "Fair": 1, "Good": 2},
        "education_level": {"High School": 0, "Bachelor": 1, "Master": 2, "PhD": 3},
        "gender": {"Male": 1, "Female": 0},
        "employment_status": {"Employed": 1, "Unemployed": 0},
    }
    for col, mapping in ordinal_maps.items():
        if col in df_corr.columns:
            df_corr[col] = df_corr[col].map(mapping)

    numeric_df = df_corr.select_dtypes(include=[np.number])
    corr = numeric_df.corr()

    # Custom diverging colormap
    cmap = LinearSegmentedColormap.from_list(
        "risk", ["#6366f1", "#ffffff", "#ef4444"], N=256
    )

    fig, ax = plt.subplots(figsize=(14, 11))
    mask = np.triu(np.ones_like(corr, dtype=bool), k=1)
    sns.heatmap(
        corr,
        mask=mask,
        cmap=cmap,
        vmin=-1,
        vmax=1,
        center=0,
        annot=True,
        fmt=".2f",
        annot_kws={"size": 8},
        linewidths=0.5,
        linecolor="#f1f5f9",
        square=True,
        cbar_kws={"shrink": 0.75, "label": "Pearson r"},
        ax=ax,
    )
    ax.set_title("Feature Correlation Matrix", fontsize=15, fontweight="bold", pad=16)
    ax.tick_params(axis="x", rotation=45)
    ax.tick_params(axis="y", rotation=0)

    fig.tight_layout()
    _save_figure(fig, "04_correlation_heatmap")


# ══════════════════════════════════════════════
# PLOT 5 — Model Performance Comparison
# ══════════════════════════════════════════════
def plot_model_comparison(metrics: Dict[str, Any]):
    """Grouped bar chart comparing model metrics."""
    _apply_style()

    metric_keys = ["accuracy", "precision", "recall", "f1_score", "auc_roc"]
    metric_labels = ["Accuracy", "Precision", "Recall", "F1-Score", "AUC-ROC"]

    model_names = []
    model_data = {}
    for name, data in metrics.items():
        m = data.get("metrics", data) if isinstance(data, dict) else data
        model_names.append(name)
        model_data[name] = m

    if not model_names:
        logger.warning("No model metrics available for comparison plot.")
        return

    x = np.arange(len(metric_labels))
    width = 0.8 / len(model_names)

    fig, ax = plt.subplots(figsize=(14, 7))
    for i, name in enumerate(model_names):
        m = model_data[name]
        vals = []
        for k in metric_keys:
            val = m.get(k, m.get("f1", 0) if k == "f1_score" else 0)
            vals.append(val)
        offset = (i - len(model_names) / 2 + 0.5) * width
        bars = ax.bar(
            x + offset,
            vals,
            width * 0.9,
            label=MODEL_LABELS.get(name, name),
            color=MODEL_COLORS.get(name, PALETTE["primary"]),
            edgecolor="white",
            linewidth=0.8,
            zorder=3,
        )
        for bar, val in zip(bars, vals):
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.008,
                f"{val:.3f}",
                ha="center",
                va="bottom",
                fontsize=7,
                fontweight="bold",
                color=PALETTE["text"],
            )

    ax.set_xticks(x)
    ax.set_xticklabels(metric_labels, fontsize=11)
    ax.set_ylabel("Score")
    ax.set_ylim(0, 1.12)
    ax.set_title("Model Performance Comparison — All Metrics", fontsize=15, fontweight="bold", pad=14)
    ax.legend(loc="upper left", ncol=2, fontsize=9)

    fig.tight_layout()
    _save_figure(fig, "05_model_comparison")


# ══════════════════════════════════════════════
# PLOT 6 — ROC Curves
# ══════════════════════════════════════════════
def plot_roc_curves(models: Dict[str, Any], X_test: pd.DataFrame, y_test: pd.Series):
    """Multi-model ROC curves on the test set."""
    _apply_style()
    import xgboost as xgb

    fig, ax = plt.subplots(figsize=(10, 8))

    # Diagonal baseline
    ax.plot([0, 1], [0, 1], linestyle="--", color=PALETTE["muted"], linewidth=1.2, label="Random Baseline", zorder=1)

    for name, model in models.items():
        try:
            if hasattr(model, "predict_proba"):
                y_proba = model.predict_proba(X_test)[:, 1]
            elif type(model).__name__ == "Booster":
                dtest = xgb.DMatrix(X_test)
                y_proba = model.predict(dtest)
            else:
                continue

            fpr, tpr, _ = roc_curve(y_test, y_proba)
            roc_auc = auc(fpr, tpr)
            color = MODEL_COLORS.get(name, PALETTE["primary"])
            label = f"{MODEL_LABELS.get(name, name)}  (AUC = {roc_auc:.4f})"
            ax.plot(fpr, tpr, color=color, linewidth=2.2, label=label, zorder=2)
            ax.fill_between(fpr, tpr, alpha=0.06, color=color, zorder=1)
        except Exception as e:
            logger.warning(f"Skipping ROC for {name}: {e}")

    ax.set_xlabel("False Positive Rate")
    ax.set_ylabel("True Positive Rate")
    ax.set_title("Receiver Operating Characteristic (ROC) Curves", fontsize=15, fontweight="bold", pad=14)
    ax.legend(loc="lower right", fontsize=9)
    ax.set_xlim(-0.02, 1.02)
    ax.set_ylim(-0.02, 1.05)

    fig.tight_layout()
    _save_figure(fig, "06_roc_curves")


# ══════════════════════════════════════════════
# PLOT 7 — Precision-Recall Curves
# ══════════════════════════════════════════════
def plot_precision_recall_curves(models: Dict[str, Any], X_test: pd.DataFrame, y_test: pd.Series):
    """Multi-model Precision-Recall curves."""
    _apply_style()
    import xgboost as xgb

    fig, ax = plt.subplots(figsize=(10, 8))

    # Baseline
    baseline = y_test.sum() / len(y_test)
    ax.axhline(y=baseline, linestyle="--", color=PALETTE["muted"], linewidth=1.2, label=f"Baseline (prevalence = {baseline:.3f})")

    for name, model in models.items():
        try:
            if hasattr(model, "predict_proba"):
                y_proba = model.predict_proba(X_test)[:, 1]
            elif type(model).__name__ == "Booster":
                dtest = xgb.DMatrix(X_test)
                y_proba = model.predict(dtest)
            else:
                continue

            precision, recall, _ = precision_recall_curve(y_test, y_proba)
            ap = average_precision_score(y_test, y_proba)
            color = MODEL_COLORS.get(name, PALETTE["primary"])
            label = f"{MODEL_LABELS.get(name, name)}  (AP = {ap:.4f})"
            ax.plot(recall, precision, color=color, linewidth=2.2, label=label, zorder=2)
        except Exception as e:
            logger.warning(f"Skipping PR for {name}: {e}")

    ax.set_xlabel("Recall")
    ax.set_ylabel("Precision")
    ax.set_title("Precision-Recall Curves", fontsize=15, fontweight="bold", pad=14)
    ax.legend(loc="upper right", fontsize=9)
    ax.set_xlim(-0.02, 1.05)
    ax.set_ylim(0, 1.08)

    fig.tight_layout()
    _save_figure(fig, "07_precision_recall_curves")


# ══════════════════════════════════════════════
# PLOT 8 — Confusion Matrices
# ══════════════════════════════════════════════
def plot_confusion_matrices(models: Dict[str, Any], X_test: pd.DataFrame, y_test: pd.Series):
    """Heatmap confusion matrices for all models side-by-side."""
    _apply_style()
    import xgboost as xgb

    valid_models = []
    for name, model in models.items():
        try:
            if hasattr(model, "predict"):
                valid_models.append((name, model))
        except Exception:
            pass

    if not valid_models:
        logger.warning("No models available for confusion matrix plots.")
        return

    n = len(valid_models)
    n_cols = min(n, 3)
    n_rows = int(np.ceil(n / n_cols))
    fig, axes = plt.subplots(n_rows, n_cols, figsize=(5.5 * n_cols, 5 * n_rows))
    if n == 1:
        axes = np.array([axes])
    axes = axes.flatten()

    cmap = LinearSegmentedColormap.from_list("cm", ["#ffffff", PALETTE["primary"]], N=256)

    for idx, (name, model) in enumerate(valid_models):
        ax = axes[idx]
        try:
            if hasattr(model, "predict_proba"):
                y_pred = model.predict(X_test)
            elif type(model).__name__ == "Booster":
                dtest = xgb.DMatrix(X_test)
                y_proba = model.predict(dtest)
                y_pred = (y_proba >= 0.5).astype(int)
            else:
                continue

            cm = confusion_matrix(y_test, y_pred)
            sns.heatmap(
                cm,
                annot=True,
                fmt=",d",
                cmap=cmap,
                linewidths=1.5,
                linecolor="white",
                xticklabels=["Non-Default", "Default"],
                yticklabels=["Non-Default", "Default"],
                annot_kws={"size": 13, "fontweight": "bold"},
                cbar=False,
                ax=ax,
            )
            ax.set_xlabel("Predicted", fontsize=10)
            ax.set_ylabel("Actual", fontsize=10)
            ax.set_title(MODEL_LABELS.get(name, name), fontsize=12, fontweight="bold", pad=10)
        except Exception as e:
            logger.warning(f"Skipping CM for {name}: {e}")
            ax.set_visible(False)

    for j in range(len(valid_models), len(axes)):
        axes[j].set_visible(False)

    fig.suptitle("Confusion Matrices — Test Set", fontsize=15, fontweight="bold", y=1.02)
    fig.tight_layout()
    _save_figure(fig, "08_confusion_matrices")


# ══════════════════════════════════════════════
# PLOT 9 — Calibration Curves
# ══════════════════════════════════════════════
def plot_calibration_curves(models: Dict[str, Any], X_test: pd.DataFrame, y_test: pd.Series):
    """Calibration (reliability) curves — predicted vs observed probability."""
    _apply_style()
    import xgboost as xgb

    fig, ax = plt.subplots(figsize=(10, 8))

    ax.plot([0, 1], [0, 1], linestyle="--", color=PALETTE["muted"], linewidth=1.2, label="Perfectly Calibrated")

    for name, model in models.items():
        try:
            if hasattr(model, "predict_proba"):
                y_proba = model.predict_proba(X_test)[:, 1]
            elif type(model).__name__ == "Booster":
                dtest = xgb.DMatrix(X_test)
                y_proba = model.predict(dtest)
            else:
                continue

            fraction_positive, mean_predicted = calibration_curve(y_test, y_proba, n_bins=10, strategy="uniform")
            color = MODEL_COLORS.get(name, PALETTE["primary"])
            ax.plot(
                mean_predicted,
                fraction_positive,
                "o-",
                color=color,
                linewidth=2,
                markersize=6,
                label=MODEL_LABELS.get(name, name),
                zorder=2,
            )
        except Exception as e:
            logger.warning(f"Skipping calibration for {name}: {e}")

    ax.set_xlabel("Mean Predicted Probability")
    ax.set_ylabel("Fraction of Positives (Observed)")
    ax.set_title("Calibration Curves — Model Reliability", fontsize=15, fontweight="bold", pad=14)
    ax.legend(loc="lower right", fontsize=9)
    ax.set_xlim(-0.02, 1.02)
    ax.set_ylim(-0.02, 1.05)

    fig.tight_layout()
    _save_figure(fig, "09_calibration_curves")


# ══════════════════════════════════════════════
# PLOT 10 — Feature Importance (XGBoost)
# ══════════════════════════════════════════════
def plot_feature_importance(models: Dict[str, Any], feature_names: Optional[List[str]] = None):
    """Horizontal bar chart of XGBoost feature importance."""
    _apply_style()
    import xgboost as xgb

    xgb_model = models.get("xgboost")
    if xgb_model is None:
        logger.warning("XGBoost model not found; skipping feature importance plot.")
        return

    try:
        if type(xgb_model).__name__ == "Booster":
            importance = xgb_model.get_score(importance_type="weight")
        elif hasattr(xgb_model, "feature_importances_"):
            importances = xgb_model.feature_importances_
            names = feature_names or [f"f{i}" for i in range(len(importances))]
            importance = dict(zip(names, importances))
        else:
            logger.warning("Cannot extract feature importance from XGBoost model.")
            return
    except Exception as e:
        logger.warning(f"Failed to extract feature importance: {e}")
        return

    # Load feature name mapping if available
    feature_names_path = MODELS_DIR / "xgboost" / "feature_names.json"
    name_map = {}
    if feature_names_path.exists():
        with open(feature_names_path, "r") as f:
            saved_names = json.load(f)
            for i, n in enumerate(saved_names):
                name_map[f"f{i}"] = n

    # Sort by importance
    sorted_imp = sorted(importance.items(), key=lambda x: x[1], reverse=True)[:20]
    features = [name_map.get(k, k).replace("_", " ").title() for k, _ in sorted_imp]
    values = [v for _, v in sorted_imp]

    fig, ax = plt.subplots(figsize=(10, max(6, len(features) * 0.4)))
    bars = ax.barh(
        range(len(features)),
        values,
        color=PALETTE["primary"],
        edgecolor="white",
        linewidth=0.8,
        height=0.65,
        zorder=3,
    )

    # Gradient effect
    for i, bar in enumerate(bars):
        alpha = 0.4 + 0.6 * (1 - i / len(bars))
        bar.set_alpha(alpha)

    ax.set_yticks(range(len(features)))
    ax.set_yticklabels(features, fontsize=10)
    ax.invert_yaxis()
    ax.set_xlabel("Importance Score")
    ax.set_title("XGBoost — Top Feature Importance", fontsize=15, fontweight="bold", pad=14)

    fig.tight_layout()
    _save_figure(fig, "10_feature_importance")


# ══════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════
def main():
    """Generate and save all visualization plots."""
    logger.info("=" * 60)
    logger.info("Credit Risk Assessment — Visualization Pipeline")
    logger.info("=" * 60)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── Load raw data for EDA ──
    logger.info("Loading data for EDA plots...")
    df_raw = None
    try:
        df_raw = load_raw_mapped_data()
        logger.info(f"Raw data shape: {df_raw.shape}")
    except Exception as e:
        logger.error(f"Could not load raw data: {e}")

    # ── Load processed splits for model evaluation ──
    X_test, y_test = None, None
    logger.info("Loading processed splits for model evaluation plots...")
    try:
        _, _, test = load_processed_splits()
        X_test = test.drop(columns=["default"])
        y_test = test["default"]
        logger.info(f"Test set shape: {X_test.shape}")
        
        # Try to load model-specific preprocessor to align features
        raw_test_path = PROCESSED_DIR / "test_raw.csv"
        preprocessor_path = MODELS_DIR / "preprocessor.pkl"
        if not preprocessor_path.exists():
            preprocessor_path = MODELS_DIR / "xgboost" / "preprocessor.pkl"
            
        if raw_test_path.exists() and preprocessor_path.exists():
            logger.info(f"Loading model-specific preprocessor from {preprocessor_path} to align features...")

            scripts_dir = Path(__file__).resolve().parent
            if str(scripts_dir) not in sys.path:
                sys.path.insert(0, str(scripts_dir))
            import train_models
            sys.modules['__main__'].DataPreprocessor = train_models.DataPreprocessor
            prep = joblib.load(preprocessor_path)
            raw_test = pd.read_csv(raw_test_path)
            X_test_aligned = prep.transform(raw_test)
            logger.info(f"Aligned test set shape: {X_test_aligned.shape}")
            X_test = X_test_aligned
    except Exception as e:
        logger.error(f"Could not load processed splits or align features: {e}")



    # ── Load metrics and models ──
    logger.info("Loading metrics and trained models...")
    metrics = load_metrics()
    models = load_models()

    # ── Generate plots ──
    if df_raw is not None:
        logger.info("[1/10] Plotting class distribution...")
        plot_class_distribution(df_raw)

        logger.info("[2/10] Plotting feature distributions...")
        plot_feature_distributions(df_raw)

        logger.info("[3/10] Plotting categorical feature breakdown...")
        plot_categorical_features(df_raw)

        logger.info("[4/10] Plotting correlation heatmap...")
        plot_correlation_heatmap(df_raw)

    if metrics:
        logger.info("[5/10] Plotting model comparison...")
        plot_model_comparison(metrics)

    if models and X_test is not None:
        logger.info("[6/10] Plotting ROC curves...")
        plot_roc_curves(models, X_test, y_test)

        logger.info("[7/10] Plotting Precision-Recall curves...")
        plot_precision_recall_curves(models, X_test, y_test)

        logger.info("[8/10] Plotting confusion matrices...")
        plot_confusion_matrices(models, X_test, y_test)

        logger.info("[9/10] Plotting calibration curves...")
        plot_calibration_curves(models, X_test, y_test)

        logger.info("[10/10] Plotting feature importance...")
        feature_cols = list(X_test.columns) if X_test is not None else None
        plot_feature_importance(models, feature_names=feature_cols)

    logger.info("=" * 60)
    logger.info(f"All visualizations saved to: {OUTPUT_DIR}")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
