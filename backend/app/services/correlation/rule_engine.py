import uuid
from typing import List, Optional
from dataclasses import dataclass
from datetime import datetime
from app.models.domain import Finding, Severity

@dataclass
class CorrelatedFinding:
    id: str
    org_id: str
    title: str
    description: str
    severity: Severity
    correlated_finding_ids: List[str]
    affected_asset_ids: List[str]
    correlation_engine_rule: str
    created_at: datetime
    
class DeterministicRuleEngine:
    async def evaluate_all(self, findings: List[Finding], db) -> List[CorrelatedFinding]:
        """Run all enabled rules against the new findings. Return correlations found."""
        correlations = []
        for finding in findings:
            if finding.severity in [Severity.critical, Severity.high]:
                # Implement EXPLOIT_PATH_DETECTION, etc based on findings
                if finding.finding_type == "vulnerability" and finding.raw_data.get("exploit_availability") in ["weaponized", "actively_exploited"]:
                    correlations.append(CorrelatedFinding(
                        id=str(uuid.uuid4()),
                        org_id=str(finding.org_id),
                        title="Actively Exploitable Internet-Facing Asset",
                        description=f"Automated correlation for exploit path detected on asset {finding.affected_asset_ids}.",
                        severity=Severity.critical,
                        correlated_finding_ids=[str(finding.id)],
                        affected_asset_ids=finding.affected_asset_ids or [],
                        correlation_engine_rule="EXPLOIT_PATH_DETECTION",
                        created_at=datetime.utcnow()
                    ))
        return correlations
