from sqlalchemy.orm import Session
from app.models import Order, Resource, Schedule, SchedulingConfig
from app.services.scheduler import SchedulingEngine
from datetime import datetime, timedelta
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class RollingScheduler:
    """滚动排产引擎"""

    def __init__(self, base_scheduler: SchedulingEngine, db: Session):
        self.base_scheduler = base_scheduler
        self.db = db

    def schedule_with_time_window(
        self,
        orders: list[Order],
        resources: list[Resource],
        window_start: datetime,
        window_size_days: int,
        overlap_days: int = 1
    ) -> dict:
        """
        固定时间窗口滚动排产

        Args:
            orders: 订单列表
            resources: 资源列表
            window_start: 窗口开始时间
            window_size_days: 窗口大小（天）
            overlap_days: 窗口重叠天数

        Returns:
            排产结果
        """
        logger.info(f"开始滚动排产: 窗口大小={window_size_days}天, 重叠={overlap_days}天")

        window_end = window_start + timedelta(days=window_size_days)

        # 按交期将订单分组到不同时间窗口
        windows = []
        current_start = window_start

        while True:
            current_end = current_start + timedelta(days=window_size_days)

            # 筛选该窗口内的订单（交期在窗口内）
            window_orders = [
                o for o in orders
                if current_start <= o.due_date < current_end
            ]

            if not window_orders:
                break

            windows.append({
                'start': current_start,
                'end': current_end,
                'orders': window_orders
            })

            # 移动到下一个窗口（考虑重叠）
            current_start = current_start + timedelta(days=window_size_days - overlap_days)

            # 如果所有订单都已分配，退出
            if all(any(o in w['orders'] for w in windows) for o in orders):
                break

        logger.info(f"创建了 {len(windows)} 个时间窗口")

        # 对每个窗口独立排产
        all_schedules = []
        for i, window in enumerate(windows):
            logger.info(f"排产窗口 {i+1}/{len(windows)}: {window['start']} - {window['end']}")

            result = self.base_scheduler.solve(window['orders'], resources)

            if result.get('status') == 'success':
                all_schedules.extend(result.get('schedules', []))
            else:
                logger.warning(f"窗口 {i+1} 排产失败: {result.get('message')}")

        return {
            'status': 'success',
            'windows': len(windows),
            'schedules': all_schedules,
            'total_orders': len(orders)
        }

    def dynamic_insert(
        self,
        new_order: Order,
        existing_schedules: list[Schedule],
        resources: list[Resource],
        locked_before: Optional[datetime] = None
    ) -> dict:
        """
        动态插单：在已有排产中插入新订单

        Args:
            new_order: 新订单
            existing_schedules: 现有排产计划
            resources: 资源列表
            locked_before: 锁定时间点（之前的排产不变）

        Returns:
            排产结果
        """
        logger.info(f"动态插单: 订单 {new_order.order_no}")

        if locked_before is None:
            locked_before = datetime.now()

        # 分离锁定和未锁定的排产
        locked_schedules = [s for s in existing_schedules if s.start_time < locked_before]
        unlocked_schedules = [s for s in existing_schedules if s.start_time >= locked_before]

        logger.info(f"锁定排产: {len(locked_schedules)}, 未锁定排产: {len(unlocked_schedules)}")

        # 获取未锁定排产对应的订单
        unlocked_order_ids = list(set(s.order_id for s in unlocked_schedules))
        unlocked_orders = self.db.query(Order).filter(Order.id.in_(unlocked_order_ids)).all()

        # 将新订单加入未锁定订单列表
        orders_to_schedule = unlocked_orders + [new_order]

        # 重新排产未锁定部分
        result = self.base_scheduler.solve(orders_to_schedule, resources)

        if result.get('status') == 'success':
            new_schedules = result.get('schedules', [])

            # 调整新排产的开始时间（不早于锁定时间）
            for schedule in new_schedules:
                if schedule['start_time'] < locked_before:
                    # 计算延迟时间
                    delay = (locked_before - schedule['start_time']).total_seconds() / 60
                    schedule['start_time'] = locked_before
                    schedule['end_time'] = schedule['end_time'] + timedelta(minutes=delay)

            return {
                'status': 'success',
                'locked_schedules': len(locked_schedules),
                'new_schedules': len(new_schedules),
                'schedules': new_schedules,
                'message': f"成功插入订单 {new_order.order_no}"
            }
        else:
            return {
                'status': 'failed',
                'message': f"插单失败: {result.get('message')}"
            }

    def hierarchical_schedule(
        self,
        orders: list[Order],
        resources: list[Resource],
        long_term_horizon: int = 30,  # 长期规划天数
        short_term_horizon: int = 7   # 短期精细排产天数
    ) -> dict:
        """
        分层排产：长期粗略计划 + 短期精细排产

        Args:
            orders: 订单列表
            resources: 资源列表
            long_term_horizon: 长期规划天数
            short_term_horizon: 短期精细排产天数

        Returns:
            排产结果
        """
        logger.info(f"分层排产: 长期={long_term_horizon}天, 短期={short_term_horizon}天")

        now = datetime.now()
        short_term_end = now + timedelta(days=short_term_horizon)
        long_term_end = now + timedelta(days=long_term_horizon)

        # 分离短期和长期订单
        short_term_orders = [o for o in orders if o.due_date <= short_term_end]
        long_term_orders = [o for o in orders if short_term_end < o.due_date <= long_term_end]

        logger.info(f"短期订单: {len(short_term_orders)}, 长期订单: {len(long_term_orders)}")

        all_schedules = []

        # 1. 短期精细排产
        if short_term_orders:
            logger.info("执行短期精细排产...")
            short_result = self.base_scheduler.solve(short_term_orders, resources)

            if short_result.get('status') == 'success':
                all_schedules.extend(short_result.get('schedules', []))
                logger.info(f"短期排产完成: {len(short_result.get('schedules', []))} 个任务")

        # 2. 长期粗略排产（简化版，按周分组）
        if long_term_orders:
            logger.info("执行长期粗略排产...")

            # 按周分组
            weeks = {}
            for order in long_term_orders:
                week_num = (order.due_date - now).days // 7
                if week_num not in weeks:
                    weeks[week_num] = []
                weeks[week_num].append(order)

            # 对每周进行粗略排产
            for week_num, week_orders in sorted(weeks.items()):
                week_start = now + timedelta(weeks=week_num)
                logger.info(f"排产第 {week_num+1} 周: {len(week_orders)} 个订单")

                week_result = self.base_scheduler.solve(week_orders, resources)

                if week_result.get('status') == 'success':
                    all_schedules.extend(week_result.get('schedules', []))

        return {
            'status': 'success',
            'short_term_orders': len(short_term_orders),
            'long_term_orders': len(long_term_orders),
            'schedules': all_schedules,
            'message': '分层排产完成'
        }

    def get_time_windows(
        self,
        start_date: datetime,
        end_date: datetime,
        window_size_days: int = 7
    ) -> list[dict]:
        """
        获取时间窗口列表

        Args:
            start_date: 开始日期
            end_date: 结束日期
            window_size_days: 窗口大小（天）

        Returns:
            时间窗口列表
        """
        windows = []
        current_start = start_date

        while current_start < end_date:
            current_end = min(current_start + timedelta(days=window_size_days), end_date)

            windows.append({
                'start': current_start,
                'end': current_end,
                'size_days': (current_end - current_start).days
            })

            current_start = current_end

        return windows
