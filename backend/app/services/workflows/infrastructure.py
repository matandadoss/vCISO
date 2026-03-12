import uuid
from typing import Any, List
from app.services.workflows.base import BaseWorkflow, NormalizedFinding
from app.models.domain import WorkflowName, Severity

class InfrastructureRiskWorkflow(BaseWorkflow):
    workflow_name = WorkflowName.infrastructure

    async def ingest(self, org_id: str) -> List[Any]:
        # Connectors: GCPSCCConnector, GCPCloudAssetInventoryConnector, GCPIAMPolicyAnalyzerConnector, GCPAuditLogConnector
        return [
            {
                "id": f"scc-misc-{uuid.uuid4()}",
                "category": "MISCONFIGURATION",
                "resource_name": "//storage.googleapis.com/public-bucket-1",
                "severity": "HIGH",
                "description": "GCS Bucket is publicly accessible"
            },
            {
                "id": f"iam-anom-{uuid.uuid4()}",
                "category": "ANOMALOUS_IAM_GRANT",
                "resource_name": "//cloudresourcemanager.googleapis.com/projects/my-project",
                "severity": "CRITICAL",
                "description": "roles/owner granted to external user"
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
                title=f"Infrastructure Risk: {raw.get('category')}",
                description=raw.get("description", "Misconfiguration detected"),
                severity=sev,
                source_finding_id=raw.get("id"),
                affected_asset_identifier=raw.get("resource_name"),
                raw_data=raw
            )
            normalized.append(norm)
            
        return normalized

    async def sync_graph(self, findings: List['Finding'], org_id: str):
        # Override to build specific relationships
        # e.g., Asset -[:IN_PROJECT]-> GCPProject
        # Identity -[:HAS_ACCESS_TO]-> Asset
        await super().sync_graph(findings, org_id)
