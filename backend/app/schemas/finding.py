from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from app.models.domain import Severity, FindingStatus, FindingType, WorkflowName

class FindingBase(BaseModel):
    model_config = ConfigDict(extra='forbid')
    title: str
    finding_type: FindingType
    description: Optional[str] = None
    severity: Severity
    risk_score: float = 0.0
    source_workflow: WorkflowName
    source_finding_id: Optional[str] = None
    affected_asset_ids: Optional[Dict[str, Any]] = None
    affected_vendor_ids: Optional[Dict[str, Any]] = None
    related_threat_actor_ids: Optional[Dict[str, Any]] = None
    related_cve_ids: Optional[Dict[str, Any]] = None
    related_control_ids: Optional[Dict[str, Any]] = None
    mitre_techniques: Optional[Dict[str, Any]] = None
    status: FindingStatus = FindingStatus.new
    assigned_to: Optional[str] = None
    remediation_notes: Optional[str] = None
    correlated_finding_ids: Optional[Dict[str, Any]] = None
    correlation_explanation: Optional[str] = None
    evidence: Optional[Dict[str, Any]] = None
    raw_data: Optional[Dict[str, Any]] = None
    detected_at: Optional[datetime] = None
    triaged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    sla_deadline: Optional[datetime] = None

class FindingCreate(FindingBase):
    org_id: uuid.UUID

class FindingUpdate(BaseModel):
    model_config = ConfigDict(extra='forbid')
    title: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[Severity] = None
    risk_score: Optional[float] = None
    status: Optional[FindingStatus] = None
    assigned_to: Optional[str] = None
    remediation_notes: Optional[str] = None
    triaged_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None

class FindingResponse(FindingBase):
    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
