import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, Boolean, Enum, DateTime
from app.db.database import Base


class VesselType(str, enum.Enum):
    bulk_carrier = "bulk_carrier"
    container_ship = "container_ship"
    tanker = "tanker"
    general_cargo = "general_cargo"
    roro = "roro"
    cruise = "cruise"
    other = "other"


class CIIGrade(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"
    unknown = "unknown"


class Vessel(Base):
    __tablename__ = "vessels"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    imo_number = Column(String(7), unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    vessel_type = Column(Enum(VesselType, native_enum=False), nullable=False)
    flag_state = Column(String(3))
    gross_tonnage = Column(Float)
    deadweight_tonnage = Column(Float)
    length_overall = Column(Float)
    engine_power_kw = Column(Float)
    engine_type = Column(String)
    design_speed_knots = Column(Float)
    fuel_type = Column(String, default="VLSFO")
    build_year = Column(Integer)
    current_cii_grade = Column(Enum(CIIGrade, native_enum=False), default=CIIGrade.unknown)
    current_latitude = Column(Float)
    current_longitude = Column(Float)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
