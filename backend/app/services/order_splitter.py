from sqlalchemy.orm import Session
from app.models import Order, Resource, Product
from datetime import datetime, timedelta
import logging
import math

logger = logging.getLogger(__name__)


class OrderSplitter:
    """订单拆分引擎"""

    def __init__(self, db: Session):
        self.db = db

    def split_by_quantity(self, order: Order, num_splits: int) -> list[Order]:
        """
        按数量拆分：将订单平均拆分成N个子订单

        Args:
            order: 原始订单
            num_splits: 拆分数量

        Returns:
            子订单列表
        """
        if num_splits < 2:
            raise ValueError("拆分数量必须大于等于2")

        if order.is_split:
            raise ValueError("已拆分的订单不能再次拆分")

        # 计算每个子订单的数量
        base_quantity = order.quantity / num_splits
        sub_orders = []

        for i in range(num_splits):
            # 最后一个订单包含余数
            if i == num_splits - 1:
                quantity = order.quantity - (base_quantity * (num_splits - 1))
            else:
                quantity = base_quantity

            sub_order = Order(
                order_no=f"{order.order_no}-S{i+1}",
                product_id=order.product_id,
                quantity=quantity,
                priority=order.priority,
                due_date=order.due_date,
                status=order.status,
                parent_order_id=order.id,
                split_strategy="quantity",
                split_index=i + 1,
                is_split=True
            )
            sub_orders.append(sub_order)

        logger.info(f"订单 {order.order_no} 按数量拆分成 {num_splits} 个子订单")
        return sub_orders

    def split_by_resource_capacity(self, order: Order, resources: list[Resource]) -> list[Order]:
        """
        按资源能力拆分：根据资源产能自动拆分，优化并行度

        Args:
            order: 原始订单
            resources: 可用资源列表

        Returns:
            子订单列表
        """
        if order.is_split:
            raise ValueError("已拆分的订单不能再次拆分")

        if not resources:
            raise ValueError("没有可用资源")

        # 获取产品信息
        product = self.db.query(Product).filter(Product.id == order.product_id).first()
        if not product or not product.processing_time:
            raise ValueError("产品信息不完整")

        # 计算总产能
        total_capacity = sum(r.capacity for r in resources)

        # 根据资源产能比例分配订单数量
        sub_orders = []
        remaining_quantity = order.quantity

        for i, resource in enumerate(resources):
            # 计算该资源应分配的数量
            if i == len(resources) - 1:
                # 最后一个资源分配剩余数量
                quantity = remaining_quantity
            else:
                quantity = (order.quantity * resource.capacity) / total_capacity
                remaining_quantity -= quantity

            if quantity > 0:
                sub_order = Order(
                    order_no=f"{order.order_no}-R{i+1}",
                    product_id=order.product_id,
                    quantity=quantity,
                    priority=order.priority,
                    due_date=order.due_date,
                    status=order.status,
                    parent_order_id=order.id,
                    split_strategy="resource",
                    split_index=i + 1,
                    is_split=True
                )
                sub_orders.append(sub_order)

        logger.info(f"订单 {order.order_no} 按资源能力拆分成 {len(sub_orders)} 个子订单")
        return sub_orders

    def split_by_due_date(self, order: Order, urgent_ratio: float = 0.5) -> list[Order]:
        """
        按交期拆分：拆分成紧急和非紧急部分

        Args:
            order: 原始订单
            urgent_ratio: 紧急部分占比（0-1）

        Returns:
            子订单列表（2个：紧急+非紧急）
        """
        if order.is_split:
            raise ValueError("已拆分的订单不能再次拆分")

        if not 0 < urgent_ratio < 1:
            raise ValueError("紧急比例必须在0-1之间")

        # 计算紧急部分数量
        urgent_quantity = order.quantity * urgent_ratio
        normal_quantity = order.quantity - urgent_quantity

        # 计算交期（紧急部分提前，非紧急部分延后）
        now = datetime.now()
        time_to_due = (order.due_date - now).total_seconds() / 86400  # 转换为天数

        # 紧急订单交期提前1/3
        urgent_due = order.due_date - timedelta(days=time_to_due / 3)
        # 非紧急订单保持原交期
        normal_due = order.due_date

        sub_orders = [
            Order(
                order_no=f"{order.order_no}-U",  # Urgent
                product_id=order.product_id,
                quantity=urgent_quantity,
                priority=order.priority + 10,  # 提高优先级
                due_date=urgent_due,
                status=order.status,
                parent_order_id=order.id,
                split_strategy="due_date",
                split_index=1,
                is_split=True
            ),
            Order(
                order_no=f"{order.order_no}-N",  # Normal
                product_id=order.product_id,
                quantity=normal_quantity,
                priority=order.priority,
                due_date=normal_due,
                status=order.status,
                parent_order_id=order.id,
                split_strategy="due_date",
                split_index=2,
                is_split=True
            )
        ]

        logger.info(f"订单 {order.order_no} 按交期拆分成紧急和非紧急两部分")
        return sub_orders

    def auto_split(self, order: Order, context: dict = None) -> list[Order]:
        """
        智能拆分：综合考虑多种因素自动选择最优拆分策略

        Args:
            order: 原始订单
            context: 上下文信息（资源、其他订单等）

        Returns:
            子订单列表
        """
        if order.is_split:
            raise ValueError("已拆分的订单不能再次拆分")

        context = context or {}

        # 获取可用资源
        resources = context.get('resources') or self.db.query(Resource).all()

        # 获取产品信息
        product = self.db.query(Product).filter(Product.id == order.product_id).first()
        if not product or not product.processing_time:
            logger.warning(f"订单 {order.order_no} 产品信息不完整，使用默认拆分策略")
            return self.split_by_quantity(order, 2)

        # 计算订单总加工时间（小时）
        total_time = (product.processing_time * order.quantity) / 60

        # 计算距离交期的时间（天）
        now = datetime.now()
        days_to_due = (order.due_date - now).total_seconds() / 86400

        # 决策逻辑
        if days_to_due < 3:
            # 交期紧急：按交期拆分，优先完成部分订单
            logger.info(f"订单 {order.order_no} 交期紧急，采用交期拆分策略")
            return self.split_by_due_date(order, urgent_ratio=0.6)

        elif total_time > 24 and len(resources) >= 2:
            # 加工时间长且有多个资源：按资源能力拆分，提高并行度
            logger.info(f"订单 {order.order_no} 加工时间长，采用资源能力拆分策略")
            return self.split_by_resource_capacity(order, resources[:4])  # 最多4个资源

        elif order.quantity > 100:
            # 数量大：按数量拆分，便于管理
            num_splits = min(math.ceil(order.quantity / 50), 5)  # 每50件一个子订单，最多5个
            logger.info(f"订单 {order.order_no} 数量大，采用数量拆分策略（{num_splits}份）")
            return self.split_by_quantity(order, num_splits)

        else:
            # 默认：不拆分或简单拆分
            logger.info(f"订单 {order.order_no} 无需拆分")
            return [order]

    def merge_orders(self, sub_order_ids: list[int]) -> Order:
        """
        合并子订单（仅限同一父订单的子订单）

        Args:
            sub_order_ids: 子订单ID列表

        Returns:
            合并后的订单
        """
        sub_orders = self.db.query(Order).filter(Order.id.in_(sub_order_ids)).all()

        if not sub_orders:
            raise ValueError("未找到子订单")

        # 验证是否为同一父订单的子订单
        parent_ids = set(o.parent_order_id for o in sub_orders)
        if len(parent_ids) > 1 or None in parent_ids:
            raise ValueError("只能合并同一父订单的子订单")

        parent_id = parent_ids.pop()
        parent_order = self.db.query(Order).filter(Order.id == parent_id).first()

        if not parent_order:
            raise ValueError("未找到父订单")

        # 计算合并后的数量
        total_quantity = sum(o.quantity for o in sub_orders)

        # 创建合并订单
        merged_order = Order(
            order_no=f"{parent_order.order_no}-M",
            product_id=parent_order.product_id,
            quantity=total_quantity,
            priority=max(o.priority for o in sub_orders),  # 取最高优先级
            due_date=min(o.due_date for o in sub_orders),  # 取最早交期
            status=parent_order.status,
            parent_order_id=parent_id,
            split_strategy="merged",
            split_index=0,
            is_split=True
        )

        logger.info(f"合并 {len(sub_orders)} 个子订单为 {merged_order.order_no}")
        return merged_order
