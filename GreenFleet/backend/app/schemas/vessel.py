from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.vessel import VesselType, CIIGrade


class VesselCreate(BaseModel):
    imo_number: str
    name: str
    vessel_type: VesselType
    flag_state: Optional[str] = None
    gross_tonnage: Optional[float] = None
    deadweight_tonnage: Optional[float] = None
    length_overall: Optional[float] = None
    engine_power_kw: Optional[float] = None
    engine_type: Optional[str] = None
    design_speed_knots: Optional[float] = None
    fuel_type: str = "VLSFO"
    build_year: Optional[int] = None


class VesselUpdate(BaseModel):
    name: Optional[str] = None
    flag_state: Optional[str] = None
    engine_type: Optional[str] = None
    fuel_type: Optional[str] = None
    current_cii_grade: Optional[CIIGrade] = None
    current_latitude: Optional[float] = None
    current_longitude: Optional[float] = None
    is_active: Optional[bool] = None


class VesselOut(BaseModel):
    id: str
    imo_number: str
    name: str
    vessel_type: VesselType
    flag_state: Optional[str]
    gross_tonnage: Optional[float]
    deadweight_tonnage: Optional[float]
    engine_power_kw: Optional[float]
    design_speed_knots: Optional[float]
    fuel_type: str
    build_year: Optional[int]
    current_cii_grade: CIIGrade
    current_latitude: Optional[float]
    current_longitude: Optional[float]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
