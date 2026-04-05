from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class DependencyType(str, enum.Enum):
    """任务依赖类型"""
    FS = "finish_to_start"  # 完成-开始：前置任务完成后，后续任务才能开始
    SS = "start_to_start"   # 开始-开始：前置任务开始后，后续任务才能开始
    FF = "finish_to_finish" # 完成-完成：前置任务完成后，后续任务才能完成
    SF = "start_to_finish"  # 开始-完成：前置任务开始后，后续任务才能完成


class TaskDependency(Base):
    """任务依赖关系模型"""
    __tablename__ = "task_dependencies"

    id = Column(Integer, primary_key=True, index=True)
    predecessor_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)  # 前置任务
    successor_id = Column(Integer, ForeignKey("schedules.id"), nullable=False)    # 后续任务
    dependency_type = Column(SQLEnum(DependencyType), default=DependencyType.FS)
    lag_time = Column(Integer, default=0)  # 延迟时间（分钟），可以为负数表示提前

    # Relationships
    predecessor = relationship("Schedule", foreign_keys=[predecessor_id], backref="successors")
    successor = relationship("Schedule", foreign_keys=[successor_id], backref="predecessors")
