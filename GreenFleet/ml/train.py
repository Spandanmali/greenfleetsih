"""
Train XGBoost fuel prediction model on EU MRV dataset.
Download data from: https://mrv.emsa.europa.eu/#public/emission-report
Save as: ml/data/eu_mrv_data.csv

EU MRV columns used:
  Ship type, Gross tonnage, Deadweight tonnage, Technical efficiency (g/ton mile),
  Total fuel consumption [m tonnes], Total distance travelled [n miles]

Run: python ml/train.py
Output: backend/app/ml/fuel_model.joblib
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_percentage_error
import xgboost as xgb
import joblib
from pathlib import Path

VESSEL_TYPE_MAP = {
    "Bulk carrier": 0,
    "Container ship": 1,
    "Oil tanker": 2,
    "Chemical tanker": 2,
    "General cargo ship": 3,
    "Ro-ro ship": 4,
    "Passenger ship": 5,
    "Other": 6,
}

def load_eu_mrv(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    print(f"Loaded {len(df)} records from EU MRV dataset")
    return df


def prepare_synthetic_data(n: int = 5000) -> pd.DataFrame:
    """
    Generate synthetic voyage data to bootstrap the model before EU MRV data is available.
    Based on Admiralty coefficient fuel estimation.
    """
    rng = np.random.default_rng(42)
    vessel_types = rng.integers(0, 7, n)
    gt = rng.uniform(5000, 200000, n)
    dwt = gt * rng.uniform(0.6, 1.4, n)
    engine_kw = dwt * rng.uniform(0.08, 0.18, n)
    distance = rng.uniform(500, 15000, n)
    cargo = dwt * rng.uniform(0.4, 0.95, n)
    speed = rng.uniform(8, 18, n)
    load_factor = cargo / dwt
    speed_cubed = speed ** 3

    # Physics-based fuel estimate + noise. Propeller power scales with speed cubed.
    voyage_hours = distance / speed
    sfoc = 185  # g/kWh
    reference_speed = 14.0
    speed_power_factor = (speed / reference_speed) ** 3
    fuel = (engine_kw * speed_power_factor * load_factor * sfoc * voyage_hours) / 1_000_000  # MT
    fuel = fuel * rng.uniform(0.85, 1.15, n)  # ±15% noise

    return pd.DataFrame({
        "vessel_type": vessel_types,
        "gross_tonnage": gt,
        "deadweight_tonnage": dwt,
        "engine_power_kw": engine_kw,
        "distance_nm": distance,
        "cargo_weight_mt": cargo,
        "speed_knots": speed,
        "load_factor": load_factor,
        "speed_cubed": speed_cubed,
        "fuel_consumed_mt": fuel,
    })


def train(data_path: str = None):
    if data_path and Path(data_path).exists():
        df = load_eu_mrv(data_path)
        # Map EU MRV columns — adjust column names to match actual EU MRV export
        df = df.rename(columns={
            "Ship type": "vessel_type_str",
            "Gross tonnage": "gross_tonnage",
            "Deadweight tonnage": "deadweight_tonnage",
            "Total fuel consumption [m tonnes]": "fuel_consumed_mt",
            "Total distance travelled [n miles]": "distance_nm",
        })
        df["vessel_type"] = df["vessel_type_str"].map(VESSEL_TYPE_MAP).fillna(6)
        df["engine_power_kw"] = df["deadweight_tonnage"] * 0.12  # estimate if not present
        df["cargo_weight_mt"] = df["deadweight_tonnage"] * 0.75
        df["speed_knots"] = df["distance_nm"] / (df["fuel_consumed_mt"] / 0.001)  # rough estimate
        df["load_factor"] = df["cargo_weight_mt"] / df["deadweight_tonnage"].clip(lower=1)
        df["speed_cubed"] = df["speed_knots"] ** 3
        df = df.dropna(subset=["fuel_consumed_mt", "distance_nm", "gross_tonnage"])
    else:
        print("EU MRV data not found — training on synthetic data.")
        print("Download from https://mrv.emsa.europa.eu/#public/emission-report")
        print("Save to ml/data/eu_mrv_data.csv and re-run to train on real data.")
        df = prepare_synthetic_data(8000)

    features = ["vessel_type", "gross_tonnage", "deadweight_tonnage", "engine_power_kw",
                "distance_nm", "cargo_weight_mt", "speed_knots", "load_factor", "speed_cubed"]
    target = "fuel_consumed_mt"

    df = df[(df["fuel_consumed_mt"] > 0) & (df["distance_nm"] > 0)]

    X = df[features]
    y = df[target]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.15, random_state=42)

    model = xgb.XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
    )
    model.fit(X_train, y_train, eval_set=[(X_test, y_test)], verbose=False)

    y_pred = model.predict(X_test)
    mape = mean_absolute_percentage_error(y_test, y_pred) * 100
    print(f"Test MAPE: {mape:.2f}%")
    if mape > 8:
        print("WARNING: MAPE > 8% target. Consider using real EU MRV data for retraining.")

    out_path = Path(__file__).parent.parent / "backend" / "app" / "ml" / "fuel_model.joblib"
    joblib.dump(model, out_path)
    print(f"Model saved to {out_path}")
    return mape


if __name__ == "__main__":
    import sys
    data_path = sys.argv[1] if len(sys.argv) > 1 else "ml/data/eu_mrv_data.csv"
    train(data_path)
