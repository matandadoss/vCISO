from fastapi import APIRouter, Depends
from pydantic import BaseModel
import datetime
import uuid
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.domain import Organization
from app.db.seeds import seed_defaults_for_org

router = APIRouter(prefix="/onboarding", tags=["onboarding"])

class OnboardingCompleteRequest(BaseModel):
    organization: dict
    integrations: list[str]
    frameworks: list[str]

@router.post("/complete")
async def complete_onboarding(request: OnboardingCompleteRequest, db: AsyncSession = Depends(get_db)):
    org_name = request.organization.get("companyName", "New Company")
    org_id = uuid.uuid4()
    
    new_org = Organization(
        id=org_id,
        name=org_name,
        industry="Unknown",
        size="Unknown",
        subscription_tier="professional"
    )
    db.add(new_org)
    
    # Seed the defaults automatically for the new account
    await seed_defaults_for_org(db, org_id)
    await db.commit()
    
    return {"status": "success", "org_id": str(org_id)}
