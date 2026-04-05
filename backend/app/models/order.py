from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, JSON, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.core.database import Base


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_no = Column(String, unique=True, index=True, nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    priority = Column(Integer, default=0)
    due_date = Column(DateTime, nullable=False)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 拆单相关字段
    parent_order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    split_strategy = Column(String, nullable=True)  # quantity, resource, due_date, auto
    split_index = Column(Integer, default=0)
    is_split = Column(Boolean, default=False)

    # Relationships
    product = relationship("Product", back_populates="orders")
    schedules = relationship("Schedule", back_populates="order")
    parent_order = relationship("Order", remote_side=[id], backref="sub_orders")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    product_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String)
    processing_time = Column(Float)  # 标准加工时间（分钟）
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    orders = relationship("Order", back_populates="product")
    bom_items = relationship("BOM", back_populates="product")
