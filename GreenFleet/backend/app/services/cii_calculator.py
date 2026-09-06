"""
CII (Carbon Intensity Indicator) calculator per IMO MEPC.337(76).
attained_CII = CO2_emitted (g) / (capacity * distance_nm)
capacity = DWT for bulk carriers and tankers, GT for others
"""

from app.core.fuels import CO2_FACTORS

# Reference CII (g/tonne-nm) reduction factors per vessel type (IMO table)
# These are the 'a' and 'c' parameters for: required_CII = a * capacity^c
CII_PARAMS = {
    "bulk_carrier":    {"a": 4745, "c": -0.622},
    "tanker":          {"a": 5247, "c": -0.610},
    "container_ship":  {"a": 1984, "c": -0.489},
    "general_cargo":   {"a": 588,  "c": -0.3885},
    "roro":            {"a": 1967, "c": -0.485},
    "cruise":          {"a": 930,  "c": -0.383},
    "other":           {"a": 2000, "c": -0.500},
}

# Annual reduction factors vs 2019 baseline (IMO MEPC.337(76))
REDUCTION_FACTORS = {
    2023: 0.95,
    2024: 0.93,
    2025: 0.91,
    2026: 0.89,
    2027: 0.87,
    2028: 0.85,
    2029: 0.83,
    2030: 0.80,
}

# Grade boundaries as multipliers on required CII
GRADE_BOUNDARIES = {
    "bulk_carrier":   {"d1": 0.86, "d2": 0.94, "d3": 1.06, "d4": 1.18},
    "container_ship": {"d1": 0.83, "d2": 0.94, "d3": 1.07, "d4": 1.19},
    "tanker":         {"d1": 0.82, "d2": 0.93, "d3": 1.08, "d4": 1.28},
    "general_cargo":  {"d1": 0.83, "d2": 0.94, "d3": 1.06, "d4": 1.19},
    "roro":           {"d1": 0.82, "d2": 0.94, "d3": 1.06, "d4": 1.21},
    "cruise":         {"d1": 0.87, "d2": 0.95, "d3": 1.06, "d4": 1.16},
    "other":          {"d1": 0.83, "d2": 0.94, "d3": 1.07, "d4": 1.19},
}

def calculate_cii(
    vessel_type: str,
    capacity: float,
    distance_nm: float,
    fuel_consumed_mt: float,
    fuel_type: str = "VLSFO",
    year: int = 2026,
) -> dict:
    co2_factor = CO2_FACTORS.get(fuel_type.upper(), CO2_FACTORS["VLSFO"])
    co2_grams = fuel_consumed_mt * co2_factor * 1_000_000  # MT → grams

    transport_work = capacity * distance_nm
    if transport_work == 0:
        return {"error": "Transport work is zero"}

    attained_cii = co2_grams / transport_work

    params = CII_PARAMS.get(vessel_type, CII_PARAMS["other"])
    required_cii_2019 = params["a"] * (capacity ** params["c"])
    reduction = REDUCTION_FACTORS.get(year, 0.89)
    required_cii = required_cii_2019 * reduction

    ratio = attained_cii / required_cii
    bounds = GRADE_BOUNDARIES.get(vessel_type, GRADE_BOUNDARIES["other"])

    if ratio < bounds["d1"]:
        grade = "A"
    elif ratio < bounds["d2"]:
        grade = "B"
    elif ratio < bounds["d3"]:
        grade = "C"
    elif ratio < bounds["d4"]:
        grade = "D"
    else:
        grade = "E"

    return {
        "attained_cii": round(attained_cii, 4),
        "required_cii": round(required_cii, 4),
        "cii_ratio": round(ratio, 4),
        "cii_grade": grade,
        "co2_emitted_tonnes": round(fuel_consumed_mt * co2_factor, 2),
        "transport_work": round(transport_work, 0),
        "year": year,
    }
