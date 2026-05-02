"""
AI服务封装 - 支持多种大模型API
"""
from typing import AsyncIterator, Optional
import httpx
import json
import logging
from app.models.ai_config import AIConfig

logger = logging.getLogger(__name__)


class AIService:
    """AI服务基类"""

    def __init__(self, config: AIConfig):
        self.config = config
        self.provider = config.provider
        self.api_key = config.api_key
        self.api_base = config.api_base
        self.model = config.model
        self.parameters = config.parameters or {}

    async def chat(self, messages: list[dict], stream: bool = True) -> AsyncIterator[str]:
        """
        发送聊天请求

        Args:
            messages: 消息列表 [{"role": "user", "content": "..."}]
            stream: 是否流式返回

        Yields:
            响应文本片段
        """
        raise NotImplementedError


class ClaudeService(AIService):
    """Claude API服务"""

    def __init__(self, config: AIConfig):
        super().__init__(config)
        self.api_base = config.api_base or "https://api.anthropic.com"

    async def chat(self, messages: list[dict], stream: bool = True) -> AsyncIterator[str]:
        """调用Claude API"""
        url = f"{self.api_base}/v1/messages"

        headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": messages,
            "max_tokens": self.parameters.get("max_tokens", 4096),
            "temperature": self.parameters.get("temperature", 1.0),
            "stream": stream,
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                if stream:
                    async with client.stream("POST", url, headers=headers, json=payload) as response:
                        response.raise_for_status()

                        async for line in response.aiter_lines():
                            if line.startswith("data: "):
                                data = line[6:]
                                if data == "[DONE]":
                                    break

                                try:
                                    event = json.loads(data)
                                    if event.get("type") == "content_block_delta":
                                        delta = event.get("delta", {})
                                        if delta.get("type") == "text_delta":
                                            yield {"type": "content", "content": delta.get("text", "")}
                                except json.JSONDecodeError:
                                    continue
                else:
                    response = await client.post(url, headers=headers, json=payload)
                    response.raise_for_status()
                    result = response.json()
                    content = result.get("content", [])
                    if content:
                        yield {"type": "content", "content": content[0].get("text", "")}

        except httpx.HTTPError as e:
            logger.error(f"Claude API错误: {e}")
            yield {"type": "content", "content": f"[错误] Claude API调用失败: {str(e)}"}
        except Exception as e:
            logger.error(f"未知错误: {e}")
            yield {"type": "content", "content": f"[错误] {str(e)}"}


class AIServiceFactory:
    """AI服务工厂"""

    @staticmethod
    def create(config: AIConfig) -> AIService:
        """根据配置创建AI服务实例"""
        if config.provider == "claude":
            return ClaudeService(config)
        elif config.provider == "openai":
            return OpenAIService(config)
        elif config.provider == "custom":
            return CustomAPIService(config)
        else:
            raise ValueError(f"不支持的AI提供商: {config.provider}")


async def get_ai_response(
    config: AIConfig,
    messages: list[dict],
    stream: bool = True
) -> AsyncIterator[dict]:
    """
    获取AI响应的便捷函数

    Args:
        config: AI配置
        messages: 消息列表
        stream: 是否流式返回

    Yields:
        dict: {"type": "content"/"reasoning", "content": "..."}
    """
    service = AIServiceFactory.create(config)
    async for chunk in service.chat(messages, stream):
        yield chunk
