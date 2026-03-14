from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.domain import InternalBugLog
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bugs", tags=["bugs"])

class BugReportRequest(BaseModel):
    error_code: Optional[str] = None
    error_message: str
    stack_trace: Optional[str] = None
    url: Optional[str] = None
    route: Optional[str] = None
    frontend_version: Optional[str] = None
    additional_context: Optional[Dict[str, Any]] = None

@router.post("/report")
async def report_bug(
    request: BugReportRequest,
    req: Request,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests frontend or internal crashes into the bug tracking system
    to ensure operational visibility for the Antigravity engineering team.
    """
    try:
        # Extract user context if available from the request state or headers
        # Note: We keep this endpoint relatively open or loosely authenticated so it can catch login errors
        user_id = getattr(req.state, "user_id", None)
        org_id_str = getattr(req.state, "org_id", None)
        
        org_uuid = None
        if org_id_str:
            try:
                org_uuid = uuid.UUID(org_id_str)
            except ValueError:
                pass

        new_bug = InternalBugLog(
            org_id=org_uuid,
            user_id=user_id,
            error_code=request.error_code,
            error_message=request.error_message,
            stack_trace=request.stack_trace,
            url=request.url,
            route=request.route,
            frontend_version=request.frontend_version,
            additional_context=request.additional_context
        )
        
        db.add(new_bug)
        await db.commit()
        
        logger.error(f"Captured System Bug: {request.error_message} at {request.url}")
        
        return {"status": "success", "message": "Bug logged successfully", "id": str(new_bug.id)}
        
    except Exception as e:
        # If the bug logger itself fails, log to container stdout
        logger.critical(f"Failed to save bug report to DB: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal logging failure")
