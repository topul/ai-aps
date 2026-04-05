from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Enum as SQLEnum, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class ScheduleStatus(str, enum.Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(SQLEnum(ScheduleStatus), default=ScheduleStatus.PENDING)
    config_snapshot = Column(JSON)  # 保存排产时的配置快照
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    order = relationship("Order", back_populates="schedules")
    resource = relationship("Resource", back_populates="schedules")


class SchedulingConfig(Base):
    __tablename__ = "scheduling_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    parameters = Column(JSON, nullable=False)  # 存储配置参数
    is_default = Column(Boolean, default=False)
    created_by = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
