from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Resource
from pydantic import BaseModel

router = APIRouter()


class ResourceCreate(BaseModel):
    resource_code: str
    name: str
    type: str
    capacity: float = 1.0
    status: str = "available"


class ResourceResponse(BaseModel):
    id: int
    resource_code: str
    name: str
    type: str
    capacity: float
    status: str

    class Config:
        from_attributes = True


@router.get("/", response_model=list[ResourceResponse])
def list_resources(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取资源列表"""
    resources = db.query(Resource).offset(skip).limit(limit).all()
    return resources


@router.post("/", response_model=ResourceResponse)
def create_resource(resource: ResourceCreate, db: Session = Depends(get_db)):
    """创建资源"""
    db_resource = Resource(**resource.model_dump())
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    return db_resource
