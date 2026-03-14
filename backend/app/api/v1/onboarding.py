from fastapi import APIRouter
from pydantic import BaseModel
import datetime

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

# In-memory mock state for the current session demonstration
MOCK_ONBOARDING_STATE = {
    "is_onboarded": True,
    "completed_at": None,
    "organization": None,
    "integrations": [],
    "frameworks": []
}

class OnboardingCompleteRequest(BaseModel):
    organization: dict
    integrations: list[str]
    frameworks: list[str]

@router.get("/status")
async def get_onboarding_status():
    return MOCK_ONBOARDING_STATE

@router.post("/complete")
async def complete_onboarding(request: OnboardingCompleteRequest):
    # Mock simulating the saving of onboarding preferences
    import asyncio
    await asyncio.sleep(1.0)
    
    MOCK_ONBOARDING_STATE["is_onboarded"] = True
    MOCK_ONBOARDING_STATE["completed_at"] = datetime.datetime.utcnow().isoformat()
    MOCK_ONBOARDING_STATE["organization"] = request.organization
    MOCK_ONBOARDING_STATE["integrations"] = request.integrations
    MOCK_ONBOARDING_STATE["frameworks"] = request.frameworks
    
    return {"status": "success", "state": MOCK_ONBOARDING_STATE}
