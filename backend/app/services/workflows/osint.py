import uuid
from typing import Any, List
from app.services.workflows.base import BaseWorkflow, NormalizedFinding
from app.models.domain import WorkflowName, Severity

class OSINTWorkflow(BaseWorkflow):
    workflow_name = WorkflowName.osint

    async def ingest(self, org_id: str) -> List[Any]:
        # Connectors: GitHubDorkConnector, ShodanConnector, CertificateTransparencyConnector, BreachDataConnector, GoogleDorkConnector
        return [
            {
                "id": f"osint-github-{uuid.uuid4()}",
                "type": "credential_exposure",
                "source": "github_dork",
                "asset": "github.com/org/repo",
                "severity": "HIGH",
                "description": "Hardcoded GCP Service Account key found in public repository"
            },
            {
                "id": f"osint-shodan-{uuid.uuid4()}",
                "type": "osint_exposure",
                "source": "shodan",
                "asset": "dev.api.acmecorp.com",
                "severity": "MEDIUM",
                "description": "Unknown sub-domain exposing administrative interface detected via Shodan"
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
                title=f"OSINT Discovery: {raw.get('type')} via {raw.get('source')}",
                description=raw.get("description", "OSINT discovery."),
                severity=sev,
                source_finding_id=raw.get("id"),
                affected_asset_identifier=raw.get("asset"),
                raw_data=raw
            )
            normalized.append(norm)
            
        return normalized

    async def sync_graph(self, findings: List['Finding'], org_id: str):
        # Ex: Asset -[:HAS_VULNERABILITY {type: "exposed_service"}]-> Vulnerability
        await super().sync_graph(findings, org_id)
