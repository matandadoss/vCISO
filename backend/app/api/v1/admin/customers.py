from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, update, cast, Integer
import uuid
from app.db.session import get_db
from app.models.domain import Organization, User, ServiceTier, ServiceTierConfig
from app.core.auth import require_role

router = APIRouter(tags=["Admin Customers"])

# MRR calculation is now dynamic based on ServiceTierConfig.

@router.get("/", response_model=List[Dict[str, Any]])
async def get_all_customers(
    db: AsyncSession = Depends(get_db),
    admin_user: dict = Depends(require_role("admin"))
):
    """
    Retrieves all organizations formatted as Customer entries for the Admin Portal.
    """
    result = await db.execute(select(Organization))
    orgs = result.scalars().all()
    
    # Calculate users and status per org
    user_stats_result = await db.execute(
        select(
            User.org_id, 
            func.count(User.id).label('total_users'),
            func.sum(cast(User.is_active, Integer)).label('active_users')
        ).group_by(User.org_id)
    )
    
    user_stats = {}
    for row in user_stats_result.all():
        user_stats[str(row.org_id)] = {
            "total": row.total_users,
            "active_count": row.active_users or 0
        }

    # Fetch true dynamic tier pricing limits
    tiers_result = await db.execute(select(ServiceTierConfig))
    tier_configs_map = {tc.tier: tc for tc in tiers_result.scalars().all()}

    customers = []
    for org in orgs:
        tier_cfg = tier_configs_map.get(org.subscription_tier)
        stats = user_stats.get(str(org.id), {"total": 0, "active_count": 0})
        
        # Determine status: if it has users but NONE are active, it's suspended.
        # Otherwise, treat as active.
        status = "suspended" if (stats["total"] > 0 and stats["active_count"] == 0) else "active"
        
        # Dynamic MRR Calculation = Base Price + (Users * Price Per User)
        mrr = 0
        if tier_cfg:
            mrr = tier_cfg.monthly_price + (stats["total"] * tier_cfg.price_per_user)
            
        customers.append({
            "id": str(org.id),
            "name": org.name,
            "tier": org.subscription_tier.value.title(),
            "users": stats["total"],
            "status": status,
            "mrr": mrr,
            "joinedAt": "2024-01-01" 
        })
        
    return customers

class CreateCustomerRequest(BaseModel):
    name: str
    tier: str

@router.post("/", response_model=Dict[str, Any])
async def create_customer(
    payload: CreateCustomerRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: dict = Depends(require_role("admin"))
):
    try:
        tier_enum = ServiceTier(payload.tier.lower())
        
        # Verify tier exists in configs
        tier_result = await db.execute(select(ServiceTierConfig).where(ServiceTierConfig.tier == tier_enum))
        tier_cfg = tier_result.scalar_one_or_none()
        
        if not tier_cfg:
            raise HTTPException(status_code=400, detail="Invalid target subscription tier limits.")
            
        new_org = Organization(
            name=payload.name,
            subscription_tier=tier_enum
        )
        db.add(new_org)
        await db.commit()
        await db.refresh(new_org)
        
        return {
            "id": str(new_org.id),
            "name": new_org.name,
            "tier": new_org.subscription_tier.value.title(),
            "users": 0,
            "status": "active",
            "mrr": tier_cfg.monthly_price,
            "joinedAt": "2024-03-23" 
        }
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {payload.tier}")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{org_id}")
async def delete_customer(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: dict = Depends(require_role("admin"))
):
    try:
        org_uuid = uuid.UUID(org_id)
        
        # Security framework deletes must cascade or be handled manually
        # For this MVP, we will physically delete the users then the org
        await db.execute(
            User.__table__.delete().where(User.org_id == org_uuid)
        )
        
        result = await db.execute(
            Organization.__table__.delete().where(Organization.id == org_uuid)
        )
        
        if result.rowcount == 0:
             raise HTTPException(status_code=404, detail="Organization not found")
             
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
        
    return {"message": "Organization permanently deleted", "org_id": org_id}

@router.put("/{org_id}/suspend")
async def suspend_customer(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: dict = Depends(require_role("admin"))
):
    try:
        org_uuid = uuid.UUID(org_id)
        # Suspend by setting all users in the org to inactive
        await db.execute(
            update(User).where(User.org_id == org_uuid).values(is_active=False)
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
        
    return {"message": f"Organization suspended successfully", "org_id": org_id, "status": "suspended"}

@router.put("/{org_id}/activate")
async def activate_customer(
    org_id: str,
    db: AsyncSession = Depends(get_db),
    admin_user: dict = Depends(require_role("admin"))
):
    try:
        org_uuid = uuid.UUID(org_id)
        # Reactivate by setting all users to active
        await db.execute(
            update(User).where(User.org_id == org_uuid).values(is_active=True)
        )
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
        
    return {"message": f"Organization activated successfully", "org_id": org_id, "status": "active"}

@router.put("/{org_id}/tier")
async def update_customer_tier(
    org_id: str,
    payload: Dict[str, str],
    db: AsyncSession = Depends(get_db),
    admin_user: dict = Depends(require_role("admin"))
):
    tier_str = payload.get("tier", "").lower()
    try:
        new_tier = ServiceTier(tier_str)
        org_uuid = uuid.UUID(org_id)
        
        await db.execute(
            update(Organization).where(Organization.id == org_uuid).values(subscription_tier=new_tier)
        )
        await db.commit()
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {tier_str}")
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
        
    return {"message": "Tier updated successfully", "org_id": org_id, "tier": new_tier.value}

class UpdateCustomerRequest(BaseModel):
    name: str

@router.put("/{org_id}")
async def update_customer(
    org_id: str,
    payload: UpdateCustomerRequest,
    db: AsyncSession = Depends(get_db),
    admin_user: dict = Depends(require_role("admin"))
):
    try:
        org_uuid = uuid.UUID(org_id)
        
        result = await db.execute(
            update(Organization).where(Organization.id == org_uuid).values(name=payload.name)
        )
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Organization not found")
            
        await db.commit()
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
        
    return {"message": "Organization updated successfully", "org_id": org_id, "name": payload.name}

