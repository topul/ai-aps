from app.tasks.celery_app import celery_app
from app.services.scheduler import SchedulingEngine
from app.core.database import SessionLocal
from app.core.websocket import manager
from app.models import Order, Resource, Schedule
from sqlalchemy.orm import Session
import logging
import asyncio

logger = logging.getLogger(__name__)


@celery_app.task(bind=True)
def run_scheduling_task(self, order_ids: list[int], config_id: int):
    """异步执行排产任务（支持 WebSocket 进度推送）"""
    db = SessionLocal()
    try:
        # 获取 task_id（同步调用时可能为 None）
        task_id = self.request.id

        # 更新任务状态（仅在异步模式下）
        if task_id:
            self.update_state(state="PROGRESS", meta={"status": "正在加载数据...", "progress": 10})

            # 通过 WebSocket 推送进度
            asyncio.run(manager.send_scheduling_progress(
                task_id,
                {"status": "正在加载数据...", "progress": 10}
            ))

        # 加载订单和资源数据
        orders = db.query(Order).filter(Order.id.in_(order_ids)).all()
        resources = db.query(Resource).all()

        if not orders:
            raise ValueError("未找到订单")
        if not resources:
            raise ValueError("未找到可用资源")

        # 初始化排产引擎
        if task_id:
            self.update_state(state="PROGRESS", meta={"status": "正在构建排产模型...", "progress": 30})
            asyncio.run(manager.send_scheduling_progress(
                task_id,
                {"status": "正在构建排产模型...", "progress": 30}
            ))

        engine = SchedulingEngine(config_id=config_id, db=db)

        # 执行排产
        if task_id:
            self.update_state(state="PROGRESS", meta={"status": "正在求解...", "progress": 50})
            asyncio.run(manager.send_scheduling_progress(
                task_id,
                {"status": "正在求解...", "progress": 50}
            ))

        result = engine.solve(orders, resources)

        # 保存结果
        if task_id:
            self.update_state(state="PROGRESS", meta={"status": "正在保存结果...", "progress": 80})
            asyncio.run(manager.send_scheduling_progress(
                task_id,
                {"status": "正在保存结果...", "progress": 80}
            ))

        schedule_ids = engine.save_results(result, db)

        db.commit()

        # 完成
        final_result = {
            "status": "success",
            "schedule_ids": schedule_ids,
            "objective_value": result.get("objective_value"),
            "solve_time": result.get("solve_time")
        }

        if task_id:
            asyncio.run(manager.send_scheduling_complete(task_id, final_result))

        return final_result

    except Exception as e:
        logger.error(f"排产任务失败: {str(e)}")
        db.rollback()

        # 推送错误信息
        if self.request.id:
            asyncio.run(manager.send_scheduling_complete(
                self.request.id,
                {"status": "error", "message": str(e)}
            ))

        raise
    finally:
        db.close()