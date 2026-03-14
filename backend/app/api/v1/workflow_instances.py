from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, Any, List
from pydantic import BaseModel
import uuid

from app.db.session import get_db
from app.models.workflows import WorkflowInstance, WorkflowTask
from app.models.domain import WorkflowName
from app.services.workflow_engine import WorkflowEngine

router = APIRouter(prefix="/workflow-instances", tags=["workflow_instances"])

class WorkflowStartRequest(BaseModel):
    org_id: str
    workflow_name: WorkflowName
    entity_id: str
    entity_type: str
    initial_step: str
    initial_data: Dict[str, Any] = {}

class WorkflowTransitionRequest(BaseModel):
    action: str = "auto"
    result_data: Dict[str, Any] = {}

@router.post("", response_model=dict)
async def start_workflow(request: WorkflowStartRequest, db: AsyncSession = Depends(get_db)):
    """Starts a new workflow execution."""
    try:
         instance = await WorkflowEngine.start_workflow(
             db=db,
             org_id=request.org_id,
             workflow_name=request.workflow_name,
             entity_id=request.entity_id,
             entity_type=request.entity_type,
             initial_step=request.initial_step,
             initial_data=request.initial_data
         )
         return {
             "id": str(instance.id),
             "status": instance.status,
             "current_step": instance.current_step
         }
    except Exception as e:
         raise HTTPException(status_code=400, detail=str(e))

@router.post("/{instance_id}/transition", response_model=dict)
async def transition_workflow(instance_id: str, request: WorkflowTransitionRequest, db: AsyncSession = Depends(get_db)):
    """Transitions a workflow to the next logical step according to the state machine."""
    try:
         instance = await WorkflowEngine.transition_state(
             db=db,
             instance_id=instance_id,
             action=request.action,
             result_data=request.result_data
         )
         return {
             "id": str(instance.id),
             "status": instance.status,
             "current_step": instance.current_step,
             "state_data": instance.state_data
         }
    except Exception as e:
         raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=dict)
async def list_workflows(org_id: str, db: AsyncSession = Depends(get_db)):
    """Lists all active workflow instances for an organization."""
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    result = await db.execute(select(WorkflowInstance).where(WorkflowInstance.org_id == org_uuid))
    instances = result.scalars().all()
    
    return {
        "items": [
            {
                "id": str(inst.id),
                "workflow_name": inst.workflow_name,
                "entity_id": inst.entity_id,
                "current_step": inst.current_step,
                "status": inst.status,
                "started_at": inst.started_at
            } for inst in instances
        ]
    }
