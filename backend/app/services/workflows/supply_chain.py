import uuid
from typing import Any, List
from app.services.workflows.base import BaseWorkflow, NormalizedFinding
from app.models.domain import WorkflowName, Severity

class SupplyChainRiskWorkflow(BaseWorkflow):
    workflow_name = WorkflowName.supply_chain

    async def ingest(self, org_id: str) -> List[Any]:
        # GCPArtifactRegistryConnector and SBOMConnector etc.
        return [
            {
                "id": f"sbom-cve-{uuid.uuid4()}",
                "vendor_id": f"vendor-{uuid.uuid4()}",
                "package": "lodash",
                "cve": "CVE-2020-28500",
                "severity": "CRITICAL",
                "description": "Prototype pollution in lodash dependency"
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
                title=f"Supply Chain Risk: {raw.get('cve')} in {raw.get('package')}",
                description=raw.get("description", "Vulnerability in third party component"),
                severity=sev,
                source_finding_id=raw.get("id"),
                affected_asset_identifier=f"vendor::{raw.get('vendor_id')}",
                cve_id=raw.get("cve"),
                raw_data=raw
            )
            normalized.append(norm)
            
        return normalized

    async def sync_graph(self, findings: List['Finding'], org_id: str):
        # Vendor -[:SUPPLIES_COMPONENT]-> Asset
        # Asset -[:HAS_VULNERABILITY {via: vendor}]-> Vulnerability
        await super().sync_graph(findings, org_id)
