from fastapi import APIRouter, Depends, Query, HTTPException, status
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.domain import Severity, FindingStatus, FindingType, WorkflowName, Finding, RiskRegister, User
from sqlalchemy import select, func, or_
from app.db.session import get_db
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
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    stmt = select(Finding).where(Finding.org_id == org_uuid)
    
    if severity:
        stmt = stmt.where(Finding.severity == severity)
    if status is not None and status != "all":
        # simple check assuming status enum cast
        stmt = stmt.where(Finding.status == FindingStatus(status))
        
    # Get total count
    count_stmt = select(func.count()).select_from(stmt.subquery())
    total_res = await db.execute(count_stmt)
    total = total_res.scalar() or 0
    
    # Get items with limit and offset
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    items = result.scalars().all()
    
    # Fastapi will automatically parse SQLAlchemy models if response_model is correct
    return {"items": items, "total": total, "limit": limit, "offset": offset}

@router.get("/{finding_id}")
async def get_finding(finding_id: str, org_id: str, db: AsyncSession = Depends(get_db)):
    """Provides detailed information about a specific finding."""
    try:
        finding_uuid = uuid.UUID(finding_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid finding ID format")
        
    result = await db.execute(select(Finding).where(Finding.id == finding_uuid))
    db_finding = result.scalar_one_or_none()
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    # Convert SQLAlchemy model to dict so we can inject extra UI fields easily
    from fastapi.encoders import jsonable_encoder
    finding_dict = jsonable_encoder(db_finding)
    
    # Inject detailed mock data for the investigation view
    finding_dict["root_cause_analysis"] = "Initial access was gained via phishing, exploiting compromised credentials. The attacker then moved laterally to the production database via an overly permissive IAM role assigned to the compromised developer instance."
    
    finding_dict["affected_assets"] = [
        {"id": "ast-1", "name": "prod-db-cluster-main", "type": "Database Server", "criticality": "high"},
        {"id": "ast-2", "name": "k8s-worker-node-4", "type": "Kubernetes Node", "criticality": "medium"}
    ]
    
    finding_dict["mitre_attack"] = [
        {"id": "T1078", "name": "Valid Accounts", "tactic": "Initial Access"},
        {"id": "T1098", "name": "Account Manipulation", "tactic": "Persistence"},
        {"id": "T1530", "name": "Data from Cloud Storage", "tactic": "Collection"}
    ]
    
    finding_dict["remediation"] = {
        "automated_available": True,
        "automated_description": "Revoke active IAM sessions for the affected user and isolate k8s-worker-node-4 from the network.",
        "manual_steps": [
            "1. Force password reset for the compromised user account.",
            "2. Review CloudTrail logs for unexpected API calls from the user's IP.",
            "3. Audit IAM roles assigned to 'prod-db-cluster-main' and remove unused permissions."
        ]
    }
    
    finding_dict["linked_items"] = [
        {"id": "ioc-192", "type": "Threat Intel (IP)", "name": "192.168.1.45 (Known Malicious)"},
        {"id": "ctrl-8", "type": "Security Control Default", "name": "MFA Enforcement Policy (Failed)"}
    ]
    
    # Inject Dynamic Compliance Controls that would be breached by this finding
    finding_dict["compliance_controls"] = []
    
    # dynamically fetch all frameworks for the org to map against the AI finding
    try:
        fw_res = await db.execute(select(ComplianceFramework).where(ComplianceFramework.org_id == org_uuid))
        frameworks = fw_res.scalars().all()
        
        for fw in frameworks:
             is_cis = "CIS" in fw.framework_name
             if finding_dict.get("finding_type") in [FindingType.credential_exposure, FindingType.access_sale]:
                  finding_dict["compliance_controls"].append({
                      "framework": fw.framework_name,
                      "control": "CIS-5" if is_cis else f"{fw.framework_name.split(' ')[0]}-AUTH",
                      "description": "Account Management: Use secure authentication protocols and manage credentials." if is_cis else "Logical access security: passwords and MFA enforcement"
                  })
             elif finding_dict.get("finding_type") in [FindingType.vulnerability, FindingType.misconfiguration]:
                  finding_dict["compliance_controls"].append({
                      "framework": fw.framework_name,
                      "control": "CIS-4" if is_cis else f"{fw.framework_name.split(' ')[0]}-VULN",
                      "description": "Secure Configuration of Enterprise Assets and Software." if is_cis else "System configuration and continuous vulnerability management"
                  })
             else:
                  finding_dict["compliance_controls"].append({
                      "framework": fw.framework_name,
                      "control": "CIS-8" if is_cis else f"{fw.framework_name.split(' ')[0]}-MON",
                      "description": "Audit Log Management: Collect, alert, review, and retain audit logs." if is_cis else "Security event monitoring and anomaly detection"
                  })
                  
        if not finding_dict["compliance_controls"]:
            # fallback mock
            finding_dict["compliance_controls"] = [
                {"framework": "General Security", "control": "GEN-01", "description": "Baseline monitoring"}
            ]
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning("Error fetching compliance controls: %s", e)
        
    return finding_dict

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
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        try:
            finding_uuid = uuid.UUID(finding_id)
            org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6") # Fallback dummy
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid finding ID format")
            
    # Restrict assignment to system users
    user_query = select(User).where(
        User.org_id == org_uuid,
        or_(User.email == request.owner_id, User.firebase_uid == request.owner_id, User.full_name == request.owner_id)
    )
    user_result = await db.execute(user_query)
    if not user_result.scalar_one_or_none():
        raise HTTPException(
            status_code=400, 
            detail="Cannot assign finding: User does not exist in the system (No outside users allowed)."
        )

    result = await db.execute(select(Finding).where(Finding.id == finding_uuid))
    db_finding = result.scalar_one_or_none()
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    update_data = {"assigned_to": request.owner_id, "status": FindingStatus.in_progress}
    if request.notes:
        update_data["remediation_notes"] = request.notes
        
    for key, value in update_data.items():
        setattr(db_finding, key, value)
    await db.commit()
    return {"status": "success", "action": "assigned", "finding_id": finding_id, "owner": request.owner_id}

@router.post("/{finding_id}/remediate")
async def mark_remediated(finding_id: str, org_id: str, db: AsyncSession = Depends(get_db)):
    """Marks a finding as fully remediated/resolved."""
    try:
        finding_uuid = uuid.UUID(finding_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid finding ID format")
        
    result = await db.execute(select(Finding).where(Finding.id == finding_uuid))
    db_finding = result.scalar_one_or_none()
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    db_finding.status = FindingStatus.resolved
    db_finding.resolved_at = datetime.utcnow()
    await db.commit()
    return {"status": "success", "action": "remediated", "finding_id": finding_id, "new_status": "resolved"}

@router.post("/{finding_id}/accept-risk")
async def accept_risk(finding_id: str, request: AcceptRiskRequest, org_id: str, db: AsyncSession = Depends(get_db)):
    """Accepts the risk of a finding, optionally until an expiration date."""
    try:
        finding_uuid = uuid.UUID(finding_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid finding ID format")
        
    result = await db.execute(select(Finding).where(Finding.id == finding_uuid))
    db_finding = result.scalar_one_or_none()
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")
        
    db_finding.status = FindingStatus.accepted
    db_finding.remediation_notes = f"Risk Accepted. Justification: {request.justification}. Expires: {request.expiration_date}"
    
    # AI/Contextual Risk Categorization
    categories = []
    if db_finding.finding_type == FindingType.compliance_gap:
        categories.append("Compliance Risk")
    if db_finding.severity in [Severity.critical, Severity.high]:
        categories.append("Operational Risk")
    if db_finding.finding_type in [FindingType.data_leak, FindingType.access_sale, FindingType.credential_exposure]:
        categories.append("Reputational Risk")
        categories.append("Legal Risk")
    if not categories:
        categories.append("Security Risk")
        
    risk_entry = RiskRegister(
        org_id=db_finding.org_id,
        finding_id=str(db_finding.id),
        title=f"Accepted Risk: {db_finding.title}",
        description=db_finding.description,
        risk_level=db_finding.severity,
        risk_categories=categories,
        owner=db_finding.assigned_to,
        action_plan=f"Risk formally accepted. Justification: {request.justification}. Expires: {request.expiration_date}"
    )
    db.add(risk_entry)
    
    await db.commit()
    return {"status": "success", "action": "risk_accepted", "finding_id": finding_id, "new_status": "accepted", "risk_register_id": str(risk_entry.id)}

@router.post("/{finding_id}/ticket")
async def create_ticket(finding_id: str, request: CreateTicketRequest, org_id: str, db: AsyncSession = Depends(get_db)):
    """Creates an external ticket (Jira/ServiceNow) for the finding and records it as a Cyber Risk."""
    try:
        finding_uuid = uuid.UUID(finding_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid finding ID format")
        
    result = await db.execute(select(Finding).where(Finding.id == finding_uuid))
    db_finding = result.scalar_one_or_none()
    if not db_finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    mock_ticket_id = f"{request.integration.upper()}-{str(uuid.uuid4())[:6]}"
    
    # Send Risk to RiskRegister as a formally tracked 'Cyber Risk'
    risk_entry = RiskRegister(
        org_id=db_finding.org_id,
        finding_id=str(db_finding.id),
        title=f"Cyber Risk Tracking: {db_finding.title}",
        description=db_finding.description,
        risk_level=db_finding.severity,
        risk_categories=["Cyber Risk", "Ticketing"],
        owner=db_finding.assigned_to,
        action_plan=f"Tracking ticket created via {request.integration.upper()}: {mock_ticket_id}. Awaiting resolution."
    )
    db.add(risk_entry)
    db_finding.status = FindingStatus.in_progress
    db_finding.remediation_notes = f"Ticket generated: {mock_ticket_id}"
    await db.commit()

    # Dispatch email if assignee exists
    if db_finding.assigned_to and "@" in db_finding.assigned_to:
        from app.services.email import send_assignment_notification_email
        import asyncio
        finding_url = f"https://vciso.local/findings/{finding_id}"
        asyncio.create_task(send_assignment_notification_email(
            to_email=db_finding.assigned_to,
            finding_title=db_finding.title,
            finding_url=finding_url
        ))

    return {
        "status": "success", 
        "action": "ticket_created", 
        "finding_id": finding_id, 
        "ticket_id": mock_ticket_id, 
        "risk_register_id": str(risk_entry.id), 
        "new_status": "in_progress"
    }

