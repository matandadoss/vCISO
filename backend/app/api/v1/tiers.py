from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.models.domain import ServiceTier, ServiceTierConfig
from app.core.auth import get_current_user
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.api.v1.admin.tiers import DEFAULT_TIERS

router = APIRouter(tags=["Tiers"])

@router.get("", response_model=List[Dict[str, Any]])
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
    
    if not configs:
        for bt in DEFAULT_TIERS:
            cfg = ServiceTierConfig(
                tier=ServiceTier(bt["id"]),
                name=bt["name"],
                description=bt["description"],
                monthly_price=bt["monthlyPrice"],
                price_per_user=bt.get("pricePerUser", 0),
                max_users=str(bt["maxUsers"]),
                features=bt["features"],
                is_popular=bt["popular"],
                color_hex=bt["colorHex"]
            )
            db.add(cfg)
        await db.commit()
        
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
