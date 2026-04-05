from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Material
from pydantic import BaseModel

router = APIRouter()


class MaterialCreate(BaseModel):
    material_code: str
    name: str
    unit: str
    stock_quantity: float = 0
    lead_time: int = 0
    supplier: str | None = None


class MaterialResponse(BaseModel):
    id: int
    material_code: str
    name: str
    unit: str
    stock_quantity: float
    lead_time: int
    supplier: str | None

    class Config:
        from_attributes = True


@router.get("/", response_model=list[MaterialResponse])
def list_materials(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取物料列表"""
    materials = db.query(Material).offset(skip).limit(limit).all()
    return materials


@router.post("/", response_model=MaterialResponse)
def create_material(material: MaterialCreate, db: Session = Depends(get_db)):
    """创建物料"""
    db_material = Material(**material.model_dump())
    db.add(db_material)
    db.commit()
    db.refresh(db_material)
    return db_material
