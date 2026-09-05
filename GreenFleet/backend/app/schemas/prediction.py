from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class PredictionRequest(BaseModel):
    vessel_id: str
    origin_port: str
    destination_port: str
    distance_nm: float
    cargo_weight_mt: float
    cruising_speed_knots: float
    fuel_type: str = "VLSFO"
    fuel_price_per_mt: Optional[float] = 600.0


class SpeedSensitivityPoint(BaseModel):
    speed_knots: float
    fuel_mt: float
    cost_usd: float


class PredictionOut(BaseModel):
    id: str
    vessel_id: str
    origin_port: Optional[str]
    destination_port: Optional[str]
    distance_nm: Optional[float]
    cargo_weight_mt: Optional[float]
    cruising_speed_knots: Optional[float]
    fuel_type: Optional[str]
    predicted_fuel_mt: float
    confidence_lower: Optional[float]
    confidence_upper: Optional[float]
    predicted_cost_usd: Optional[float]
    predicted_co2_tonnes: Optional[float]
    fuel_price_per_mt: Optional[float]
    speed_sensitivity: Optional[List[SpeedSensitivityPoint]]
    model_version: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}
