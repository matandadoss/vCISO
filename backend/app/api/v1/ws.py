from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
import json
import asyncio
from typing import Dict, List

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Maps org_id -> List of WebSockets
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, org_id: str):
        await websocket.accept()
        if org_id not in self.active_connections:
            self.active_connections[org_id] = []
        self.active_connections[org_id].append(websocket)

    def disconnect(self, websocket: WebSocket, org_id: str):
        if org_id in self.active_connections:
            self.active_connections[org_id].remove(websocket)
            if not self.active_connections[org_id]:
                del self.active_connections[org_id]

    async def broadcast_to_org(self, message: str, org_id: str):
        if org_id in self.active_connections:
            for connection in self.active_connections[org_id]:
                try:
                    await connection.send_text(message)
                except Exception:
                    # Handle disconnected clients
                    import logging
                    logging.getLogger(__name__).debug("Client disconnected or error sending message")

manager = ConnectionManager()

# Ideally get_current_user logic goes here for org authentication parameter
@router.websocket("/ws/findings-feed/{org_id}")
async def findings_feed_endpoint(websocket: WebSocket, org_id: str):
    await manager.connect(websocket, org_id)
    try:
        while True:
            # Client could send filter parameters here, wait for incoming
            data = await websocket.receive_text()
            # Send ack
            await websocket.send_text(f"Ack: Set filters to {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket, org_id)

@router.websocket("/ws/dashboard-updates/{org_id}")
async def dashboard_updates_endpoint(websocket: WebSocket, org_id: str):
    await manager.connect(websocket, org_id)
    try:
        while True:
            # Heartbeats / explicit pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, org_id)
