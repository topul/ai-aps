from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON
from datetime import datetime
from app.core.database import Base


class IntegrationConfig(Base):
    __tablename__ = "integration_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    config_type = Column(String(20))
    config_data = Column(JSON)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IntegrationLog(Base):
    __tablename__ = "integration_logs"

    id = Column(Integer, primary_key=True, index=True)
    config_id = Column(Integer, ForeignKey("integration_configs.id"))
    request_data = Column(JSON)
    response_data = Column(JSON)
    status = Column(String(20))
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)