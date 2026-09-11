"""Supported marine fuels and their cost and lifecycle-emission factors."""

FUEL_TYPES = (
    "VLSFO",
    "MGO",
    "HFO",
    "LNG",
    "METHANOL",
    "HYDROGEN",
    "AMMONIA",
)

# Approximate USD per metric tonne, except shore power which is USD per
# electricity-equivalent tonne used by the existing prediction cost model.
    # Representative bunker prices in USD per metric tonne. Prices are deliberately
    # fuel-specific because the same tonne of each fuel does not have the same
    # energy content or supply-chain cost.
FUEL_COSTS_USD_PER_UNIT = {
    "VLSFO": 600.0,
    "MGO": 850.0,
        "HFO": 450.0,
        "LNG": 950.0,
        "METHANOL": 800.0,
    "HYDROGEN": 3000.0,  # Higher cost reflects lower energy density than LNG/methanol.
        "AMMONIA": 1200.0,  # Higher cost and lower energy density than LNG/methanol.
}

# Lifecycle CO2e in tonnes per tonne fuel-equivalent. Hydrogen and ammonia
# represent low-carbon production pathways and retain non-zero upstream impact.
CO2_FACTORS = {
    "VLSFO": 3.151,
    "MGO": 3.206,
    "HFO": 3.114,
    "LNG": 2.750,
    "METHANOL": 1.375,
    "HYDROGEN": 0.9,
    "AMMONIA": 1.6,
}


def validate_fuel_type(value: str) -> str:
    normalized = value.upper()
    if normalized not in FUEL_TYPES:
        raise ValueError("Unsupported fuel type")
    return normalized


def default_fuel_cost(fuel_type: str, requested_price: float | None) -> float:
    """Return the canonical price for the selected fuel type.

    The voyage field is retained for API compatibility, but cannot replace a
    fuel-specific price in the optimization objective.
    """
    normalized = fuel_type.upper()
    return FUEL_COSTS_USD_PER_UNIT.get(normalized, FUEL_COSTS_USD_PER_UNIT["VLSFO"])