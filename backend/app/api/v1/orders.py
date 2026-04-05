from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Order, Product, Resource
from app.services.order_splitter import OrderSplitter
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter()


class OrderCreate(BaseModel):
    order_no: str
    product_id: int
    quantity: float
    priority: int = 0
    due_date: datetime


class OrderResponse(BaseModel):
    id: int
    order_no: str
    product_id: int
    quantity: float
    priority: int
    due_date: datetime
    status: str
    created_at: datetime
    parent_order_id: Optional[int] = None
    split_strategy: Optional[str] = None
    split_index: int = 0
    is_split: bool = False

    class Config:
        from_attributes = True


class SplitOrderRequest(BaseModel):
    strategy: str  # quantity, resource, due_date, auto
    num_splits: Optional[int] = None  # for quantity strategy
    urgent_ratio: Optional[float] = 0.5  # for due_date strategy


class MergeOrderRequest(BaseModel):
    sub_order_ids: list[int]


@router.get("/", response_model=list[OrderResponse])
def list_orders(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取订单列表"""
    orders = db.query(Order).offset(skip).limit(limit).all()
    return orders


@router.post("/", response_model=OrderResponse)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    """创建订单"""
    db_order = Order(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """获取订单详情"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")
    return order


@router.post("/{order_id}/split", response_model=list[OrderResponse])
def split_order(order_id: int, request: SplitOrderRequest, db: Session = Depends(get_db)):
    """拆分订单"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    splitter = OrderSplitter(db)

    try:
        if request.strategy == "quantity":
            if not request.num_splits or request.num_splits < 2:
                raise HTTPException(status_code=400, detail="数量拆分需要指定拆分数量（>=2）")
            sub_orders = splitter.split_by_quantity(order, request.num_splits)

        elif request.strategy == "resource":
            resources = db.query(Resource).all()
            if not resources:
                raise HTTPException(status_code=400, detail="没有可用资源")
            sub_orders = splitter.split_by_resource_capacity(order, resources)

        elif request.strategy == "due_date":
            sub_orders = splitter.split_by_due_date(order, request.urgent_ratio or 0.5)

        elif request.strategy == "auto":
            resources = db.query(Resource).all()
            sub_orders = splitter.auto_split(order, {"resources": resources})

        else:
            raise HTTPException(status_code=400, detail="不支持的拆分策略")

        # 保存子订单
        for sub_order in sub_orders:
            db.add(sub_order)

        db.commit()

        # 刷新所有子订单
        for sub_order in sub_orders:
            db.refresh(sub_order)

        return sub_orders

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{order_id}/sub-orders", response_model=list[OrderResponse])
def get_sub_orders(order_id: int, db: Session = Depends(get_db)):
    """获取子订单列表"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="订单不存在")

    sub_orders = db.query(Order).filter(Order.parent_order_id == order_id).all()
    return sub_orders


@router.post("/merge", response_model=OrderResponse)
def merge_orders(request: MergeOrderRequest, db: Session = Depends(get_db)):
    """合并子订单"""
    if len(request.sub_order_ids) < 2:
        raise HTTPException(status_code=400, detail="至少需要2个子订单才能合并")

    splitter = OrderSplitter(db)

    try:
        merged_order = splitter.merge_orders(request.sub_order_ids)
        db.add(merged_order)
        db.commit()
        db.refresh(merged_order)
        return merged_order

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
