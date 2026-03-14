from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/organizations", tags=["organizations"])

# Mock state for the current session demonstration
MOCK_ORG_STATE = {
    "org_id": "org-vCISO-demo",
    "name": "Acme Security Corp",
    "industry": "Technology",
    "subscription_tier": "professional" # basic, professional, enterprise, elite
}

class OrgUpdateRequest(BaseModel):
    subscription_tier: str

@router.get("/{org_id}")
async def get_organization(org_id: str):
    """Get organization details, including the active subscription tier."""
    # In a real app, use the DB to fetch. We use the mock for the demo.
    return MOCK_ORG_STATE

@router.put("/{org_id}")
async def update_organization(org_id: str, request: OrgUpdateRequest):
    """Update organization settings, specifically the subscription tier for testing capabilities."""
    valid_tiers = ["basic", "professional", "enterprise", "elite"]
    if request.subscription_tier not in valid_tiers:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of: {', '.join(valid_tiers)}")
        
    MOCK_ORG_STATE["subscription_tier"] = request.subscription_tier
    
    return MOCK_ORG_STATE
