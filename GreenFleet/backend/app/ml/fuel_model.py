"""
XGBoost-based fuel consumption prediction model.
Features derived from EU MRV dataset structure:
vessel_type_encoded, gross_tonnage, deadweight_tonnage, distance_nm,
cargo_weight_mt, speed_knots, load_factor, engine_power_kw
"""
from pathlib import Path

try:
    import numpy as np
    import joblib
    _ML_AVAILABLE = True
except ImportError:
    _ML_AVAILABLE = False

MODEL_PATH = Path(__file__).parent / "fuel_model.joblib"
MODEL_VERSION = "1.0.0-synthetic"

# CO2 emission factors per fuel type (tCO2 / tFuel), per IMO 4th GHG Study
CO2_FACTORS = {
    "VLSFO": 3.151,
    "MGO": 3.206,
    "HFO": 3.114,
    "LNG": 2.750,
    "METHANOL": 1.375,
}

VESSEL_TYPE_MAP = {
    "bulk_carrier": 0,
    "container_ship": 1,
    "tanker": 2,
    "general_cargo": 3,
    "roro": 4,
    "cruise": 5,
    "other": 6,
}


def _build_features(
    vessel_type: str,
    gross_tonnage: float,
    deadweight_tonnage: float,
    engine_power_kw: float,
    distance_nm: float,
    cargo_weight_mt: float,
    speed_knots: float,
):
    load_factor = cargo_weight_mt / max(deadweight_tonnage, 1)
    speed_cubed = speed_knots ** 3
    vt = VESSEL_TYPE_MAP.get(vessel_type, 6)
    return np.array([[vt, gross_tonnage, deadweight_tonnage, engine_power_kw,
                      distance_nm, cargo_weight_mt, speed_knots, load_factor, speed_cubed]])


def _physics_estimate(
    deadweight_tonnage: float,
    engine_power_kw: float,
    distance_nm: float,
    speed_knots: float,
    load_factor: float,
) -> float:
    """Estimate fuel using propeller-law power and voyage duration."""
    sfoc = 185  # g/kWh typical 2-stroke diesel
    reference_speed_knots = 14.0
    voyage_hours = distance_nm / max(speed_knots, 1)
    speed_power_factor = (max(speed_knots, 1) / reference_speed_knots) ** 3
    fuel_g = engine_power_kw * speed_power_factor * load_factor * sfoc * voyage_hours
    return fuel_g / 1_000_000  # convert to MT


def load_model():
    if _ML_AVAILABLE and MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    return None


def predict(
    vessel_type: str,
    gross_tonnage: float,
    deadweight_tonnage: float,
    engine_power_kw: float,
    distance_nm: float,
    cargo_weight_mt: float,
    speed_knots: float,
    fuel_type: str = "VLSFO",
    fuel_price_per_mt: float = 600.0,
) -> dict:
    model = load_model()
    load_factor = cargo_weight_mt / max(deadweight_tonnage, 1)

    if model is not None and _ML_AVAILABLE:
        features = _build_features(
            vessel_type, gross_tonnage, deadweight_tonnage,
            engine_power_kw, distance_nm, cargo_weight_mt, speed_knots
        )
        predicted_mt = float(model.predict(features)[0])
        confidence_margin = predicted_mt * 0.08
    else:
        predicted_mt = _physics_estimate(
            deadweight_tonnage, engine_power_kw, distance_nm, speed_knots, load_factor
        )
        confidence_margin = predicted_mt * 0.12

    co2_factor = CO2_FACTORS.get(fuel_type.upper(), 3.151)
    co2_tonnes = predicted_mt * co2_factor
    cost_usd = predicted_mt * fuel_price_per_mt

    # Speed sensitivity: compute for ±4 and ±2 knots
    sensitivity = []
    for delta in [-4, -2, 0, 2, 4]:
        s = max(speed_knots + delta, 4.0)
        if model is not None:
            f = _build_features(vessel_type, gross_tonnage, deadweight_tonnage,
                                engine_power_kw, distance_nm, cargo_weight_mt, s)
            fuel = float(model.predict(f)[0])
        else:
            fuel = _physics_estimate(deadweight_tonnage, engine_power_kw,
                                     distance_nm, s, load_factor)
        sensitivity.append({
            "speed_knots": round(s, 1),
            "fuel_mt": round(fuel, 2),
            "cost_usd": round(fuel * fuel_price_per_mt, 0),
        })

    return {
        "predicted_fuel_mt": round(predicted_mt, 2),
        "confidence_lower": round(max(0, predicted_mt - confidence_margin), 2),
        "confidence_upper": round(predicted_mt + confidence_margin, 2),
        "predicted_cost_usd": round(cost_usd, 0),
        "predicted_co2_tonnes": round(co2_tonnes, 2),
        "fuel_price_per_mt": fuel_price_per_mt,
        "speed_sensitivity": sensitivity,
        "model_version": MODEL_VERSION,
    }
