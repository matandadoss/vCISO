from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict, Any
from app.services.simulation_engine import SimulationEngine
from app.models.domain import ServiceTier
from app.core.auth import require_minimum_tier

router = APIRouter(
    prefix="/simulator", 
    tags=["simulator"],
    dependencies=[Depends(require_minimum_tier(ServiceTier.professional))]
)

class SimulationRequest(BaseModel):
    query: str

@router.post("/simulate")
async def run_simulation(request: SimulationRequest):
    """
    Takes a natural language query describing an architecture change and returns a simulated future state
    via the dynamic pathfinding engine.
    """
    result = await SimulationEngine.run_simulation(request.query)
    return result

class SimulatorFindingCommit(BaseModel):
    title: str
    severity: str
    description: str
    affected_asset: str
    remediation: str
    mitre_tactic: str

from fastapi import Depends
from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import Finding, FindingType, Severity, WorkflowName, FindingStatus
import uuid

@router.post("/findings/commit")
async def commit_simulator_findings(
    findings: List[SimulatorFindingCommit],
    org_id: str = "default",
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests transient findings from a What-If simulation into the permanent Risk database
    so they can be tracked and mitigated.
    """
    org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6") # mock org
    created_finding_ids = []
    
    for f in findings:
        severity_enum = Severity(f.severity.lower())
        finding = Finding(
            org_id=org_uuid,
            finding_type=FindingType.vulnerability,
            title=f.title,
            description=f.description,
            severity=severity_enum,
            risk_score=85.0 if severity_enum in [Severity.critical, Severity.high] else 40.0,
            source_workflow=WorkflowName.simulator,
            status=FindingStatus.new,
            mitre_techniques=[{"id": "SIM", "name": f.mitre_tactic, "tactic": f.mitre_tactic}],
            raw_data={"asset": f.affected_asset, "remediation": f.remediation}
        )
        db.add(finding)
        await db.flush()
        created_finding_ids.append(str(finding.id))
        
    await db.commit()
    
    return {"status": "success", "count": len(created_finding_ids), "ids": created_finding_ids}
