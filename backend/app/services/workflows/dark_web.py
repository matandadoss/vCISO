import uuid
from typing import Any, List
from app.services.workflows.base import BaseWorkflow, NormalizedFinding
from app.models.domain import WorkflowName, Severity

class DarkWebWorkflow(BaseWorkflow):
    workflow_name = WorkflowName.dark_web

    async def ingest(self, org_id: str) -> List[Any]:
        # Connectors: RecordedFutureDarkWebConnector, FlashpointConnector, DarkOwlConnector, GenericDarkWebConnector
        return [
            {
                "id": f"dw-{uuid.uuid4()}",
                "type": "access_sale",
                "source": "exploit.in",
                "severity": "CRITICAL",
                "description": "Initial Access Broker auctioning VPN access to fintech organization with $500M revenue"
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
                title=f"Dark Web Mention: {raw.get('type')}",
                description=raw.get("description", "Dark web signal observed."),
                severity=sev,
                source_finding_id=raw.get("id"),
                affected_asset_identifier="org_domain",
                raw_data=raw
            )
            normalized.append(norm)
            
        return normalized

    async def sync_graph(self, findings: List['Finding'], org_id: str):
        # Finding -[:ATTRIBUTED_TO]-> ThreatActor (when actor is identified)
        await super().sync_graph(findings, org_id)
