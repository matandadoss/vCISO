from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional
import uuid
from datetime import datetime
from app.core.auth import get_current_user
from fastapi import HTTPException

from app.services.chat_service import ChatService
from app.correlation.llm_engine import LLMCorrelationEngine
from app.core.dependencies import get_ai_client, get_query_router, get_cost_tracker
from app.core.rate_limit import limiter
from fastapi import Request

router = APIRouter(prefix="/chat", tags=["chat"])

class NewSessionRequest(BaseModel):
    org_id: str
    initial_message: Optional[str] = Field(None, max_length=1500)

class MessageRequest(BaseModel):
    content: str = Field(..., max_length=1500)
    org_id: str
    page_context: Optional[str] = Field(None, max_length=5000)

def get_chat_service(
    ai_client=Depends(get_ai_client),
    query_router=Depends(get_query_router),
    cost_tracker=Depends(get_cost_tracker)
) -> ChatService:
    llm = LLMCorrelationEngine(ai_client, query_router, db=None)
    return ChatService(llm, query_router, cost_tracker, db=None)

@router.post("/sessions")
async def create_session(request: NewSessionRequest, current_user: dict = Depends(get_current_user)):
    if str(request.org_id) != str(current_user.get("org_id")):
        raise HTTPException(status_code=403, detail="Unauthorized")
    return {
        "session_id": str(uuid.uuid4()),
        "created_at": datetime.utcnow().isoformat()
    }

@router.get("/sessions")
async def list_sessions(org_id: str, current_user: dict = Depends(get_current_user)):
    if str(org_id) != str(current_user.get("org_id")):
        raise HTTPException(status_code=403, detail="Unauthorized")
    return {
        "sessions": [
            {
                "session_id": str(uuid.uuid4()),
                "title": "Discussion on recent vulnerabilities",
                "last_message_at": datetime.utcnow().isoformat(),
                "message_count": 5,
                "total_cost_usd": 0.05
            }
        ]
    }

@router.get("/sessions/{session_id}/messages")
async def get_messages(session_id: str):
    return {"messages": []}

@router.post("/sessions/{session_id}/messages")
async def send_message_sync(session_id: str, request: MessageRequest, service: ChatService = Depends(get_chat_service)):
    # Standard sync implementation
    return {
        "id": str(uuid.uuid4()),
        "content": "A synchronous response to your inquiry.",
        "tier_used": "search_only",
        "cost_usd": 0.0,
        "routing_reason": "Matched standard sync query"
    }

@router.post("/sessions/{session_id}/stream")
@limiter.limit("10/minute")
async def send_message_stream(request: Request, session_id: str, payload: MessageRequest, service: ChatService = Depends(get_chat_service)):
    return StreamingResponse(
        service.handle_message(session_id, payload.content, payload.org_id, page_context=payload.page_context),
        media_type="text/event-stream"
    )

@router.get("/suggestions")
async def get_suggestions(org_id: str, current_user: dict = Depends(get_current_user)):
    if str(org_id) != str(current_user.get("org_id")):
        raise HTTPException(status_code=403, detail="Unauthorized")
    return [
        {"text": "How many critical findings are open right now?", "tier": "search_only"},
        {"text": "Which assets are overdue on SLA?", "tier": "search_only"},
        {"text": "Summarize my biggest risks this week", "tier": "fast_cheap"},
        {"text": "What changed in my compliance posture?", "tier": "fast_cheap"},
        {"text": "Do my dark web alerts relate to any open CVEs?", "tier": "balanced"},
        {"text": "What should I prioritize fixing this sprint?", "tier": "deep"},
    ]
