from fastapi import APIRouter, Depends
from app.core.dependencies import get_ai_client, get_cost_tracker
from app.core.ai_provider import AIProviderClient, AIProvider
from app.core.cost_tracker import CostTracker
from pydantic import BaseModel
from typing import List, Dict, Any

router = APIRouter(prefix="/ai", tags=["ai"])

class ProviderUpdateRequest(BaseModel):
    provider: AIProvider

class WorkflowConfigUpdate(BaseModel):
    workflow_id: str
    budget_cap: float
    model_preference: str # e.g. "fast_cheap", "balanced", "deep"
    alert_threshold_percent: int

@router.get("/budget-status")
async def get_budget_status(org_id: str, cost_tracker: CostTracker = Depends(get_cost_tracker)):
    return await cost_tracker.get_budget_status(org_id)

@router.get("/cost-breakdown")
async def get_cost_breakdown(org_id: str, cost_tracker: CostTracker = Depends(get_cost_tracker)):
    workflow = await cost_tracker.get_spend_by_workflow(org_id)
    tier = await cost_tracker.get_spend_by_tier(org_id)
    
    # Mocking extended workflow configurations
    extended_workflow = []
    for w in workflow:
        name = w.get("workflow", "Unknown")
        extended_workflow.append({
            "workflow": name,
            "cost": w.get("cost", 0.0),
            "cap": 5.0 if name == "correlation_engine" else 2.0, # Per-workflow budget caps
            "model_preference": "deep" if name == "correlation_engine" else "fast_cheap",
            "alert_threshold": 80
        })
        
    return {"by_workflow": extended_workflow, "by_tier": tier}

@router.get("/budget-trends")
async def get_budget_trends(org_id: str, days: int = 7, cost_tracker: CostTracker = Depends(get_cost_tracker)):
    trends = await cost_tracker.get_budget_trends(org_id, days)
    return {"trend": trends}

@router.get("/roi-metrics")
async def get_roi_metrics(org_id: str, cost_tracker: CostTracker = Depends(get_cost_tracker)):
    # In a full system, we might query the AIQueryLog or Findings table for this.
    # We will keep realistic placeholders for now, but hook it into the dependency.
    return {
        "estimated_hours_saved": 42.5,
        "incidents_auto_triaged": 128,
        "compliance_gaps_auto_mapped": 15
    }

@router.post("/workflow-config")
async def update_workflow_config(request: WorkflowConfigUpdate):
    # Mock update config
    return {"status": "success", "updated_config": request.model_dump()}

@router.get("/provider")
async def get_provider(ai_client: AIProviderClient = Depends(get_ai_client)):
    return {"active_provider": ai_client.active_provider}

@router.patch("/provider")
async def update_provider(request: ProviderUpdateRequest, ai_client: AIProviderClient = Depends(get_ai_client)):
    # Note: In a real implementation this would update the OrgAIBudget in Cloud SQL
    # For now, we return the intent
    return {"status": "updated", "new_provider": request.provider}

@router.get("/models")
async def list_models(ai_client: AIProviderClient = Depends(get_ai_client)):
    return {"models": ai_client.PRICING}

# Route the /health from core into here as well
from app.core.ai_health import ai_health
router.add_api_route("/health", ai_health, methods=["GET"])
