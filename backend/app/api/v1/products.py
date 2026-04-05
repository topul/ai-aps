from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Product
from pydantic import BaseModel

router = APIRouter()


class ProductCreate(BaseModel):
    product_code: str
    name: str
    description: str | None = None
    processing_time: float | None = None


class ProductResponse(BaseModel):
    id: int
    product_code: str
    name: str
    description: str | None
    processing_time: float | None

    class Config:
        from_attributes = True


@router.get("/", response_model=list[ProductResponse])
def list_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取产品列表"""
    products = db.query(Product).offset(skip).limit(limit).all()
    return products


@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """创建产品"""
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """获取产品详情"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="产品不存在")
    return product
