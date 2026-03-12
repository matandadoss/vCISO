import uuid
from typing import Any, List
from app.services.workflows.base import BaseWorkflow, NormalizedFinding
from app.models.domain import WorkflowName, Severity

class ControlsWorkflow(BaseWorkflow):
    workflow_name = WorkflowName.controls

    async def ingest(self, org_id: str) -> List[Any]:
        # Connectors: MDMConnector, EDRConnector, SIEMConnector, IdentityConnector, VulnScannerCoverageConnector
        return [
            {
                "id": f"ctrl-gap-{uuid.uuid4()}",
                "type": "control_gap",
                "control_name": "Endpoint Detection and Response (EDR)",
                "asset": "exec-laptop-04",
                "severity": "HIGH",
                "description": "CrowdStrike sensor missing on executive endpoint"
            }
        ]

    async def normalize(self, raw_data: List[Any], org_id: str) -> List[NormalizedFinding]:
        normalized = []
        sev_map = {
            "CRITICAL": Severity.critical,
            "HIGH": Severity.high,
            "MEDIUM": Severity.medium,
            "LOW": Severity.low,
        }

        for raw in raw_data:
            sev = sev_map.get(str(raw.get("severity")).upper(), Severity.medium)
            norm = NormalizedFinding(
                title=f"Control Gap: {raw.get('control_name')} on {raw.get('asset')}",
                description=raw.get("description", "Security control not deployed properly."),
                severity=sev,
                source_finding_id=raw.get("id"),
                affected_asset_identifier=raw.get("asset"),
                raw_data=raw
            )
            normalized.append(norm)
            
        # Implementation to update SecurityControl records with deployment_coverage_pct and effectiveness_score goes here.
        return normalized
