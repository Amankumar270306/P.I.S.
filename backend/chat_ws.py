from typing import List, Dict
from fastapi import WebSocket
import json

class ConnectionManager:
    """
    Manages active WebSocket connections for chat.
    """
    def __init__(self):
        # active_connections: Dict[channel_id, List[WebSocket]]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, channel_id: str):
        await websocket.accept()
        if channel_id not in self.active_connections:
            self.active_connections[channel_id] = []
        self.active_connections[channel_id].append(websocket)
        print(f"Client connected to channel {channel_id}")

    def disconnect(self, websocket: WebSocket, channel_id: str):
        if channel_id in self.active_connections:
            if websocket in self.active_connections[channel_id]:
                self.active_connections[channel_id].remove(websocket)
            if not self.active_connections[channel_id]:
                del self.active_connections[channel_id]
        print(f"Client disconnected from channel {channel_id}")

    async def broadcast(self, message: dict, channel_id: str):
        """
        Broadcasts a message to all connected clients in a specific channel.
        """
        if channel_id in self.active_connections:
            for connection in self.active_connections[channel_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    print(f"Error sending message: {e}")

manager = ConnectionManager()
