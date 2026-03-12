from fastapi import APIRouter, Depends
from app.core.dependencies import get_ai_client, get_cost_tracker
from app.core.ai_provider import AIProviderClient, AIProvider
from app.core.cost_tracker import CostTracker
from pydantic import BaseModel

router = APIRouter(prefix="/ai", tags=["ai"])

class ProviderUpdateRequest(BaseModel):
    provider: AIProvider

@router.get("/budget-status")
async def get_budget_status(org_id: str, cost_tracker: CostTracker = Depends(get_cost_tracker)):
    return await cost_tracker.get_budget_status(org_id)

@router.get("/cost-breakdown")
async def get_cost_breakdown(org_id: str, cost_tracker: CostTracker = Depends(get_cost_tracker)):
    workflow = await cost_tracker.get_spend_by_workflow(org_id)
    tier = await cost_tracker.get_spend_by_tier(org_id)
    return {"by_workflow": workflow, "by_tier": tier}

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
