import json
from abc import ABC, abstractmethod
from typing import Any, List
from pydantic import BaseModel
from datetime import datetime
from app.models.domain import Finding, WorkflowName
from app.services.graph_service import GraphService

class NormalizedFinding(BaseModel):
    title: str
    description: str
    severity: str
    risk_score: float = 0.0
    source_finding_id: str
    affected_asset_identifier: str
    cve_id: str = None
    epss_score: float = None
    raw_data: dict = {}

class WorkflowResult(BaseModel):
    workflow_name: str
    findings_created: int
    findings_updated: int
    errors: int
    execution_time_ms: int

class BaseWorkflow(ABC):
    workflow_name: WorkflowName
    topic_path: str = "projects/{project_id}/topics/findings-events"

    def __init__(self, db_session, graph_service: GraphService, pubsub_client=None, project_id: str = "your-project-id"):
        self.db = db_session
        self.graph = graph_service
        self.pubsub = pubsub_client
        self.topic_path = self.topic_path.format(project_id=project_id)

    async def execute(self, org_id: str) -> WorkflowResult:
        start_ms = datetime.utcnow().timestamp() * 1000
        
        raw_data = await self.ingest(org_id)
        normalized = await self.normalize(raw_data, org_id)
        findings = await self.create_findings(normalized, org_id)
        await self.sync_graph(findings, org_id)
        await self.score_findings(findings, org_id)
        await self.emit_events(findings)

        execution_time_ms = int(datetime.utcnow().timestamp() * 1000 - start_ms)
        return WorkflowResult(
            workflow_name=self.workflow_name.value,
            findings_created=len(findings),
            findings_updated=0,
            errors=0,
            execution_time_ms=execution_time_ms
        )

    @abstractmethod
    async def ingest(self, org_id: str) -> List[Any]:
        pass

    @abstractmethod
    async def normalize(self, raw_data: List[Any], org_id: str) -> List[NormalizedFinding]:
        pass

    async def create_findings(self, normalized_data: List[NormalizedFinding], org_id: str) -> List[Finding]:
        # In a real implementation this would upsert to Cloud SQL
        # For now, we mock the creation of Finding objects
        findings = []
        for norm in normalized_data:
            finding = Finding(
                org_id=org_id,
                finding_type="vulnerability", # Simplified
                title=norm.title,
                description=norm.description,
                severity=norm.severity,
                risk_score=norm.risk_score,
                source_workflow=self.workflow_name,
                source_finding_id=norm.source_finding_id,
                raw_data=norm.raw_data,
                status="new",
                detected_at=datetime.utcnow()
            )
            # Add to DB session here normally
            findings.append(finding)
        return findings

    async def sync_graph(self, findings: List[Finding], org_id: str):
        # Implementation for syncing nodes to Neo4j
        for finding in findings:
            await self.graph.sync_entity("Finding", {"id": str(finding.id), "type": "finding"})
            # Sync relationships based on Finding type

    async def score_findings(self, findings: List[Finding], org_id: str):
        # Implementation to score findings
        pass

    async def emit_events(self, findings: List[Finding]):
        """Publish to Pub/Sub findings-events topic."""
        if not self.pubsub:
            return # Skip if no pubsub client configured (e.g. testing)
            
        for finding in findings:
            message = {
                "event_type": "finding_created",
                "org_id": str(finding.org_id),
                "finding_id": str(finding.id),
                "severity": str(finding.severity),
                "source_workflow": str(finding.source_workflow),
                "risk_score": finding.risk_score,
                "timestamp": datetime.utcnow().isoformat(),
            }
            try:
                # Assuming google-cloud-pubsub PublisherClient API
                data_str = json.dumps(message).encode("utf-8")
                self.pubsub.publish(
                    self.topic_path,
                    data_str,
                    severity=str(finding.severity),
                    workflow=str(finding.source_workflow),
                )
            except Exception as e:
                # Log error in production
                pass
