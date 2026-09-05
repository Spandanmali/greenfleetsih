import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, Float, Integer, String, DateTime, ForeignKey, Enum
from app.db.database import Base


class CIIGradeEnum(str, enum.Enum):
    A = "A"
    B = "B"
    C = "C"
    D = "D"
    E = "E"


class CIIRecord(Base):
    __tablename__ = "cii_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vessel_id = Column(String(36), ForeignKey("vessels.id"), nullable=False)
    year = Column(Integer, nullable=False)
    distance_travelled_nm = Column(Float)
    fuel_consumed_mt = Column(Float)
    co2_emitted_tonnes = Column(Float)
    transport_work = Column(Float)
    attained_cii = Column(Float)
    required_cii = Column(Float)
    cii_grade = Column(Enum(CIIGradeEnum, native_enum=False))
    created_at = Column(DateTime, default=datetime.utcnow)
