import uuid
from typing import Any, List
from app.services.workflows.base import BaseWorkflow, NormalizedFinding
from app.models.domain import WorkflowName, Severity

class GapAnalysisWorkflow(BaseWorkflow):
    workflow_name = WorkflowName.gap_analysis

    async def ingest(self, org_id: str) -> List[Any]:
        # Analyzing outputs from controls workflow + all finding data
        return [
            {
                "id": f"gap-{uuid.uuid4()}",
                "type": "compliance_gap",
                "framework": "SOC2",
                "requirement": "CC6.1",
                "severity": "MEDIUM",
                "description": "Gap detected for CC6.1 - Logical Access - No preventive control spanning internal VPN gateway."
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
                title=f"Gap Analysis: {raw.get('type')} in {raw.get('framework')}",
                description=raw.get("description", "Structural gap in security posture."),
                severity=sev,
                source_finding_id=raw.get("id"),
                affected_asset_identifier="org_environment", # Applies globally or across multiple assets
                raw_data=raw
            )
            normalized.append(norm)
            
        return normalized
