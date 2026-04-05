from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict
import json
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        # 存储活跃的 WebSocket 连接
        self.active_connections: List[WebSocket] = []
        # 存储用户订阅的频道
        self.subscriptions: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket):
        """接受新的 WebSocket 连接"""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"新的 WebSocket 连接，当前连接数: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """断开 WebSocket 连接"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        # 从所有订阅中移除
        for channel in self.subscriptions:
            if websocket in self.subscriptions[channel]:
                self.subscriptions[channel].remove(websocket)

        logger.info(f"WebSocket 连接断开，当前连接数: {len(self.active_connections)}")

    async def send_personal_message(self, message: str, websocket: WebSocket):
        """发送个人消息"""
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"发送个人消息失败: {str(e)}")

    async def broadcast(self, message: str):
        """广播消息给所有连接"""
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"广播消息失败: {str(e)}")
                disconnected.append(connection)

        # 清理断开的连接
        for connection in disconnected:
            self.disconnect(connection)

    async def subscribe(self, websocket: WebSocket, channel: str):
        """订阅频道"""
        if channel not in self.subscriptions:
            self.subscriptions[channel] = []

        if websocket not in self.subscriptions[channel]:
            self.subscriptions[channel].append(websocket)
            logger.info(f"WebSocket 订阅频道: {channel}")

    async def unsubscribe(self, websocket: WebSocket, channel: str):
        """取消订阅频道"""
        if channel in self.subscriptions and websocket in self.subscriptions[channel]:
            self.subscriptions[channel].remove(websocket)
            logger.info(f"WebSocket 取消订阅频道: {channel}")

    async def broadcast_to_channel(self, channel: str, message: str):
        """向特定频道广播消息"""
        if channel not in self.subscriptions:
            return

        disconnected = []
        for connection in self.subscriptions[channel]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"向频道 {channel} 广播消息失败: {str(e)}")
                disconnected.append(connection)

        # 清理断开的连接
        for connection in disconnected:
            self.disconnect(connection)

    async def send_scheduling_progress(self, task_id: str, progress: dict):
        """发送排产进度更新"""
        message = json.dumps({
            "type": "scheduling_progress",
            "task_id": task_id,
            "data": progress
        })
        await self.broadcast_to_channel("scheduling", message)

    async def send_scheduling_complete(self, task_id: str, result: dict):
        """发送排产完成通知"""
        message = json.dumps({
            "type": "scheduling_complete",
            "task_id": task_id,
            "data": result
        })
        await self.broadcast_to_channel("scheduling", message)

    async def send_data_update(self, data_type: str, action: str, data: dict):
        """发送数据更新通知"""
        message = json.dumps({
            "type": "data_update",
            "data_type": data_type,
            "action": action,  # create, update, delete
            "data": data
        })
        await self.broadcast_to_channel("data", message)


# 全局连接管理器实例
manager = ConnectionManager()
