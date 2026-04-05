from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    material_code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    unit = Column(String, nullable=False)  # 单位：kg, pcs, m等
    stock_quantity = Column(Float, default=0)
    lead_time = Column(Integer, default=0)  # 采购提前期（天）
    supplier = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    bom_items = relationship("BOM", back_populates="material")


class BOM(Base):
    __tablename__ = "bom"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False)
    quantity = Column(Float, nullable=False)  # 单位产品所需物料数量
    sequence = Column(Integer, default=0)  # 工序顺序
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="bom_items")
    material = relationship("Material", back_populates="bom_items")
