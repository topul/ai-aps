from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class AIConfig(Base):
    """AI配置模型"""
    __tablename__ = "ai_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # 配置名称
    provider = Column(String, nullable=False)  # 提供商：claude, openai, custom
    api_key = Column(String, nullable=False)  # API密钥（加密存储）
    api_base = Column(String, nullable=True)  # API基础URL（自定义API）
    model = Column(String, nullable=False)  # 模型名称
    parameters = Column(JSON, default={})  # 模型参数（temperature, max_tokens等）
    is_active = Column(Boolean, default=False)  # 是否激活
    is_default = Column(Boolean, default=False)  # 是否为默认配置
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
