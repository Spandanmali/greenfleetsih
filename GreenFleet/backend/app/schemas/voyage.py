from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.voyage import VoyageStatus


class VoyageCreate(BaseModel):
    vessel_id: str
    origin_port: str
    destination_port: str
    cargo_weight_mt: float
    cargo_type: Optional[str] = None
    distance_nm: Optional[float] = None
    cruising_speed_knots: Optional[float] = None
    fuel_type: str = "VLSFO"
    departure_time: Optional[datetime] = None


class VoyageUpdate(BaseModel):
    status: Optional[VoyageStatus] = None
    actual_fuel_consumed_mt: Optional[float] = None
    arrival_time: Optional[datetime] = None
    co2_emitted_tonnes: Optional[float] = None


class VoyageOut(BaseModel):
    id: str
    vessel_id: str
    origin_port: str
    destination_port: str
    cargo_weight_mt: float
    cargo_type: Optional[str]
    distance_nm: Optional[float]
    cruising_speed_knots: Optional[float]
    fuel_type: str
    departure_time: Optional[datetime]
    arrival_time: Optional[datetime]
    status: VoyageStatus
    actual_fuel_consumed_mt: Optional[float]
    predicted_fuel_consumed_mt: Optional[float]
    co2_emitted_tonnes: Optional[float]
    created_at: datetime

    model_config = {"from_attributes": True}
