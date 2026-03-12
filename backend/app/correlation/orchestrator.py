from app.services.correlation.rule_engine import DeterministicRuleEngine, CorrelatedFinding
from app.services.correlation.graph_engine import GraphCorrelationEngine
from app.correlation.llm_engine import LLMCorrelationEngine, CorrelationContext
from app.core.query_router import QueryRouter
from app.core.ai_provider import AIProviderClient, ModelTier
from app.models.domain import Finding, Severity

class CorrelationOrchestrator:
    def __init__(self, rule_engine: DeterministicRuleEngine, graph_engine: GraphCorrelationEngine, 
                 llm_engine: LLMCorrelationEngine, query_router: QueryRouter, 
                 ai_client: AIProviderClient, db, pubsub_client):
        self.rule_engine = rule_engine
        self.graph_engine = graph_engine
        self.llm_engine = llm_engine
        self.router = query_router
        self.ai_client = ai_client
        self.db = db
        self.pubsub = pubsub_client

    async def process_new_findings(self, findings: list[Finding]):
        rule_results = await self.rule_engine.evaluate_all(findings, self.db)
        
        affected_org_ids = {f.org_id for f in findings}
        graph_results = []
        for org_id in affected_org_ids:
            graph_results += await self.graph_engine.run_all_analyses(org_id)
            
        merged = self.deduplicate_correlations(rule_results + graph_results)
        
        for finding in merged:
            finding.risk_score = await self.score_correlated_finding(finding)

        critical_findings = [f for f in merged if f.severity == Severity.critical] # Simplified comparison for now
        
        # In actual ORM these would be full objects
        for finding in critical_findings:
            budget_check = await self.ai_client.cost_guard.check_budget(ModelTier.DEEP, finding.org_id)
            if budget_check.allowed:
                context = await self.build_context(finding)
                llm_result = await self.llm_engine.analyze_finding(finding, context)
                finding.correlation_explanation = llm_result.narrative
                finding.remediation_notes = "\n".join(llm_result.recommendations)
            else:
                finding.correlation_explanation = f"[AI analysis skipped: {budget_check.reason}. Rule-based correlation: {finding.correlation_engine_rule}]"
                await self.notify_budget_constraint(finding.org_id, budget_check)
                
        await self.store_findings(merged)
        await self.route_alerts(merged)
        await self.refresh_dashboard_data(affected_org_ids)

    async def run_scheduled_analysis(self):
        for org_id in await self.get_active_orgs():
            await self.graph_engine.run_all_analyses(org_id)
            budget = await self.ai_client.cost_guard.check_budget(ModelTier.DEEP, org_id)
            if budget.allowed:
                recent = await self.get_recent_findings(org_id, days=7)
                historical = await self.get_historical_sample(org_id)
                await self.llm_engine.detect_novel_patterns(recent, historical)

    async def run_weekly_narrative(self):
        for org_id in await self.get_active_orgs():
            top_findings = await self.get_top_findings(org_id, limit=10)
            narrative = await self.llm_engine.generate_risk_narrative(top_findings)
            await self.store_narrative(org_id, narrative)

    # Stubs
    def deduplicate_correlations(self, findings: list[CorrelatedFinding]) -> list[CorrelatedFinding]:
        return findings

    async def score_correlated_finding(self, finding: CorrelatedFinding) -> float:
        return 95.0

    async def build_context(self, finding) -> CorrelationContext:
        return CorrelationContext(finding=finding)

    async def notify_budget_constraint(self, org_id, budget_check):
        pass

    async def store_findings(self, merged):
        pass

    async def route_alerts(self, findings):
        pass

    async def refresh_dashboard_data(self, affected_org_ids):
        pass

    async def get_active_orgs(self) -> list[str]:
        return ["test-org-1"]
        
    async def get_recent_findings(self, org_id: str, days: int) -> list[Finding]:
        return []
        
    async def get_historical_sample(self, org_id: str) -> list[Finding]:
        return []

    async def get_top_findings(self, org_id: str, limit: int) -> list[Finding]:
        return []

    async def store_narrative(self, org_id: str, narrative: str):
        pass
