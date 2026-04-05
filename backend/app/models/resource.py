from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class ResourceType(str, enum.Enum):
    MACHINE = "machine"
    WORKER = "worker"
    TOOL = "tool"


class ResourceStatus(str, enum.Enum):
    AVAILABLE = "available"
    BUSY = "busy"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    resource_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    type = Column(SQLEnum(ResourceType), nullable=False)
    capacity = Column(Float, default=1.0)  # 产能系数
    status = Column(SQLEnum(ResourceStatus), default=ResourceStatus.AVAILABLE)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    calendars = relationship("Calendar", back_populates="resource")
    schedules = relationship("Schedule", back_populates="resource")
