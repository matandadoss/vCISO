from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from app.models.domain import ServiceTier, ServiceTierConfig
from app.core.auth import require_role
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

router = APIRouter(tags=["Admin Tiers"])

DEFAULT_TIERS = [
    { 
        "id": ServiceTier.basic.value, 
        "name": "Basic", 
        "description": "Essential manual risk assessment.",
        "monthlyPrice": 0, 
        "maxUsers": "5", 
        "features": ["Manual infrastructure diagramming", "Manual compliance tracking", "Weekly threat digests"],
        "popular": False,
        "colorHex": '#9ca3af'
    },
    { 
        "id": ServiceTier.professional.value, 
        "name": "Professional", 
        "description": "Basic real-time visibility.",
        "monthlyPrice": 200, 
        "maxUsers": "25", 
        "features": ["Basic real-time cloud sync", "Standard What-If simulations", "Daily threat alerts"],
        "popular": False,
        "colorHex": '#fbbf24'
    },
    { 
        "id": ServiceTier.enterprise.value, 
        "name": "Enterprise", 
        "description": "Advanced contextual analytics.",
        "monthlyPrice": 800, 
        "maxUsers": "100", 
        "features": ["Advanced real-time correlation", "Complex Hindsight simulations", "Automated compliance evidence"],
        "popular": True,
        "colorHex": '#34d399'
    },
    { 
        "id": ServiceTier.elite.value, 
        "name": "Elite", 
        "description": "Full automated platform capabilities.",
        "monthlyPrice": 2500, 
        "maxUsers": 'Unlimited', 
        "features": ["Full real-time correlation graphs", "Automated AI remediation", "Continuous Red Teaming"],
        "popular": False,
        "colorHex": '#60a5fa'
    }
]

class TierUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    monthlyPrice: int | None = None
    maxUsers: str | int | None = None
    features: Optional[List[str]] = None
    popular: Optional[bool] = None
    colorHex: Optional[str] = None

@router.get("/", response_model=List[Dict[str, Any]])
async def get_service_tiers(
    admin_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the system's available subscription tiers and their configurations directly from the database schema.
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
            "maxUsers": int(c.max_users) if str(c.max_users).isdigit() else c.max_users,
            "features": c.features,
            "popular": c.is_popular,
            "color": c.color_hex
        } for c in sorted(configs, key=lambda x: list(ServiceTier).index(x.tier))
    ]

@router.put("/{tier_id}")
async def update_service_tier(
    tier_id: str,
    payload: TierUpdate,
    admin_user: dict = Depends(require_role("admin")),
    db: AsyncSession = Depends(get_db)
):
    try:
        tier_enum = ServiceTier(tier_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid tier ID")
        
    result = await db.execute(select(ServiceTierConfig).where(ServiceTierConfig.tier == tier_enum))
    config = result.scalar_one_or_none()
    if not config:
        # Failsafe if hitting specific routes before a GET hydrates the defaults
        raise HTTPException(status_code=404, detail="Tier config not seeded in database yet. Try running GET /api/v1/admin/tiers first.")
        
    if payload.name is not None: config.name = payload.name
    if payload.description is not None: config.description = payload.description
    if payload.monthlyPrice is not None: config.monthly_price = payload.monthlyPrice
    if payload.maxUsers is not None: config.max_users = str(payload.maxUsers)
    if payload.features is not None: config.features = payload.features
    if payload.popular is not None: config.is_popular = payload.popular
    if payload.colorHex is not None: config.color_hex = payload.colorHex
    
    await db.commit()
    return {"status": "success", "tier_id": tier_id}
