from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Severity, FindingStatus, FindingType, WorkflowName, Finding
from app.db.session import get_db
from app.crud import finding as crud_finding
from app.schemas.finding import FindingResponse, FindingUpdate

router = APIRouter(prefix="/findings", tags=["findings"])

class FindingsListResponse(BaseModel):
    items: List[FindingResponse]
    total: int
    limit: int
    offset: int

    model_config = {
        "from_attributes": True
    }

@router.get("", response_model=FindingsListResponse)
async def list_findings(
    org_id: str,
    severity: Optional[Severity] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve findings from the database with pagination and filtering."""
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        # If default string is passed, we might need a dummy org id or throw error
        # In a real app the org_id comes from token, for now let's just use a dummy
        org_uuid = uuid.uuid4()
        
    items, total = await crud_finding.get_by_org(
        db=db, 
        org_id=org_uuid, 
        skip=offset, 
        limit=limit, 
        severity=severity, 
        status=status
    )
    
    # Optional logic: If empty, inject mock items for demo purposes to avoid an empty dashboard
    if total == 0 and org_id == "default":
        from app.schemas.finding import FindingCreate
        mock_finding_1 = FindingCreate(
            org_id=org_uuid,
            title="Unpatched Server",
            finding_type=FindingType.vulnerability,
            severity=Severity.critical,
            risk_score=92.5,
            source_workflow=WorkflowName.vulnerability,
            status=FindingStatus.new,
            detected_at=datetime.utcnow().replace(day=max(1, datetime.utcnow().day - 5)),
            sla_deadline=datetime.utcnow().replace(day=max(1, datetime.utcnow().day - 4))
        )
        mock_finding_2 = FindingCreate(
            org_id=org_uuid,
            title="Exposed Storage Bucket containing PII",
            finding_type=FindingType.misconfiguration,
            severity=Severity.high,
            risk_score=82.0,
            source_workflow=WorkflowName.infrastructure,
            status=FindingStatus.triaged,
            detected_at=datetime.utcnow().replace(day=max(1, datetime.utcnow().day - 2)),
            sla_deadline=datetime.utcnow().replace(day=min(28, datetime.utcnow().day + 5))
        )
        await crud_finding.create(db=db, obj_in=mock_finding_1)
        await crud_finding.create(db=db, obj_in=mock_finding_2)
        # Fetch again
        items, total = await crud_finding.get_by_org(
            db=db, org_id=org_uuid, skip=offset, limit=limit, severity=severity, status=status
        )

    return {"items": items, "total": total, "limit": limit, "offset": offset}

@router.get("/{finding_id}", response_model=FindingResponse)
async def get_finding(finding_id: str, org_id: str, db: AsyncSession = Depends(get_db)):
    """Provides detailed information about a specific finding."""
    try:
        finding_uuid = uuid.UUID(finding_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid finding ID format")
        
    db_finding = await crud_finding.get(db=db, id=finding_uuid)
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    return db_finding

class AssignRequest(BaseModel):
    owner_id: str
    notes: Optional[str] = None

class AcceptRiskRequest(BaseModel):
    justification: str
    expiration_date: Optional[str] = None

class CreateTicketRequest(BaseModel):
    integration: str # e.g. "jira", "servicenow"
    priority: str

@router.post("/{finding_id}/assign")
async def assign_finding(finding_id: str, request: AssignRequest, org_id: str, db: AsyncSession = Depends(get_db)):
    """Assigns a finding to a specific user or team."""
    try:
        finding_uuid = uuid.UUID(finding_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid finding ID")
        
    db_finding = await crud_finding.get(db=db, id=finding_uuid)
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    update_data = {"assigned_to": request.owner_id, "status": FindingStatus.in_progress}
    if request.notes:
        update_data["remediation_notes"] = request.notes
        
    await crud_finding.update(db=db, db_obj=db_finding, obj_in=update_data)
    return {"status": "success", "action": "assigned", "finding_id": finding_id, "owner": request.owner_id}

@router.post("/{finding_id}/remediate")
async def mark_remediated(finding_id: str, org_id: str, db: AsyncSession = Depends(get_db)):
    """Marks a finding as fully remediated/resolved."""
    try:
        finding_uuid = uuid.UUID(finding_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid finding ID")
        
    db_finding = await crud_finding.get(db=db, id=finding_uuid)
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    update_data = {"status": FindingStatus.resolved, "resolved_at": datetime.utcnow()}
    await crud_finding.update(db=db, db_obj=db_finding, obj_in=update_data)
    return {"status": "success", "action": "remediated", "finding_id": finding_id, "new_status": "resolved"}

@router.post("/{finding_id}/accept-risk")
async def accept_risk(finding_id: str, request: AcceptRiskRequest, org_id: str, db: AsyncSession = Depends(get_db)):
    """Accepts the risk of a finding, optionally until an expiration date."""
    try:
        finding_uuid = uuid.UUID(finding_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid finding ID")
        
    db_finding = await crud_finding.get(db=db, id=finding_uuid)
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    update_data = {
        "status": FindingStatus.accepted, 
        "remediation_notes": f"Risk Accepted. Justification: {request.justification}. Expires: {request.expiration_date}"
    }
    await crud_finding.update(db=db, db_obj=db_finding, obj_in=update_data)
    return {"status": "success", "action": "risk_accepted", "finding_id": finding_id, "new_status": "accepted"}

@router.post("/{finding_id}/ticket")
async def create_ticket(finding_id: str, request: CreateTicketRequest, org_id: str, db: AsyncSession = Depends(get_db)):
    """Creates an external ticket (Jira/ServiceNow) for the finding."""
    # Mocking external integration
    mock_ticket_id = f"{request.integration.upper()}-{str(uuid.uuid4())[:6]}"
    return {"status": "success", "action": "ticket_created", "finding_id": finding_id, "ticket_id": mock_ticket_id}

