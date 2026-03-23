from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.models.domain import ServiceTier, ServiceTierConfig
from app.core.auth import get_current_user
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

router = APIRouter(tags=["Tiers"])

@router.get("/", response_model=List[Dict[str, Any]])
async def get_public_service_tiers(
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the system's available subscription tiers and their configurations directly from the database schema.
    Accessible to any authenticated user.
    """
    result = await db.execute(select(ServiceTierConfig))
    configs = result.scalars().all()
    
    return [
        {
            "id": c.tier.value,
            "name": c.name,
            "description": c.description,
            "monthlyPrice": c.monthly_price,
            "pricePerUser": c.price_per_user,
            "maxUsers": int(c.max_users) if str(c.max_users).isdigit() else c.max_users,
            "features": c.features,
            "popular": c.is_popular,
            "color": c.color_hex
        } for c in sorted(configs, key=lambda x: list(ServiceTier).index(x.tier))
    ]
