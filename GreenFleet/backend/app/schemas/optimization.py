from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class OptimizationRoute(BaseModel):
    id: str
    origin_port: str = Field(min_length=1)
    destination_port: str = Field(min_length=1)
    distance_nm: float = Field(gt=0)
    cargo_weight_mt: float = Field(ge=0)
    fuel_price_per_mt: float = Field(default=600.0, gt=0)


class QPSORequest(BaseModel):
    method: Literal["qpso", "ga"] = "qpso"
    routes: List[OptimizationRoute] = Field(min_length=1, max_length=100)
    vessel_ids: Optional[List[str]] = None
    speeds: List[float] = Field(min_length=1, max_length=20)
    fuel_types: List[str] = Field(min_length=1, max_length=10)
    iterations: int = Field(default=30, ge=1, le=200)
    particles: int = Field(default=20, ge=4, le=100)

    @field_validator("speeds")
    @classmethod
    def validate_speeds(cls, speeds: List[float]) -> List[float]:
        if any(speed < 4 or speed > 25 for speed in speeds):
            raise ValueError("Speeds must be between 4 and 25 knots")
        return sorted(set(speeds))

    @field_validator("fuel_types")
    @classmethod
    def validate_fuel_types(cls, fuel_types: List[str]) -> List[str]:
        allowed = {"VLSFO", "MGO", "HFO", "LNG", "METHANOL"}
        normalized = [fuel.upper() for fuel in fuel_types]
        if any(fuel not in allowed for fuel in normalized):
            raise ValueError("Unsupported fuel type")
        return list(dict.fromkeys(normalized))


class OptimizationAssignment(BaseModel):
    route_id: str
    origin_port: str
    destination_port: str
    vessel_id: str
    vessel_name: str
    speed_knots: float
    fuel_type: str
    predicted_fuel_mt: float
    predicted_cost_usd: float
    predicted_co2_tonnes: float


class QPSOMetrics(BaseModel):
    method: Literal["qpso", "ga"] = "qpso"
    iterations: int
    particles: int
    evaluations: int
    initial_cost_usd: float
    final_cost_usd: float
    improvement_percent: float
    convergence: List[float]
    generations: int = 0
    runtime_ms: float = 0


class QPSOResponse(BaseModel):
    assignments: List[OptimizationAssignment]
    total_predicted_fuel_mt: float
    total_cost_usd: float
    total_co2_tonnes: float
    metrics: QPSOMetrics


class BenchmarkAlgorithmResult(BaseModel):
    final_cost_usd: float
    convergence: List[float]
    runtime_ms: float


class BenchmarkResponse(BaseModel):
    qpso: BenchmarkAlgorithmResult
    ga: BenchmarkAlgorithmResult
    iterations: int
    particles: int