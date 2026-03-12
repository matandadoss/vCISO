import uuid
from typing import Any, List
from app.services.workflows.base import BaseWorkflow, NormalizedFinding
from app.models.domain import WorkflowName, Severity

class ThreatWorkflow(BaseWorkflow):
    workflow_name = WorkflowName.threat

    async def ingest(self, org_id: str) -> List[Any]:
        # ThreatIntelPlatformConnector, RecordedFutureConnector, ChronicleConnector, VirusTotalConnector
        return [
            {
                "id": f"threat-{uuid.uuid4()}",
                "indicator_type": "ip",
                "value": "198.51.100.42",
                "threat_actor": "FIN7",
                "matched_asset": "prod-gateway-01",
                "severity": "CRITICAL",
                "description": "Observed communication with known FIN7 C2 infrastructure directly from production gateway"
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
                title=f"Threat Indicator Match: {raw.get('value')} on {raw.get('matched_asset')}",
                description=raw.get("description", "Threat intelligence correlation match."),
                severity=sev,
                source_finding_id=raw.get("id"),
                affected_asset_identifier=raw.get("matched_asset"),
                raw_data=raw
            )
            normalized.append(norm)
            
        return normalized

    async def sync_graph(self, findings: List['Finding'], org_id: str):
        # ThreatActor -[:USES]-> Technique
        # ThreatActor -[:TARGETS]-> Asset
        # Indicator -[:OBSERVED_ON]-> Asset
        # Vulnerability -[:EXPLOITED_BY]-> ThreatActor
        await super().sync_graph(findings, org_id)
