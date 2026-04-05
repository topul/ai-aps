from ortools.sat.python import cp_model
from sqlalchemy.orm import Session
from app.models import Order, Resource, Schedule, SchedulingConfig, Product
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class SchedulingEngine:
    """OR-Tools排产引擎 - 改进版"""

    def __init__(self, config_id: int, db: Session):
        self.db = db
        self.config = self._load_config(config_id)
        self.model = cp_model.CpModel()
        self.solver = cp_model.CpSolver()

    def _load_config(self, config_id: int) -> dict:
        """加载排产配置"""
        config = self.db.query(SchedulingConfig).filter(SchedulingConfig.id == config_id).first()
        if not config:
            # 使用默认配置
            return {
                "objective": "minimize_makespan",
                "max_solve_time": 300,
                "constraints": {
                    "resource_capacity": True,
                    "material_availability": True,
                    "sequence": True
                }
            }
        return config.parameters

    def solve(self, orders: list[Order], resources: list[Resource]) -> dict:
        """执行排产求解"""
        logger.info(f"开始排产: {len(orders)} 个订单, {len(resources)} 个资源")

        if not orders or not resources:
            return {
                "status": "failed",
                "message": "订单或资源为空"
            }

        # 定义时间范围（以分钟为单位）
        horizon = 20160  # 14天 = 14 * 24 * 60

        # 创建任务字典
        all_tasks = {}
        task_type = {}  # 记录每个任务对应的订单和资源

        # 为每个订单创建任务
        for order_idx, order in enumerate(orders):
            # 获取产品信息
            product = self.db.query(Product).filter(Product.id == order.product_id).first()
            if not product or not product.processing_time:
                logger.warning(f"订单 {order.order_no} 的产品没有加工时间，使用默认值60分钟")
                duration = 60
            else:
                duration = int(product.processing_time * order.quantity)  # 总加工时间

            # 为该订单在每个资源上创建可选任务
            for resource_idx, resource in enumerate(resources):
                # 考虑资源产能系数
                adjusted_duration = int(duration / resource.capacity)

                suffix = f'_o{order_idx}_r{resource_idx}'
                start_var = self.model.NewIntVar(0, horizon, f'start{suffix}')
                end_var = self.model.NewIntVar(0, horizon, f'end{suffix}')
                interval_var = self.model.NewIntervalVar(
                    start_var, adjusted_duration, end_var, f'interval{suffix}'
                )

                # 创建一个布尔变量表示该任务是否被选中
                presence_var = self.model.NewBoolVar(f'presence{suffix}')

                # 创建可选区间变量
                optional_interval = self.model.NewOptionalIntervalVar(
                    start_var, adjusted_duration, end_var, presence_var, f'opt_interval{suffix}'
                )

                all_tasks[order_idx, resource_idx] = {
                    'start': start_var,
                    'end': end_var,
                    'interval': interval_var,
                    'optional_interval': optional_interval,
                    'presence': presence_var,
                    'duration': adjusted_duration
                }

                task_type[order_idx, resource_idx] = {
                    'order': order,
                    'resource': resource
                }

        # 约束1: 每个订单必须且只能分配给一个资源
        for order_idx in range(len(orders)):
            self.model.Add(
                sum(all_tasks[order_idx, resource_idx]['presence']
                    for resource_idx in range(len(resources))) == 1
            )

        # 约束2: 每个资源同一时间只能处理一个任务（无重叠）
        for resource_idx in range(len(resources)):
            resource_intervals = [
                all_tasks[order_idx, resource_idx]['optional_interval']
                for order_idx in range(len(orders))
            ]
            self.model.AddNoOverlap(resource_intervals)

        # 约束3: 考虑订单优先级（高优先级订单尽量早完成）
        priority_penalties = []
        for order_idx, order in enumerate(orders):
            for resource_idx in range(len(resources)):
                task = all_tasks[order_idx, resource_idx]
                # 优先级越高（数值越大），惩罚系数越大
                penalty_weight = (order.priority + 1) * 100
                penalty_var = self.model.NewIntVar(0, horizon * penalty_weight, f'penalty_o{order_idx}_r{resource_idx}')
                self.model.Add(penalty_var == task['end'] * penalty_weight).OnlyEnforceIf(task['presence'])
                self.model.Add(penalty_var == 0).OnlyEnforceIf(task['presence'].Not())
                priority_penalties.append(penalty_var)

        # 约束4: 考虑交期约束（软约束，通过惩罚实现）
        due_date_penalties = []
        base_time = datetime.now().replace(hour=8, minute=0, second=0, microsecond=0)

        for order_idx, order in enumerate(orders):
            # 计算交期对应的分钟数
            due_minutes = int((order.due_date - base_time).total_seconds() / 60)
            if due_minutes < 0:
                due_minutes = 0
            elif due_minutes > horizon:
                due_minutes = horizon

            for resource_idx in range(len(resources)):
                task = all_tasks[order_idx, resource_idx]
                # 如果完成时间超过交期，增加惩罚
                tardiness = self.model.NewIntVar(0, horizon, f'tardiness_o{order_idx}_r{resource_idx}')
                self.model.AddMaxEquality(tardiness, [task['end'] - due_minutes, 0])

                weighted_tardiness = self.model.NewIntVar(0, horizon * 1000, f'weighted_tardiness_o{order_idx}_r{resource_idx}')
                self.model.Add(weighted_tardiness == tardiness * 1000).OnlyEnforceIf(task['presence'])
                self.model.Add(weighted_tardiness == 0).OnlyEnforceIf(task['presence'].Not())
                due_date_penalties.append(weighted_tardiness)

        # 目标函数
        objective = self.config.get("objective", "minimize_makespan")

        if objective == "minimize_makespan":
            # 最小化最大完工时间
            makespan = self.model.NewIntVar(0, horizon, 'makespan')
            self.model.AddMaxEquality(
                makespan,
                [all_tasks[order_idx, resource_idx]['end']
                 for order_idx in range(len(orders))
                 for resource_idx in range(len(resources))]
            )
            # 综合目标：最小化完工时间 + 优先级惩罚 + 交期惩罚
            total_objective = self.model.NewIntVar(0, horizon * 10000, 'total_objective')
            self.model.Add(total_objective == makespan + sum(priority_penalties) + sum(due_date_penalties))
            self.model.Minimize(total_objective)

        elif objective == "minimize_tardiness":
            # 最小化总延期时间
            self.model.Minimize(sum(due_date_penalties))
        else:
            # 默认最小化完工时间
            makespan = self.model.NewIntVar(0, horizon, 'makespan')
            self.model.AddMaxEquality(
                makespan,
                [all_tasks[order_idx, resource_idx]['end']
                 for order_idx in range(len(orders))
                 for resource_idx in range(len(resources))]
            )
            self.model.Minimize(makespan)

        # 设置求解参数
        self.solver.parameters.max_time_in_seconds = self.config.get("max_solve_time", 300)
        self.solver.parameters.num_search_workers = 4  # 使用多线程

        # 求解
        logger.info("开始求解...")
        start_time = datetime.now()
        status = self.solver.Solve(self.model)
        solve_time = (datetime.now() - start_time).total_seconds()

        if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
            status_str = 'OPTIMAL' if status == cp_model.OPTIMAL else 'FEASIBLE'
            logger.info(f"求解成功! 状态: {status_str}, 耗时: {solve_time:.2f}秒")

            # 提取结果
            result = {
                "status": "success",
                "solve_status": status_str,
                "objective_value": self.solver.ObjectiveValue(),
                "solve_time": solve_time,
                "schedules": []
            }

            # 提取被选中的任务
            for order_idx in range(len(orders)):
                for resource_idx in range(len(resources)):
                    task = all_tasks[order_idx, resource_idx]
                    if self.solver.Value(task['presence']):
                        start_minutes = self.solver.Value(task['start'])
                        end_minutes = self.solver.Value(task['end'])

                        result["schedules"].append({
                            "order_id": orders[order_idx].id,
                            "order_no": orders[order_idx].order_no,
                            "resource_id": resources[resource_idx].id,
                            "resource_name": resources[resource_idx].name,
                            "start_time": base_time + timedelta(minutes=start_minutes),
                            "end_time": base_time + timedelta(minutes=end_minutes),
                            "duration": task['duration']
                        })

            # 按开始时间排序
            result["schedules"].sort(key=lambda x: x["start_time"])

            logger.info(f"生成了 {len(result['schedules'])} 个排产计划")
            return result

        else:
            logger.error(f"求解失败! 状态: {status}")
            return {
                "status": "failed",
                "message": f"无法找到可行解，求解状态: {status}",
                "solve_time": solve_time
            }

    def save_results(self, result: dict, db: Session) -> list[int]:
        """保存排产结果到数据库"""
        if result.get("status") != "success":
            return []

        schedule_ids = []

        for schedule_data in result.get("schedules", []):
            schedule = Schedule(
                order_id=schedule_data["order_id"],
                resource_id=schedule_data["resource_id"],
                start_time=schedule_data["start_time"],
                end_time=schedule_data["end_time"],
                status="pending",
                config_snapshot=self.config
            )
            db.add(schedule)
            db.flush()
            schedule_ids.append(schedule.id)

        logger.info(f"保存了 {len(schedule_ids)} 个排产结果")
        return schedule_ids
