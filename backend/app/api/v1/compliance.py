from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models.domain import ComplianceFramework, ComplianceRequirement

router = APIRouter(prefix="/compliance", tags=["compliance"])

@router.get("/frameworks", response_model=dict)
async def list_frameworks(
    org_id: str,
    applicable: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    stmt = select(ComplianceFramework).where(ComplianceFramework.org_id == org_uuid)
    if applicable is not None:
        stmt = stmt.where(ComplianceFramework.applicable == applicable)
        
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    frameworks = result.scalars().all()
    
    return {
        "items": frameworks,
        "total": len(frameworks),
        "limit": limit,
        "offset": offset
    }

@router.get("/frameworks/{framework_id}/requirements", response_model=dict)
async def list_requirements(
    framework_id: str,
    org_id: str,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    try:
        framework_uuid = uuid.UUID(framework_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid framework ID")

    stmt = select(ComplianceRequirement).where(ComplianceRequirement.framework_id == framework_uuid)
    if status is not None:
        stmt = stmt.where(ComplianceRequirement.status == status)
        
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    requirements = result.scalars().all()
    return {
        "items": requirements,
        "total": len(requirements),
        "limit": limit,
        "offset": offset
    }
