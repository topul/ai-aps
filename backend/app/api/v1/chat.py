from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.chat_agent import ChatAgent
from pydantic import BaseModel
import asyncio
import logging

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
                async for chunk in agent.process_message_non_stream(chat_message.message, chat_message.context):
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
        )}

