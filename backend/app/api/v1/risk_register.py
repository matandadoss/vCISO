from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import List, Optional
from pydantic import BaseModel
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.domain import RiskRegister, Severity

router = APIRouter(prefix="/risk-register", tags=["risk-register"])

class RiskRegisterResponse(BaseModel):
    id: str
    finding_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    risk_level: str
    risk_categories: list[str]
    owner: Optional[str] = None
    action_plan: Optional[str] = None
    attachment_url: Optional[str] = None
    date_entered: str
    expiration_date: Optional[str] = None
    source: Optional[str] = None

class RiskRegisterUpdate(BaseModel):
    risk_level: Optional[str] = None
    risk_categories: Optional[list[str]] = None
    owner: Optional[str] = None
    action_plan: Optional[str] = None
    source: Optional[str] = None

class RiskExtendRequest(BaseModel):
    new_expiration: str

@router.get("", response_model=List[RiskRegisterResponse])
async def list_risks(org_id: str = "default", db: AsyncSession = Depends(get_db)):
    org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
    res = await db.execute(select(RiskRegister).where(RiskRegister.org_id == org_uuid).order_by(RiskRegister.date_entered.desc()))
    items = res.scalars().all()
    out = []
    for item in items:
        out.append(RiskRegisterResponse(
            id=str(item.id),
            finding_id=item.finding_id,
            title=item.title,
            description=item.description,
            risk_level=item.risk_level.value if hasattr(item.risk_level, 'value') else item.risk_level,
            risk_categories=item.risk_categories or [],
            owner=item.owner,
            action_plan=item.action_plan,
            attachment_url=item.attachment_url,
            date_entered=item.date_entered.isoformat() if item.date_entered else "",
            expiration_date=item.expiration_date.isoformat() if getattr(item, 'expiration_date', None) else None,
            source=getattr(item, 'source', None)
        ))
    return out

@router.get("/{risk_id}", response_model=RiskRegisterResponse)
async def get_risk(risk_id: str, org_id: str = "default", db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(RiskRegister).where(RiskRegister.id == uuid.UUID(risk_id)))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Risk item not found")
    return RiskRegisterResponse(
        id=str(item.id),
        finding_id=item.finding_id,
        title=item.title,
        description=item.description,
        risk_level=item.risk_level.value if hasattr(item.risk_level, 'value') else item.risk_level,
        risk_categories=item.risk_categories or [],
        owner=item.owner,
        action_plan=item.action_plan,
        attachment_url=item.attachment_url,
        date_entered=item.date_entered.isoformat() if item.date_entered else "",
        expiration_date=item.expiration_date.isoformat() if getattr(item, 'expiration_date', None) else None,
        source=getattr(item, 'source', None)
    )

@router.put("/{risk_id}", response_model=RiskRegisterResponse)
async def update_risk(risk_id: str, update: RiskRegisterUpdate, org_id: str = "default", db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(RiskRegister).where(RiskRegister.id == uuid.UUID(risk_id)))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Risk item not found")
    
    if update.risk_level is not None:
        item.risk_level = Severity(update.risk_level.lower())
    if update.risk_categories is not None:
        item.risk_categories = update.risk_categories
    if update.owner is not None:
        item.owner = update.owner
    if update.action_plan is not None:
        item.action_plan = update.action_plan
    if update.source is not None:
        item.source = update.source
        
    await db.commit()
    await db.refresh(item)
    return await get_risk(risk_id, org_id, db)

@router.post("/{risk_id}/attachment")
async def upload_attachment(risk_id: str, file: UploadFile = File(...), org_id: str = "default", db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(RiskRegister).where(RiskRegister.id == uuid.UUID(risk_id)))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Risk item not found")
    
    # Mocking storage saving logic
    mock_url = f"/uploads/risks/{risk_id}/{file.filename.replace(' ', '_')}"
    item.attachment_url = mock_url
    await db.commit()
    return {"status": "success", "url": mock_url}

@router.post("/{risk_id}/extend", response_model=RiskRegisterResponse)
async def extend_risk(risk_id: str, payload: RiskExtendRequest, org_id: str = "default", db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(RiskRegister).where(RiskRegister.id == uuid.UUID(risk_id)))
    item = res.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Risk item not found")
        
    try:
        new_date = datetime.fromisoformat(payload.new_expiration.replace('Z', '+00:00'))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format, use ISO format")
        
    max_date = datetime.utcnow() + timedelta(days=365)
    if new_date.tzinfo is not None:
        new_date = new_date.replace(tzinfo=None)
        
    if new_date > max_date:
        raise HTTPException(status_code=400, detail="Risk extension cannot exceed 1 year (365 days) from today.")
        
    item.expiration_date = new_date
    await db.commit()
    await db.refresh(item)
    return await get_risk(risk_id, org_id, db)
