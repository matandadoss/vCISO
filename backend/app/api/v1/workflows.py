from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import datetime
import uuid

from app.models.domain import WorkflowName

router = APIRouter(prefix="/workflows", tags=["workflows"])

# Mock state for demonstration
WORKFLOW_STATE = {
    w.value: {
        "id": w.value,
        "name": w.value.replace("_", " ").title(),
        "status": "idle",
        "last_run": (datetime.datetime.utcnow() - datetime.timedelta(hours=2)).isoformat(),
        "enabled": True,
        "description": f"Automated ingestion pipeline for {w.value.replace('_', ' ')} logic."
    } for w in WorkflowName
}

class WorkflowStatusResponse(BaseModel):
    id: str
    name: str
    status: str
    last_run: Optional[str]
    enabled: bool
    description: str

@router.get("/", response_model=List[WorkflowStatusResponse])
async def list_workflows():
    return list(WORKFLOW_STATE.values())

async def mock_workflow_execution(workflow_name: str):
    import asyncio
    await asyncio.sleep(5)
    if workflow_name in WORKFLOW_STATE:
        WORKFLOW_STATE[workflow_name]["status"] = "idle"
        WORKFLOW_STATE[workflow_name]["last_run"] = datetime.datetime.utcnow().isoformat()

@router.post("/{workflow_id}/run")
async def run_workflow(workflow_id: str, background_tasks: BackgroundTasks):
    if workflow_id not in WORKFLOW_STATE:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    if WORKFLOW_STATE[workflow_id]["status"] == "running":
        return {"status": "already_running", "workflow_id": workflow_id}
        
    WORKFLOW_STATE[workflow_id]["status"] = "running"
    
    # Normally this would initialize the class from app.services.workflows
    # e.g., processor = ComplianceWorkflow(db, graph)
    # background_tasks.add_task(processor.execute, org_id="default")
    
    background_tasks.add_task(mock_workflow_execution, workflow_id)
    
    return {"status": "started", "workflow_id": workflow_id}

@router.post("/{workflow_id}/toggle")
async def toggle_workflow(workflow_id: str):
    if workflow_id not in WORKFLOW_STATE:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    current = WORKFLOW_STATE[workflow_id]["enabled"]
    WORKFLOW_STATE[workflow_id]["enabled"] = not current
    return {"status": "success", "enabled": not current}
