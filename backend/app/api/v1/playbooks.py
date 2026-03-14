from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import uuid
import datetime

router = APIRouter(prefix="/playbooks", tags=["playbooks"])

# In-memory mock audit trail for demonstration
MOCK_AUDIT_TRAIL = [
    {
        "id": "playbook-exec-1234",
        "action_name": "Block Malicious IP",
        "target": "198.51.100.42",
        "status": "success",
        "executed_by": "Automated Response (Confidence: 98%)",
        "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(hours=2)).isoformat(),
        "details": "Added drop rule to perimeter firewall for known C2 node."
    },
    {
        "id": "playbook-exec-1235",
        "action_name": "Isolate Endpoint",
        "target": "user-laptop-04",
        "status": "pending",
        "executed_by": "SOC Analyst (matan@vciso.local)",
        "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(minutes=15)).isoformat(),
        "details": "MFA spam detected, isolating host pending investigation."
    }
]

class ExecutionRequest(BaseModel):
    action_name: str
    target: str
    parameters: Optional[dict] = None

@router.post("/execute")
async def execute_playbook(request: ExecutionRequest):
    # Mocking execution delay
    import asyncio
    await asyncio.sleep(1.5)
    
    new_log = {
        "id": f"playbook-exec-{uuid.uuid4().hex[:8]}",
        "action_name": request.action_name,
        "target": request.target,
        "status": "success",
        "executed_by": "Current User (matan@vciso.local)",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "details": f"Successfully executed playbook: {request.action_name} against {request.target}"
    }
    
    # Store in memory for this session
    MOCK_AUDIT_TRAIL.insert(0, new_log)
    
    return {"status": "success", "log": new_log}

@router.get("/audit")
async def get_audit_trail():
    return {"audit_trail": MOCK_AUDIT_TRAIL}
