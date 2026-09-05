import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, Enum, DateTime, ForeignKey
from app.db.database import Base


class VoyageStatus(str, enum.Enum):
    planned = "planned"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class Voyage(Base):
    __tablename__ = "voyages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vessel_id = Column(String(36), ForeignKey("vessels.id"), nullable=False)
    origin_port = Column(String, nullable=False)
    destination_port = Column(String, nullable=False)
    cargo_weight_mt = Column(Float, nullable=False)
    cargo_type = Column(String)
    distance_nm = Column(Float)
    cruising_speed_knots = Column(Float)
    fuel_type = Column(String, default="VLSFO")
    departure_time = Column(DateTime)
    arrival_time = Column(DateTime)
    status = Column(Enum(VoyageStatus, native_enum=False), default=VoyageStatus.planned)
    actual_fuel_consumed_mt = Column(Float)
    predicted_fuel_consumed_mt = Column(Float)
    co2_emitted_tonnes = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
