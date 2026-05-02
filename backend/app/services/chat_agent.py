from sqlalchemy.orm import Session
from app.models import Order, Resource, Schedule
from app.models.ai_config import AIConfig
from app.services.analyzer import ScheduleAnalyzer
from app.services.ai_service import get_ai_response
import json
import logging

logger = logging.getLogger(__name__)


class ChatAgent:
    """AI 对话代理 - 使用配置化的AI服务"""

    def __init__(self, db: Session, ai_config: AIConfig = None):
        self.db = db
        self.ai_config = ai_config

        # 如果没有指定配置，使用默认配置
        if not self.ai_config:
            self.ai_config = db.query(AIConfig).filter(AIConfig.is_default == True).first()
            if not self.ai_config:
                raise ValueError("未找到默认AI配置，请先配置AI服务")

    def _get_system_context(self) -> str:
        """获取系统上下文"""
        from app.models import Order, Resource, Schedule
        from sqlalchemy import func
        
        orders_count = self.db.query(func.count(Order.id)).scalar() or 0
        resources_count = self.db.query(func.count(Resource.id)).scalar() or 0
        schedules_count = self.db.query(func.count(Schedule.id)).scalar() or 0

        context = f"""你是一个智能排产系统(AI-APS)的 AI 助手。

## 系统介绍
AI-APS 是一个基于 Google OR-Tools 约束编程算法的智能排产系统，专门用于解决工厂车间的生产调度问题。

## 核心功能
1. **订单管理**: 管理生产订单，支持优先级、数量、截止日期等属性
2. **资源管理**: 管理生产线、设备、工序等生产资源
3. **BOM管理**: 物料清单管理，支持多级BOM结构
4. **工艺路线**: 管理产品加工工艺和工序顺序
5. **智能排产**: 基于or-tools算法进行约束优化排产
6. **拆单策略**: 支持优先拆单、均匀拆单、滚动拆单等策略
7. **滚动排产**: 支持动态调整和重新排产

## 技术栈
- 前端: React + TypeScript + TailwindCSS
- 后端: FastAPI + SQLAlchemy + PostgreSQL
- 调度算法: Google OR-Tools (CP-SAT)
- AI模型: 支持OpenAI/Anthropic/Custom API

## 当前系统状态
- 订单数量: {orders_count}
- 资源数量: {resources_count}
- 排产结果数量: {schedules_count}

## 回答规范
1. 只回答与排产系统相关的问题
2. 对于非系统问题，回复"抱歉，我只了解智能排产系统相关的问题"
3. 使用简洁、专业的语言
4. 涉及数据时基于当前系统状态回答
5. 可以提供排产建议和优化方案"""

        return context

    def _classify_intent(self, message: str) -> str:
        """分类用户意图"""
        message_lower = message.lower()

        # 查询意图
        if any(keyword in message_lower for keyword in ['查询', '查看', '显示', '有多少', '列出']):
            return "query"

        # 分析意图
        if any(keyword in message_lower for keyword in ['分析', '统计', '利用率', '准时率', '瓶颈']):
            return "analyze"

        # 排产意图
        if any(keyword in message_lower for keyword in ['排产', '调度', '安排', '计划', '拆单', '滚动']):
            return "schedule"

        # 解释意图
        if any(keyword in message_lower for keyword in ['为什么', '原因', '解释']):
            return "explain"

        # 默认为一般对话
        return "chat"

    def _query_data(self, message: str) -> dict:
        """查询数据"""
        result = {}

        if "订单" in message:
            orders = self.db.query(Order).limit(10).all()
            result["orders"] = [
                {
                    "order_no": o.order_no,
                    "quantity": o.quantity,
                    "priority": o.priority,
                    "status": o.status,
                    "is_split": o.is_split,
                    "split_strategy": o.split_strategy
                }
                for o in orders
            ]

        if "资源" in message:
            resources = self.db.query(Resource).limit(10).all()
            result["resources"] = [
                {
                    "resource_code": r.resource_code,
                    "name": r.name,
                    "type": r.type,
                    "status": r.status
                }
                for r in resources
            ]

        if "排产" in message or "结果" in message:
            schedules = self.db.query(Schedule).limit(10).all()
            result["schedules"] = [
                {
                    "order_id": s.order_id,
                    "resource_id": s.resource_id,
                    "start_time": s.start_time.isoformat(),
                    "end_time": s.end_time.isoformat()
                }
                for s in schedules
            ]

        return result

    def _analyze_data(self) -> dict:
        """分析排产数据"""
        schedules = self.db.query(Schedule).all()
        if not schedules:
            return {"message": "暂无排产结果可分析"}

        analyzer = ScheduleAnalyzer(self.db)
        schedule_ids = [s.id for s in schedules]
        analysis = analyzer.analyze(schedule_ids)

        return analysis

    async def process_message(self, message: str, context: dict = None):
        """处理用户消息（流式响应）"""
        try:
            # 分类意图
            intent = self._classify_intent(message)
            logger.info(f"用户意图: {intent}, AI配置: {self.ai_config.name}")

            # 准备上下文
            system_context = self._get_system_context()
            user_context = ""

            # 根据意图获取相关数据
            if intent == "query":
                data = self._query_data(message)
                user_context = f"\n\n相关数据:\n{json.dumps(data, ensure_ascii=False, indent=2)}"

            elif intent == "analyze":
                analysis = self._analyze_data()
                user_context = f"\n\n分析结果:\n{json.dumps(analysis, ensure_ascii=False, indent=2)}"

            # 构建消息列表
            messages = [
                {"role": "system", "content": system_context},
                {"role": "user", "content": message + user_context}
            ]

            # 使用新的AI服务
            async for chunk in get_ai_response(self.ai_config, messages, stream=True):
                yield chunk

        except Exception as e:
            logger.error(f"处理消息失败: {str(e)}")
            yield f"\n\n抱歉，处理您的请求时出现错误: {str(e)}"

    async def process_message_non_stream(self, message: str, context: dict = None) -> str:
        """处理用户消息（非流式）"""
        try:
            # 分类意图
            intent = self._classify_intent(message)

            # 准备上下文
            system_context = self._get_system_context()
            user_context = ""

            # 根据意图获取相关数据
            if intent == "query":
                data = self._query_data(message)
                user_context = f"\n\n相关数据:\n{json.dumps(data, ensure_ascii=False, indent=2)}"

            elif intent == "analyze":
                analysis = self._analyze_data()
                user_context = f"\n\n分析结果:\n{json.dumps(analysis, ensure_ascii=False, indent=2)}"

            # 构建消息列表
            messages = [
                {"role": "system", "content": system_context},
                {"role": "user", "content": message + user_context}
            ]

            # 使用新的AI服务（非流式）
            response_text = ""
            async for chunk in get_ai_response(self.ai_config, messages, stream=False):
                response_text += chunk

            return response_text

        except Exception as e:
            logger.error(f"处理消息失败: {str(e)}")
            return f"抱歉，处理您的请求时出现错误: {str(e)}"

    def process_message_sync(self, message: str, context: dict = None) -> str:
        """同步版本 - 处理用户消息"""
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                result = []
                async def get_result():
                    result.append(await self.process_message_non_stream(message, context))
                asyncio.create_task(get_result())
                import time
                time.sleep(0.5)
                return result[0] if result else "处理中..."
        except:
            pass
        
        # Fallback: 非异步调用
        try:
            intent = self._classify_intent(message)
            system_context = self._get_system_context()
            user_context = ""

            if intent == "query":
                data = self._query_data(message)
                user_context = f"\n\n相关数据:\n{json.dumps(data, ensure_ascii=False, indent=2)}"
            elif intent == "analyze":
                analysis = self._analyze_data()
                user_context = f"\n\n分析结果:\n{json.dumps(analysis, ensure_ascii=False, indent=2)}"

            messages = [
                {"role": "system", "content": system_context},
                {"role": "user", "content": message + user_context}
            ]

            response_text = ""
            import asyncio
            async def get_response():
                nonlocal response_text
                async for chunk in get_ai_response(self.ai_config, messages, stream=False):
                    response_text += chunk
            
            asyncio.run(get_response())
            return response_text
        except Exception as e:
            logger.error(f"处理消息失败: {str(e)}")
            return f"抱歉，处理您的请求时出现错误: {str(e)}"
