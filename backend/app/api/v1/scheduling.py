from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import Schedule, Order, Resource, SchedulingConfig
from app.tasks.scheduling import run_scheduling_task
from app.services.analyzer import ScheduleAnalyzer
from app.services.scheduler import SchedulingEngine
from app.services.rolling_scheduler import RollingScheduler
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter()


class SchedulingRequest(BaseModel):
    order_ids: list[int]
    config_id: int = 1
    async_mode: bool = True


class RollingScheduleRequest(BaseModel):
    order_ids: list[int]
    config_id: int = 1
    window_size_days: int = 7
    overlap_days: int = 1
    window_start: Optional[datetime] = None


class DynamicInsertRequest(BaseModel):
    new_order_id: int
    config_id: int = 1
    locked_before: Optional[datetime] = None


class HierarchicalScheduleRequest(BaseModel):
    order_ids: list[int]
    config_id: int = 1
    long_term_horizon: int = 30
    short_term_horizon: int = 7


class SchedulingResponse(BaseModel):
    task_id: str | None = None
    status: str
    message: str


class ScheduleResponse(BaseModel):
    id: int
    order_id: int
    resource_id: int
    start_time: datetime
    end_time: datetime
    status: str

    class Config:
        from_attributes = True


@router.post("/run", response_model=SchedulingResponse)
def run_scheduling(
    request: SchedulingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """执行排产"""
    if request.async_mode:
        # 异步执行
        task = run_scheduling_task.delay(request.order_ids, request.config_id)
        return SchedulingResponse(
            task_id=task.id,
            status="pending",
            message="排产任务已提交"
        )
    else:
        # 同步执行（不推荐用于生产环境）
        result = run_scheduling_task(request.order_ids, request.config_id)
        return SchedulingResponse(
            status="completed",
            message=f"排产完成，生成 {len(result['schedule_ids'])} 个排产计划"
        )


@router.post("/rolling")
def rolling_schedule(request: RollingScheduleRequest, db: Session = Depends(get_db)):
    """滚动排产"""
    # 获取订单和资源
    orders = db.query(Order).filter(Order.id.in_(request.order_ids)).all()
    resources = db.query(Resource).all()

    if not orders:
        raise HTTPException(status_code=404, detail="未找到订单")
    if not resources:
        raise HTTPException(status_code=404, detail="未找到资源")

    # 创建排产引擎
    base_engine = SchedulingEngine(config_id=request.config_id, db=db)
    rolling_scheduler = RollingScheduler(base_engine, db)

    # 执行滚动排产
    window_start = request.window_start or datetime.now()
    result = rolling_scheduler.schedule_with_time_window(
        orders=orders,
        resources=resources,
        window_start=window_start,
        window_size_days=request.window_size_days,
        overlap_days=request.overlap_days
    )

    if result.get('status') == 'success':
        # 保存排产结果
        schedule_ids = base_engine.save_results(result, db)
        db.commit()

        return {
            'status': 'success',
            'windows': result.get('windows'),
            'schedule_ids': schedule_ids,
            'message': f"滚动排产完成，生成 {len(schedule_ids)} 个排产计划"
        }
    else:
        raise HTTPException(status_code=500, detail=result.get('message'))


@router.post("/insert")
def dynamic_insert(request: DynamicInsertRequest, db: Session = Depends(get_db)):
    """动态插单"""
    # 获取新订单
    new_order = db.query(Order).filter(Order.id == request.new_order_id).first()
    if not new_order:
        raise HTTPException(status_code=404, detail="订单不存在")

    # 获取现有排产
    existing_schedules = db.query(Schedule).all()
    resources = db.query(Resource).all()

    if not resources:
        raise HTTPException(status_code=404, detail="未找到资源")

    # 创建排产引擎
    base_engine = SchedulingEngine(config_id=request.config_id, db=db)
    rolling_scheduler = RollingScheduler(base_engine, db)

    # 执行动态插单
    result = rolling_scheduler.dynamic_insert(
        new_order=new_order,
        existing_schedules=existing_schedules,
        resources=resources,
        locked_before=request.locked_before
    )

    if result.get('status') == 'success':
        # 保存新的排产结果
        for schedule_data in result.get('schedules', []):
            schedule = Schedule(
                order_id=schedule_data['order_id'],
                resource_id=schedule_data['resource_id'],
                start_time=schedule_data['start_time'],
                end_time=schedule_data['end_time'],
                status='pending'
            )
            db.add(schedule)

        db.commit()

        return {
            'status': 'success',
            'locked_schedules': result.get('locked_schedules'),
            'new_schedules': result.get('new_schedules'),
            'message': result.get('message')
        }
    else:
        raise HTTPException(status_code=500, detail=result.get('message'))


@router.post("/hierarchical")
def hierarchical_schedule(request: HierarchicalScheduleRequest, db: Session = Depends(get_db)):
    """分层排产"""
    # 获取订单和资源
    orders = db.query(Order).filter(Order.id.in_(request.order_ids)).all()
    resources = db.query(Resource).all()

    if not orders:
        raise HTTPException(status_code=404, detail="未找到订单")
    if not resources:
        raise HTTPException(status_code=404, detail="未找到资源")

    # 创建排产引擎
    base_engine = SchedulingEngine(config_id=request.config_id, db=db)
    rolling_scheduler = RollingScheduler(base_engine, db)

    # 执行分层排产
    result = rolling_scheduler.hierarchical_schedule(
        orders=orders,
        resources=resources,
        long_term_horizon=request.long_term_horizon,
        short_term_horizon=request.short_term_horizon
    )

    if result.get('status') == 'success':
        # 保存排产结果
        schedule_ids = base_engine.save_results(result, db)
        db.commit()

        return {
            'status': 'success',
            'short_term_orders': result.get('short_term_orders'),
            'long_term_orders': result.get('long_term_orders'),
            'schedule_ids': schedule_ids,
            'message': result.get('message')
        }
    else:
        raise HTTPException(status_code=500, detail=result.get('message'))


@router.get("/windows")
def get_time_windows(
    start_date: datetime,
    end_date: datetime,
    window_size_days: int = 7,
    db: Session = Depends(get_db)
):
    """获取时间窗口列表"""
    base_engine = SchedulingEngine(config_id=1, db=db)
    rolling_scheduler = RollingScheduler(base_engine, db)

    windows = rolling_scheduler.get_time_windows(
        start_date=start_date,
        end_date=end_date,
        window_size_days=window_size_days
    )

    return {'windows': windows}


@router.get("/schedules", response_model=list[ScheduleResponse])
def list_schedules(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取排产结果列表"""
    schedules = db.query(Schedule).offset(skip).limit(limit).all()
    return schedules


@router.get("/schedules/{schedule_id}", response_model=ScheduleResponse)
def get_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """获取排产结果详情"""
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="排产结果不存在")
    return schedule


@router.post("/analyze")
def analyze_schedules(schedule_ids: list[int], db: Session = Depends(get_db)):
    """分析排产结果"""
    analyzer = ScheduleAnalyzer(db)
    result = analyzer.analyze(schedule_ids)
    return result
