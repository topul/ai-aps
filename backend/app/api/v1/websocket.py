from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.websocket import manager
import json
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket 主端点"""
    await manager.connect(websocket)

    try:
        # 发送欢迎消息
        await manager.send_personal_message(
            json.dumps({
                "type": "connected",
                "message": "WebSocket 连接成功"
            }),
            websocket
        )

        while True:
            # 接收客户端消息
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                message_type = message.get("type")

                if message_type == "subscribe":
                    # 订阅频道
                    channel = message.get("channel")
                    if channel:
                        await manager.subscribe(websocket, channel)
                        await manager.send_personal_message(
                            json.dumps({
                                "type": "subscribed",
                                "channel": channel
                            }),
                            websocket
                        )

                elif message_type == "unsubscribe":
                    # 取消订阅
                    channel = message.get("channel")
                    if channel:
                        await manager.unsubscribe(websocket, channel)
                        await manager.send_personal_message(
                            json.dumps({
                                "type": "unsubscribed",
                                "channel": channel
                            }),
                            websocket
                        )

                elif message_type == "ping":
                    # 心跳检测
                    await manager.send_personal_message(
                        json.dumps({"type": "pong"}),
                        websocket
                    )

                else:
                    # 未知消息类型
                    await manager.send_personal_message(
                        json.dumps({
                            "type": "error",
                            "message": f"未知消息类型: {message_type}"
                        }),
                        websocket
                    )

            except json.JSONDecodeError:
                await manager.send_personal_message(
                    json.dumps({
                        "type": "error",
                        "message": "无效的 JSON 格式"
                    }),
                    websocket
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket 客户端断开连接")

    except Exception as e:
        logger.error(f"WebSocket 错误: {str(e)}")
        manager.disconnect(websocket)


@router.websocket("/ws/scheduling/{task_id}")
async def websocket_scheduling_endpoint(websocket: WebSocket, task_id: str):
    """排产任务专用 WebSocket 端点"""
    await manager.connect(websocket)

    # 自动订阅排产频道
    await manager.subscribe(websocket, "scheduling")

    try:
        await manager.send_personal_message(
            json.dumps({
                "type": "connected",
                "message": f"已连接到排产任务 {task_id}",
                "task_id": task_id
            }),
            websocket
        )

        while True:
            # 保持连接，接收心跳
            data = await websocket.receive_text()
            message = json.loads(data)

            if message.get("type") == "ping":
                await manager.send_personal_message(
                    json.dumps({"type": "pong"}),
                    websocket
                )

    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info(f"排产任务 {task_id} WebSocket 断开")

    except Exception as e:
        logger.error(f"排产 WebSocket 错误: {str(e)}")
        manager.disconnect(websocket)
