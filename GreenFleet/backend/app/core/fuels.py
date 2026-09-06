"""Supported marine fuels and their default cost and direct-emission factors."""

FUEL_TYPES = (
    "VLSFO",
    "MGO",
    "HFO",
    "LNG",
    "METHANOL",
    "HYDROGEN",
    "AMMONIA",
    "SHORE_POWER",
)

# Approximate USD per metric tonne, except shore power which is USD per
# electricity-equivalent tonne used by the existing prediction cost model.
FUEL_COSTS_USD_PER_UNIT = {
    "VLSFO": 600.0,
    "MGO": 850.0,
    "HFO": 500.0,
    "LNG": 700.0,
    "METHANOL": 550.0,
    "HYDROGEN": 3000.0,  # Higher cost reflects lower energy density than LNG/methanol.
    "AMMONIA": 700.0,  # Requires dedicated storage and safety handling.
    "SHORE_POWER": 150.0,  # Electricity price; applicable only during port/idle time.
}

# Direct CO2 at point of use, in tonnes CO2 per tonne fuel-equivalent.
CO2_FACTORS = {
    "VLSFO": 3.151,
    "MGO": 3.206,
    "HFO": 3.114,
    "LNG": 2.750,
    "METHANOL": 1.375,
    "HYDROGEN": 0.0,
    "AMMONIA": 0.0,
    "SHORE_POWER": 0.0,
}


def validate_fuel_type(value: str) -> str:
    normalized = value.upper()
    if normalized not in FUEL_TYPES:
        raise ValueError("Unsupported fuel type")
    return normalized


def default_fuel_cost(fuel_type: str, requested_price: float | None) -> float:
    """Return a caller override, or the default for the selected fuel."""
    normalized = fuel_type.upper()
    # Existing clients send 600 as the legacy default. Do not apply VLSFO
    # pricing to hydrogen, ammonia, or shore power by accident.
    if requested_price is not None and requested_price != 600.0:
        return requested_price
    return FUEL_COSTS_USD_PER_UNIT.get(normalized, FUEL_COSTS_USD_PER_UNIT["VLSFO"])