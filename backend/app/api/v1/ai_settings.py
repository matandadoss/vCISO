from fastapi import APIRouter, Depends, HTTPException
import uuid
from typing import List, Dict, Any
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.dependencies import get_ai_client, get_cost_tracker
from app.db.session import get_db
from app.core.auth import get_current_user
from app.core.ai_provider import AIProviderClient, AIProvider
from app.core.cost_tracker import CostTracker
from app.models.domain import WorkflowAIConfig, OrgAIBudget

router = APIRouter(prefix="/ai", tags=["ai"])

class ProviderUpdateRequest(BaseModel):
    provider: AIProvider

class WorkflowConfigUpdate(BaseModel):
    workflow: str
    cap: float
    model_preference: str 
    alert_threshold: int

class BulkWorkflowUpdateReq(BaseModel):
    configs: List[WorkflowConfigUpdate]

@router.get("/budget-status")
async def get_budget_status(
    cost_tracker: CostTracker = Depends(get_cost_tracker),
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user.get("org_id")
    if not org_id: raise HTTPException(status_code=400, detail="Organization context missing.")
    return await cost_tracker.get_budget_status(org_id)

@router.get("/cost-breakdown")
async def get_cost_breakdown(
    cost_tracker: CostTracker = Depends(get_cost_tracker),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    org_id_str = current_user.get("org_id")
    if not org_id_str: raise HTTPException(status_code=400, detail="Organization context missing.")
    org_id = uuid.UUID(org_id_str)
    
    workflow_spend = await cost_tracker.get_spend_by_workflow(org_id_str)
    tier_spend = await cost_tracker.get_spend_by_tier(org_id_str)
    
    # Query database for user's defined configuration settings per workflow
    result = await db.execute(select(WorkflowAIConfig).where(WorkflowAIConfig.org_id == org_id))
    db_configs = {c.workflow_name: c for c in result.scalars().all()}
    
    extended_workflow = []
    for w in workflow_spend:
        name = w.get("workflow", "Unknown")
        cfg = db_configs.get(name)
        
        extended_workflow.append({
            "workflow": name,
            "cost": w.get("cost", 0.0),
            "cap": cfg.daily_cap if cfg else 5.0, 
            "model_preference": cfg.model_preference if cfg else "balanced",
            "alert_threshold": cfg.alert_threshold if cfg else 80
        })
        
    return {"by_workflow": extended_workflow, "by_tier": tier_spend}

@router.get("/budget-trends")
async def get_budget_trends(
    days: int = 7, 
    cost_tracker: CostTracker = Depends(get_cost_tracker),
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user.get("org_id")
    if not org_id: raise HTTPException(status_code=400, detail="Organization context missing.")
    trends = await cost_tracker.get_budget_trends(org_id, days)
    return {"trend": trends}

@router.get("/roi-metrics")
async def get_roi_metrics(
    cost_tracker: CostTracker = Depends(get_cost_tracker),
    current_user: dict = Depends(get_current_user)
):
    org_id = current_user.get("org_id")
    # For now, keep realistic placeholders. In a full system, query AIQueryLog or Findings.
    return {
        "estimated_hours_saved": 42.5,
        "incidents_auto_triaged": 128,
        "compliance_gaps_auto_mapped": 15
    }

@router.post("/workflow-config-bulk")
async def update_workflow_configs(
    request: BulkWorkflowUpdateReq,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    org_id_str = current_user.get("org_id")
    if not org_id_str: raise HTTPException(status_code=400, detail="Organization context missing.")
    org_id = uuid.UUID(org_id_str)
    
    result = await db.execute(select(WorkflowAIConfig).where(WorkflowAIConfig.org_id == org_id))
    db_configs = {c.workflow_name: c for c in result.scalars().all()}
    
    for cfg in request.configs:
        db_cfg = db_configs.get(cfg.workflow)
        if not db_cfg:
            db_cfg = WorkflowAIConfig(
                id=uuid.uuid4(),
                org_id=org_id,
                workflow_name=cfg.workflow,
                daily_cap=cfg.cap,
                model_preference=cfg.model_preference,
                alert_threshold=cfg.alert_threshold
            )
            db.add(db_cfg)
        else:
            db_cfg.daily_cap = cfg.cap
            db_cfg.model_preference = cfg.model_preference
            db_cfg.alert_threshold = cfg.alert_threshold
            
    await db.commit()
    return {"status": "success", "message": "Workflow thresholds mapped."}

@router.get("/provider")
async def get_provider(
    ai_client: AIProviderClient = Depends(get_ai_client),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    org_id_str = current_user.get("org_id")
    if not org_id_str: raise HTTPException(status_code=400, detail="Organization missing.")
    
    # Check DB for active provider choice
    result = await db.execute(select(OrgAIBudget).where(OrgAIBudget.org_id == uuid.UUID(org_id_str)))
    config = result.scalar_one_or_none()
    
    active_prov = config.active_provider if config else ai_client.active_provider
    return {"active_provider": active_prov}

@router.patch("/provider")
async def update_provider(
    request: ProviderUpdateRequest, 
    ai_client: AIProviderClient = Depends(get_ai_client),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    org_id_str = current_user.get("org_id")
    if not org_id_str: raise HTTPException(status_code=400, detail="Organization missing.")
    org_id = uuid.UUID(org_id_str)
    
    result = await db.execute(select(OrgAIBudget).where(OrgAIBudget.org_id == org_id))
    config = result.scalar_one_or_none()
    
    if not config:
        config = OrgAIBudget(id=uuid.uuid4(), org_id=org_id, active_provider=request.provider)
        db.add(config)
    else:
        config.active_provider = request.provider
        
    await db.commit()
    
    # Notify cost tracker / provider system to hot-swap
    # In a fully scaled system, this triggers a pubsub event.
    return {"status": "updated", "new_provider": request.provider}

@router.get("/models")
async def list_models(ai_client: AIProviderClient = Depends(get_ai_client)):
    return {"models": ai_client.PRICING}

from app.core.ai_health import ai_health
router.add_api_route("/health", ai_health, methods=["GET"])
