import uuid
from datetime import datetime
from sqlalchemy import Column, Float, String, DateTime, ForeignKey
from sqlalchemy.types import JSON
from app.db.database import Base


class FuelPrediction(Base):
    __tablename__ = "fuel_predictions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vessel_id = Column(String(36), ForeignKey("vessels.id"), nullable=False)
    created_by = Column(String(36), ForeignKey("users.id"))
    origin_port = Column(String)
    destination_port = Column(String)
    distance_nm = Column(Float)
    cargo_weight_mt = Column(Float)
    cruising_speed_knots = Column(Float)
    fuel_type = Column(String)
    predicted_fuel_mt = Column(Float, nullable=False)
    confidence_lower = Column(Float)
    confidence_upper = Column(Float)
    predicted_cost_usd = Column(Float)
    predicted_co2_tonnes = Column(Float)
    fuel_price_per_mt = Column(Float)
    speed_sensitivity = Column(JSON)
    model_version = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
