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
        # 获取当前系统状态
        orders_count = self.db.query(Order).count()
        resources_count = self.db.query(Resource).count()
        schedules_count = self.db.query(Schedule).count()

        context = f"""你是一个智能排产系统的 AI 助手。

当前系统状态:
- 订单数量: {orders_count}
- 资源数量: {resources_count}
- 排产结果数量: {schedules_count}

你可以帮助用户:
1. 查询订单、资源、排产结果等信息
2. 分析排产结果（资源利用率、准时率等）
3. 解释排产决策
4. 提供排产建议
5. 解答拆单和滚动排产相关问题

请用简洁、专业的语言回答用户问题。"""

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
