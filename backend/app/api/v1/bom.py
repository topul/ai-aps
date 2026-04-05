from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import BOM
from pydantic import BaseModel

router = APIRouter()


class BOMCreate(BaseModel):
    product_id: int
    material_id: int
    quantity: float
    sequence: int = 0


class BOMResponse(BaseModel):
    id: int
    product_id: int
    material_id: int
    quantity: float
    sequence: int

    class Config:
        from_attributes = True


@router.get("/", response_model=list[BOMResponse])
def list_bom(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取BOM列表"""
    bom_items = db.query(BOM).offset(skip).limit(limit).all()
    return bom_items


@router.post("/", response_model=BOMResponse)
def create_bom(bom: BOMCreate, db: Session = Depends(get_db)):
    """创建BOM"""
    db_bom = BOM(**bom.model_dump())
    db.add(db_bom)
    db.commit()
    db.refresh(db_bom)
    return db_bom
