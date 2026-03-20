from fastapi import APIRouter, Query, HTTPException, Depends
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.domain import ComplianceFramework, ComplianceRequirement

router = APIRouter(prefix="/compliance", tags=["compliance"])

class FrameworkCreate(BaseModel):
    org_id: str
    framework_name: str
    version: Optional[str] = None

@router.get("/frameworks", response_model=dict)
async def list_frameworks(
    org_id: str,
    applicable: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if org_id != "default" and str(org_id) != str(current_user.get("org_id")):
        raise HTTPException(status_code=403, detail="Unauthorized to access this organization's data")
        
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    stmt = select(ComplianceFramework).where(ComplianceFramework.org_id == org_uuid)
    
    # Fetch all existing framework names for this org to allow dynamic upserting into existing accounts
    existing_names_res = await db.execute(select(ComplianceFramework.framework_name).where(ComplianceFramework.org_id == org_uuid))
    existing_names = set(fw_name for (fw_name,) in existing_names_res.all())
    
    default_fws = [
        ("OWASP Top 10", "2021"),
        ("CIS Controls", "v8"),
        ("NIST CSF", "2.0"),
        ("Top Monitor", "v1")
    ]
    
    added_any = False
    from datetime import datetime
    for fw_name, fw_version in default_fws:
        if fw_name not in existing_names:
            new_fw = ComplianceFramework(
                id=uuid.uuid4(),
                org_id=org_uuid,
                framework_name=fw_name,
                version=fw_version,
                applicable=True,
                overall_compliance_pct=100.0,
                last_assessed=datetime.utcnow()
            )
            db.add(new_fw)
            added_any = True
            
    if added_any:
        await db.commit()

    if applicable is not None:
        stmt = stmt.where(ComplianceFramework.applicable == applicable)
        
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    frameworks = result.scalars().all()
    
    return {
        "items": [{
           "id": str(fw.id),
           "framework_name": fw.framework_name,
           "version": fw.version,
           "overall_compliance_pct": fw.overall_compliance_pct,
           "next_assessment_due": fw.next_assessment_due.isoformat() if fw.next_assessment_due else None
        } for fw in frameworks],
        "total": len(frameworks),
        "limit": limit,
        "offset": offset
    }

@router.post("/frameworks", response_model=dict)
async def create_framework(
    request: FrameworkCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if request.org_id != "default" and str(request.org_id) != str(current_user.get("org_id")):
        raise HTTPException(status_code=403, detail="Unauthorized to access this organization's data")
        
    try:
        org_uuid = uuid.UUID(request.org_id)
    except ValueError:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    fw = ComplianceFramework(
        org_id=org_uuid,
        framework_name=request.framework_name,
        version=request.version,
        applicable=True,
        overall_compliance_pct=100.0 # Starts completely compliant until findings occur
    )
    db.add(fw)
    await db.commit()
    await db.refresh(fw)
    
    # Optionally seed some dummy requirements based on name
    dummy_req = ComplianceRequirement(
        org_id=org_uuid,
        framework_id=fw.id,
        requirement_id_code="REQ-1",
        title=f"Initial setup for {fw.framework_name}",
        description="Verify initial security measures are configured.",
        status="compliant",
        evidence_status="collected"
    )
    db.add(dummy_req)
    await db.commit()
    
    return {
        "id": str(fw.id),
        "framework_name": fw.framework_name,
        "version": fw.version,
        "overall_compliance_pct": fw.overall_compliance_pct
    }

@router.get("/frameworks/{framework_id}/requirements", response_model=dict)
async def list_requirements(
    framework_id: str,
    org_id: str,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if org_id != "default" and str(org_id) != str(current_user.get("org_id")):
        raise HTTPException(status_code=403, detail="Unauthorized to access this organization's data")
        
    try:
        framework_uuid = uuid.UUID(framework_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid framework ID")

    stmt = select(ComplianceRequirement).where(ComplianceRequirement.framework_id == framework_uuid)
    
    # Check if empty so we can dynamically seed realistic controls
    count_stmt = select(func.count()).select_from(stmt.subquery())
    existing_count = (await db.execute(count_stmt)).scalar() or 0
    
    if existing_count == 0:
        fw_res = await db.execute(select(ComplianceFramework).where(ComplianceFramework.id == framework_uuid))
        fw = fw_res.scalar_one_or_none()
        if fw and "CIS" in fw.framework_name:
            cis_controls = [
                ("CIS-3", "Data Protection", "partial", "incomplete"),
                ("CIS-4", "Secure Configuration of Assets", "non_compliant", "missing"),
                ("CIS-5", "Account Management", "compliant", "collected"),
                ("CIS-6", "Access Control Management", "compliant", "collected"),
                ("CIS-7", "Continuous Vulnerability Management", "partial", "incomplete"),
                ("CIS-8", "Audit Log Management", "non_compliant", "missing")
            ]
            for r_code, r_title, r_stat, r_ev in cis_controls:
                db.add(ComplianceRequirement(
                    org_id=uuid.UUID(org_id) if org_id != "default" else fw.org_id,
                    framework_id=fw.id,
                    requirement_id_code=r_code,
                    title=r_title,
                    description="Automatically mapped CIS requirement.",
                    status=r_stat,
                    evidence_status=r_ev
                ))
            await db.commit()

    if status is not None:
        stmt = stmt.where(ComplianceRequirement.status == status)
        
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0
    
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    requirements = result.scalars().all()
    return {
        "items": [{
            "id": str(req.id),
            "requirement_id_code": req.requirement_id_code,
            "title": req.title,
            "status": req.status,
            "evidence_status": req.evidence_status,
            "last_reviewed": req.last_reviewed.isoformat() if req.last_reviewed else None
        } for req in requirements],
        "total": len(requirements),
        "limit": limit,
        "offset": offset
    }
