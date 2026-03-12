import uuid
from typing import Any, List
from app.services.workflows.base import BaseWorkflow, NormalizedFinding
from app.models.domain import WorkflowName, Severity

class ComplianceWorkflow(BaseWorkflow):
    workflow_name = WorkflowName.compliance

    async def ingest(self, org_id: str) -> List[Any]:
        # Connectors: GRCConnector, GCPOrganizationPolicyConnector, ManualEvidenceConnector
        return [
            {
                "id": f"comp-{uuid.uuid4()}",
                "type": "compliance_gap",
                "framework": "PCI-DSS-4.0",
                "requirement": "Req 8",
                "severity": "HIGH",
                "description": "Insufficient MFA enforcement across cardholder data environment (CDE) boundary."
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
                title=f"Compliance Gap: {raw.get('framework')} - {raw.get('requirement')}",
                description=raw.get("description", "Non-compliant status detected."),
                severity=sev,
                source_finding_id=raw.get("id"),
                affected_asset_identifier="cardholder_data_environment_boundary",
                raw_data=raw
            )
            normalized.append(norm)
            
        return normalized
