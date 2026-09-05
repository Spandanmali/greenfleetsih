import enum
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Enum, DateTime
from app.db.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    full_access = "full_access"
    partial_access = "partial_access"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole, native_enum=False), default=UserRole.partial_access, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
