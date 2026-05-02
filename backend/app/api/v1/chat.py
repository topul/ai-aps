from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.chat_agent import ChatAgent
from app.services.ai_service import get_ai_response
from pydantic import BaseModel
import asyncio
import logging
import json

router = APIRouter()
logger = logging.getLogger(__name__)


class ChatMessage(BaseModel):
    message: str
    context: dict | None = None


@router.post("/message")
async def send_message(
    chat_message: ChatMessage,
    db: Session = Depends(get_db)
):
    """发送聊天消息（流式响应）"""
    try:
        agent = ChatAgent(db)

        async def generate():
            try:
                async for chunk in agent.process_message(chat_message.message, chat_message.context):
                    yield f"data: {chunk}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"生成响应失败: {str(e)}")
                yield f"data: 错误: {str(e)}\n\n"
                yield "data: [DONE]\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )

    except ValueError as e:
        # LLM API 未配置
        logger.warning(f"LLM API 未配置: {str(e)}")

        async def fallback_generate():
            fallback_message = """抱歉，AI 对话功能需要配置 LLM API 密钥。

请在 .env 文件中配置以下环境变量之一:
- ANTHROPIC_API_KEY (使用 Claude)
- OPENAI_API_KEY (使用 GPT-4)

配置后重启服务即可使用 AI 对话功能。

当前您可以:
1. 访问"数据管理"页面查看订单和资源
2. 访问"智能排产"页面执行排产
3. 查看排产结果和分析报告"""

            for char in fallback_message:
                yield f"data: {char}\n\n"
                await asyncio.sleep(0.01)
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            fallback_generate(),
            media_type="text/event-stream"
        )

    except Exception as e:
        logger.error(f"处理消息失败: {str(e)}")

        async def error_generate():
            error_message = f"抱歉，处理您的请求时出现错误: {str(e)}"
            for char in error_message:
                yield f"data: {char}\n\n"
                await asyncio.sleep(0.01)
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            error_generate(),
            media_type="text/event-stream"
        )


@router.post("/message/sync")
def send_message_sync(
    chat_message: ChatMessage,
    db: Session = Depends(get_db)
):
    """发送聊天消息（同步响应）"""
    try:
        agent = ChatAgent(db)
        response = agent.process_message_sync(chat_message.message, chat_message.context)
        return {"response": response}

    except ValueError as e:
        return {
            "response": "AI 对话功能需要配置 LLM API 密钥。请在 .env 文件中配置 ANTHROPIC_API_KEY 或 OPENAI_API_KEY。"
        }

    except Exception as e:
        logger.error(f"处理消息失败: {str(e)}")
        return {"response": f"抱歉，处理您的请求时出现错误: {str(e)}"}


@router.post("/message/stream")
async def send_message_stream(
    chat_message: ChatMessage,
    db: Session = Depends(get_db)
):
    """发送聊天消息（流式响应）"""
    try:
        agent = ChatAgent(db)

        async def generate():
            try:
                full_response = ""
                intent = agent._classify_intent(chat_message.message)
                system_context = agent._get_system_context()
                user_context = ""

                if intent == "query":
                    data = agent._query_data(chat_message.message)
                    user_context = f"\n\n相关数据:\n{json.dumps(data, ensure_ascii=False, indent=2)}"
                elif intent == "analyze":
                    analysis = agent._analyze_data()
                    user_context = f"\n\n分析结果:\n{json.dumps(analysis, ensure_ascii=False, indent=2)}"

                messages = [
                    {"role": "system", "content": system_context},
                    {"role": "user", "content": chat_message.message + user_context}
                ]

                async for chunk in get_ai_response(agent.ai_config, messages, stream=True):
                    if isinstance(chunk, dict):
                        if chunk.get("type") == "reasoning":
                            yield f"data: [REASONING] {chunk['content']}\n\n"
                        elif chunk.get("type") == "content":
                            full_response += chunk["content"]
                            yield f"data: {chunk['content']}\n\n"
                    else:
                        full_response += chunk
                        yield f"data: {chunk}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as e:
                logger.error(f"生成响应失败: {str(e)}")
                yield f"data: 错误: {str(e)}\n\n"
                yield "data: [DONE]\n\n"

        return StreamingResponse(
            generate(),
            media_type="text/event-stream"
        )

    except ValueError as e:
        async def fallback_generate():
            for char in "AI 对话功能需要配置 LLM API 密钥。请在用户中心配置AI服务。":
                yield f"data: {char}\n\n"
                await asyncio.sleep(0.02)
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            fallback_generate(),
            media_type="text/event-stream"
        )

    except Exception as e:
        async def error_generate():
            for char in f"抱歉，处理您的请求时出现错误: {str(e)}":
                yield f"data: {char}\n\n"
                await asyncio.sleep(0.02)
            yield "data: [DONE]\n\n"

        return StreamingResponse(
            error_generate(),
            media_type="text/event-stream"
        )

