"""
Verifies that the raw datasets are present in data/raw.
Since the user provided the actual datasets on disk, we just assert their existence.
"""

import os
from pathlib import Path

def main():
    raw_dir = Path("c:/All Projects/credit_risk_project/ml_training/data/raw")
    print(f"Checking raw dataset folder: {raw_dir}")
    
    required_files = [
        "application_train.csv",
        "cs-training.csv",
        "german_credit_data.csv"
    ]
    
    missing = False
    for filename in required_files:
        filepath = raw_dir / filename
        if filepath.exists():
            size_mb = filepath.stat().st_size / (1024 * 1024)
            print(f"✔ Found {filename} ({size_mb:.2f} MB)")
        else:
            print(f"✖ Missing {filename}")
            missing = True
            
    if missing:
        print("Error: Please make sure all datasets are placed in ml_training/data/raw.")
        exit(1)
    else:
        print("All raw datasets verified successfully!")

if __name__ == "__main__":
    main()
