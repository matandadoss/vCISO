from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.domain import Severity

router = APIRouter(prefix="/findings", tags=["findings"])

class FindingResponse(BaseModel):
    id: str
    title: str
    severity: Severity
    risk_score: float
    status: str
    detected_at: datetime
    affected_asset_ids: list[str] = []

@router.get("")
async def list_findings(
    org_id: str,
    severity: Optional[Severity] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    # Stub: return mock data
    return {
        "items": [
            {
                "id": str(uuid.uuid4()),
                "title": "Unpatched Server",
                "severity": Severity.high,
                "risk_score": 82.5,
                "status": "new",
                "detected_at": datetime.utcnow().isoformat(),
                "affected_asset_ids": ["server-1"]
            }
        ],
        "total": 1,
        "limit": limit,
        "offset": offset
    }

@router.get("/{finding_id}")
async def get_finding(finding_id: str, org_id: str):
    """Provides detailed information about a specific finding for the Investigate view."""
    return {
        "id": finding_id,
        "title": "Unpatched Production Database Server",
        "severity": Severity.critical,
        "risk_score": 95.5,
        "status": "new",
        "description": "CVE-2023-44487 (HTTP/2 Rapid Reset) detected on public-facing ingress controllers.",
        "detected_at": datetime.utcnow().isoformat(),
        "workflow": "vulnerability",
        "root_cause_analysis": "The Nginx ingress controller in the production GKE cluster is running version 1.23.0, which is vulnerable to the HTTP/2 Rapid Reset attack. This allows for potential Denial of Service (DoS) by an unauthenticated attacker.",
        "affected_assets": [
            {"id": "ingress-prod-1", "name": "nginx-ingress-controller-prod", "type": "Kubernetes Deployment", "criticality": "high"},
            {"id": "lb-ext-1", "name": "ext-https-lb", "type": "GCP External Load Balancer", "criticality": "high"}
        ],
        "mitre_attack": [
            {"id": "T1498", "name": "Network Denial of Service", "tactic": "Impact"},
            {"id": "T1190", "name": "Exploit Public-Facing Application", "tactic": "Initial Access"}
        ],
        "remediation": {
            "manual_steps": [
                "1. Update the Nginx ingress controller image tag in deployment manifests to >=1.25.3.",
                "2. Apply the updated manifests to the production cluster.",
                "3. Monitor cluster metrics for unusual HTTP/2 stream reset rates."
            ],
            "automated_available": True,
            "automated_description": "Auto-patch via GitOps: Generate PR to update Helm chart version in infrastructure repository."
        },
        "linked_items": [
            {"id": "vuln-scan-102", "type": "Scan Report", "name": "Weekly External Exposure Scan"},
            {"id": "ctrl-32", "type": "Compliance Control", "name": "SOC 2 CC7.1 - Vulnerability Management"}
        ]
    }

from pydantic import BaseModel

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
async def assign_finding(finding_id: str, request: AssignRequest, org_id: str):
    """Assigns a finding to a specific user or team."""
    return {"status": "success", "action": "assigned", "finding_id": finding_id, "owner": request.owner_id}

@router.post("/{finding_id}/remediate")
async def mark_remediated(finding_id: str, org_id: str):
    """Marks a finding as fully remediated/resolved."""
    return {"status": "success", "action": "remediated", "finding_id": finding_id, "new_status": "remediated"}

@router.post("/{finding_id}/accept-risk")
async def accept_risk(finding_id: str, request: AcceptRiskRequest, org_id: str):
    """Accepts the risk of a finding, optionally until an expiration date."""
    return {"status": "success", "action": "risk_accepted", "finding_id": finding_id, "new_status": "risk_accepted"}

@router.post("/{finding_id}/ticket")
async def create_ticket(finding_id: str, request: CreateTicketRequest, org_id: str):
    """Creates an external ticket (Jira/ServiceNow) for the finding."""
    # Mocking external integration
    mock_ticket_id = f"{request.integration.upper()}-{str(uuid.uuid4())[:6]}"
    return {"status": "success", "action": "ticket_created", "finding_id": finding_id, "ticket_id": mock_ticket_id}
