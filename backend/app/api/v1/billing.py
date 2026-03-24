import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.domain import Organization, ServiceTierConfig
from app.services.fluidpay import FluidpayClient

router = APIRouter(tags=["Billing"])

class CheckoutRequest(BaseModel):
    tier_id: str
    payment_token: str
    payment_method: str = "card" # card, ach, apple_pay, google_pay

@router.post("/checkout")
async def process_checkout(
    payload: CheckoutRequest, 
    db: AsyncSession = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    """
    Captures a frontend tokenized request and routes it to FluidPay to upgrade the Org subscription.
    """
    org_id = uuid.UUID(current_user.get("org_id"))
    
    # 1. Fetch Org
    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
        
    # 2. Fetch the target Tier
    tier_result = await db.execute(select(ServiceTierConfig).where(ServiceTierConfig.tier == payload.tier_id))
    tier_config = tier_result.scalar_one_or_none()
    
    if not tier_config:
        raise HTTPException(status_code=404, detail="Invalid target subscription tier.")
        
    # Calculate initial charge (monthly base fee mapping to cents)
    amount_cents = tier_config.monthly_price * 100
    
    # 3. Securely Charge via FluidPay SDK
    fp = FluidpayClient()
    try:
        charge_response = await fp.vault_and_charge(
            amount_cents=amount_cents,
            payment_token=payload.payment_token,
            description=f"vCISO {tier_config.name} Subscription Upgrade ({payload.payment_method.upper()}) - Org: {org.name}"
        )
        
        if charge_response.get("status") != "success":
            raise HTTPException(status_code=400, detail=f"Payment declined: {charge_response.get('msg', 'Unknown Error')}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transaction Failed: {str(e)}")
        
    # 4. If payment approved, update the Postgres database securely
    # In a full flow we'd save `fluidpay_customer_id = charge_response['data']['vault_id']` inside the Org model.
    org.subscription_tier = payload.tier_id
    await db.commit()
    await db.refresh(org)
    
    return {
        "status": "success", 
        "detail": f"Successfully processed payment and upgraded organization to {tier_config.name}"
    }
