from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.domain import Severity

router = APIRouter(prefix="/findings", tags=["findings"])

class FindingResponse(BaseModel):
    id: str
    title: str
    severity: Severity
    risk_score: float
    status: str
    detected_at: datetime
    affected_asset_ids: list[str] = []

@router.get("")
async def list_findings(
    org_id: str,
    severity: Optional[Severity] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    # Stub: return mock data
    return {
        "items": [
            {
                "id": str(uuid.uuid4()),
                "title": "Unpatched Server",
                "severity": Severity.high,
                "risk_score": 82.5,
                "status": "new",
                "detected_at": datetime.utcnow().isoformat(),
                "affected_asset_ids": ["server-1"]
            }
        ],
        "total": 1,
        "limit": limit,
        "offset": offset
    }

@router.get("/{finding_id}")
async def get_finding(finding_id: str, org_id: str):
    return {
        "id": finding_id,
        "title": "Unpatched Server",
        "severity": Severity.high,
        "risk_score": 82.5,
        "status": "new",
        "description": "Server is missing critical OS patches.",
        "detected_at": datetime.utcnow().isoformat()
    }

@router.patch("/{finding_id}/status")
async def update_finding_status(finding_id: str, status: str, org_id: str):
    return {"status": "success", "new_status": status}
