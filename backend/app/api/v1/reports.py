from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.core.auth import require_role
from app.models.domain import User, WeeklySecurityBrief
from app.services.brief_generator import gather_weekly_telemetry, generate_role_specific_brief

router = APIRouter(tags=["Reports"])

@router.post("/generate-weekly")
async def generate_weekly_briefs(
    admin_user: dict = Depends(require_role("admin")), # Restrict this trigger to Global Sysadmins or Chron schedulers using admin tokens
    db: AsyncSession = Depends(get_db)
):
    """
    Intended to be triggered via GCP Cloud Scheduler cron-jobs. 
    It queries all active users opted-in to notifications, generates bespoke LLM context, and "emails" them out.
    """
    # Find all users subscribed to the Weekly Digest across all Orgs
    # Note: Because of PostgreSQL RLS policies injected by the backend middleware, 
    # we must explicitly disable the middleware RLS requirement for this specific cron-service OR iterate per org.
    # Actually, if an admin runs this, RLS forces queries to their org. 
    # We will just generate briefs explicitly for users INSIDE the admin's organization to respect blast-radius.
    org_id_str = admin_user.get("org_id")
    if not org_id_str:
        raise HTTPException(status_code=403, detail="Cron execution restricted strictly to valid Organization Administrators.")
        
    import uuid
    org_uuid = uuid.UUID(org_id_str)
    
    # Extract Raw Telemetry isolated strictly to their RLS zone.
    raw_data = await gather_weekly_telemetry(db, org_uuid)
    
    # Find active opted-in users for generation execution.
    user_query = select(User).where(User.org_id == org_uuid, User.is_active == True, User.receives_weekly_digest == True)
    user_result = await db.execute(user_query)
    users = user_result.scalars().all()
    
    generated_count = 0
    # Simulate batch creation and SMTP dispatch
    for u in users:
        # Generate the Role-Based Intelligence
        markdown_body = await generate_role_specific_brief(raw_data, u.role)
        
        # Persist the brief historically 
        brief = WeeklySecurityBrief(
            org_id=org_uuid,
            user_id=u.id,
            role_targeted=u.role,
            markdown_content=markdown_body
        )
        db.add(brief)
        
        # Mock Email Delivery system 
        print(f"\n==========================================")
        print(f"[MOCK SMTP DISPATCH] Sending Weekly Brief")
        print(f"TO: {u.email} | ROLE: {u.role.upper()}")
        print(f"SUBJECT: Your Weekly vCISO Security Intelligence Digest")
        print(f"BODY:\n{markdown_body[:150]}...")
        print(f"==========================================\n")
        
        generated_count += 1
        
    await db.commit()
    
    return {"status": "success", "briefs_dispatched": generated_count}
