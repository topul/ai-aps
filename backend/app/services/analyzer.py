from sqlalchemy.orm import Session
from app.models import Schedule, Resource, Order
from datetime import datetime, timedelta
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)


class ScheduleAnalyzer:
    """排产结果分析器"""

    def __init__(self, db: Session):
        self.db = db

    def analyze(self, schedule_ids: list[int]) -> dict:
        """分析排产结果"""
        if not schedule_ids:
            return {
                "status": "error",
                "message": "没有排产结果可分析"
            }

        schedules = self.db.query(Schedule).filter(Schedule.id.in_(schedule_ids)).all()
        if not schedules:
            return {
                "status": "error",
                "message": "未找到排产结果"
            }

        # 1. 计算资源利用率
        resource_utilization = self._calculate_resource_utilization(schedules)

        # 2. 计算准时率
        on_time_rate = self._calculate_on_time_rate(schedules)

        # 3. 识别瓶颈资源
        bottleneck_resources = self._identify_bottlenecks(schedules)

        # 4. 计算平均等待时间
        avg_waiting_time = self._calculate_waiting_time(schedules)

        # 5. 计算完工时间统计
        completion_stats = self._calculate_completion_stats(schedules)

        return {
            "status": "success",
            "total_schedules": len(schedules),
            "resource_utilization": resource_utilization,
            "on_time_rate": on_time_rate,
            "bottleneck_resources": bottleneck_resources,
            "avg_waiting_time": avg_waiting_time,
            "completion_stats": completion_stats
        }

    def _calculate_resource_utilization(self, schedules: list[Schedule]) -> dict:
        """计算资源利用率"""
        resource_usage = defaultdict(float)
        resource_names = {}

        # 计算每个资源的总使用时间
        for schedule in schedules:
            duration = (schedule.end_time - schedule.start_time).total_seconds() / 3600  # 小时
            resource_usage[schedule.resource_id] += duration

            if schedule.resource_id not in resource_names:
                resource = self.db.query(Resource).filter(Resource.id == schedule.resource_id).first()
                if resource:
                    resource_names[schedule.resource_id] = resource.name

        # 计算时间跨度
        if schedules:
            min_start = min(s.start_time for s in schedules)
            max_end = max(s.end_time for s in schedules)
            total_hours = (max_end - min_start).total_seconds() / 3600
        else:
            total_hours = 0

        # 计算利用率
        utilization = {}
        for resource_id, usage_hours in resource_usage.items():
            rate = (usage_hours / total_hours * 100) if total_hours > 0 else 0
            utilization[resource_names.get(resource_id, f"Resource {resource_id}")] = {
                "usage_hours": round(usage_hours, 2),
                "utilization_rate": round(rate, 2)
            }

        return utilization

    def _calculate_on_time_rate(self, schedules: list[Schedule]) -> dict:
        """计算准时率"""
        on_time_count = 0
        late_count = 0
        total_tardiness = 0

        for schedule in schedules:
            order = self.db.query(Order).filter(Order.id == schedule.order_id).first()
            if order:
                if schedule.end_time <= order.due_date:
                    on_time_count += 1
                else:
                    late_count += 1
                    tardiness = (schedule.end_time - order.due_date).total_seconds() / 3600
                    total_tardiness += tardiness

        total = on_time_count + late_count
        on_time_rate = (on_time_count / total * 100) if total > 0 else 0
        avg_tardiness = (total_tardiness / late_count) if late_count > 0 else 0

        return {
            "on_time_count": on_time_count,
            "late_count": late_count,
            "on_time_rate": round(on_time_rate, 2),
            "avg_tardiness_hours": round(avg_tardiness, 2)
        }

    def _identify_bottlenecks(self, schedules: list[Schedule]) -> list[dict]:
        """识别瓶颈资源"""
        resource_load = defaultdict(int)
        resource_names = {}

        for schedule in schedules:
            resource_load[schedule.resource_id] += 1
            if schedule.resource_id not in resource_names:
                resource = self.db.query(Resource).filter(Resource.id == schedule.resource_id).first()
                if resource:
                    resource_names[schedule.resource_id] = resource.name

        # 按负载排序
        sorted_resources = sorted(resource_load.items(), key=lambda x: x[1], reverse=True)

        bottlenecks = []
        for resource_id, task_count in sorted_resources[:3]:  # 取前3个
            bottlenecks.append({
                "resource_name": resource_names.get(resource_id, f"Resource {resource_id}"),
                "task_count": task_count
            })

        return bottlenecks

    def _calculate_waiting_time(self, schedules: list[Schedule]) -> float:
        """计算平均等待时间"""
        if not schedules:
            return 0

        # 按资源分组
        resource_schedules = defaultdict(list)
        for schedule in schedules:
            resource_schedules[schedule.resource_id].append(schedule)

        total_waiting = 0
        waiting_count = 0

        # 计算每个资源上任务之间的等待时间
        for resource_id, res_schedules in resource_schedules.items():
            sorted_schedules = sorted(res_schedules, key=lambda x: x.start_time)
            for i in range(1, len(sorted_schedules)):
                gap = (sorted_schedules[i].start_time - sorted_schedules[i-1].end_time).total_seconds() / 3600
                if gap > 0:
                    total_waiting += gap
                    waiting_count += 1

        avg_waiting = (total_waiting / waiting_count) if waiting_count > 0 else 0
        return round(avg_waiting, 2)

    def _calculate_completion_stats(self, schedules: list[Schedule]) -> dict:
        """计算完工时间统计"""
        if not schedules:
            return {}

        completion_times = [(s.end_time - s.start_time).total_seconds() / 3600 for s in schedules]

        return {
            "min_duration_hours": round(min(completion_times), 2),
            "max_duration_hours": round(max(completion_times), 2),
            "avg_duration_hours": round(sum(completion_times) / len(completion_times), 2),
            "total_duration_hours": round(sum(completion_times), 2)
        }
