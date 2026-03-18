import json
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel
from app.core.ai_provider import AIProviderClient, AIRequest, ModelTier
from app.core.query_router import QueryRouter, QueryContext
from app.models.domain import Finding
from app.services.correlation.rule_engine import CorrelatedFinding
import uuid
from datetime import datetime
from app.models.domain import Severity

class LLMAnalysisResult(BaseModel):
    narrative: str
    risk_level: str
    recommendations: List[str]
    time_to_compromise_estimate: str
    non_obvious_connections: List[str]

class RemediationRecommendation(BaseModel):
    priority: int
    action: str
    effort: str
    risk_reduction_pct: float
    dependencies: List[str]
    
    @classmethod
    def list_schema(cls) -> dict:
        return {
            "type": "array",
            "items": cls.model_json_schema()
        }

class NovelPatternResult(BaseModel):
    pattern_type: str
    description: str
    affected_entities: List[str]
    confidence: float

    @classmethod
    def list_schema(cls) -> dict:
        return {
            "type": "array",
            "items": cls.model_json_schema()
        }

class ChatAnswerResult(BaseModel):
    answer: str
    tier_used: ModelTier
    model_used: Optional[str] = None
    cost_usd: float = 0.0
    routing_reason: str
    sql_executed: Optional[str] = None

class CorrelationContext:
    def __init__(self, finding: Finding):
        self.finding = finding
        # Mock Context
        
def load_prompt(name: str) -> str:
    # Stub: read from app/correlation/prompts/{name}.md
    return f"You are a vCISO AI answering based on template {name}."

class LLMCorrelationEngine:
    def __init__(self, ai_client: AIProviderClient, query_router: QueryRouter, db=None):
        self.ai = ai_client
        self.router = query_router
        self.db = db

    async def analyze_finding(self, finding: Finding, context: CorrelationContext) -> LLMAnalysisResult:
        request = AIRequest(
            system_prompt=load_prompt("finding_analysis_system"),
            user_prompt=self._build_finding_prompt(finding, context),
            tier=ModelTier.DEEP, 
            structured_output_schema=LLMAnalysisResult.model_json_schema(),
            metadata={"workflow": "correlation", "finding_id": str(finding.id)},
        )
        response = await self.ai.complete(request)
        if response and response.structured_output:
            return LLMAnalysisResult.model_validate(response.structured_output)
        return LLMAnalysisResult(
            narrative="Analysis failed or unavailable.",
            risk_level="Unknown",
            recommendations=[],
            time_to_compromise_estimate="Unknown",
            non_obvious_connections=[]
        )

    async def generate_risk_narrative(self, top_findings: List[Finding]) -> str:
        request = AIRequest(
            system_prompt=load_prompt("risk_narrative_system"),
            user_prompt=self._build_narrative_prompt(top_findings),
            tier=ModelTier.DEEP,
            metadata={"workflow": "reporting"},
        )
        response = await self.ai.complete(request)
        return response.content if response else "Narrative unavailable."

    async def suggest_remediation_priorities(self, findings: List[Finding], constraints: dict) -> List[RemediationRecommendation]:
        request = AIRequest(
            system_prompt=load_prompt("remediation_system"),
            user_prompt=self._build_remediation_prompt(findings, constraints),
            tier=ModelTier.BALANCED,
            structured_output_schema=RemediationRecommendation.list_schema(),
            metadata={"workflow": "remediation"},
        )
        response = await self.ai.complete(request)
        if response and response.structured_output:
            return [RemediationRecommendation.model_validate(r) for r in response.structured_output]
        return []

    async def detect_novel_patterns(self, recent_findings: List[Finding], historical_findings: List[Finding]) -> List[CorrelatedFinding]:
        request = AIRequest(
            system_prompt=load_prompt("novel_pattern_system"),
            user_prompt=self._build_pattern_prompt(recent_findings, historical_findings),
            tier=ModelTier.DEEP,
            structured_output_schema=NovelPatternResult.list_schema(),
            metadata={"workflow": "pattern_detection"},
        )
        response = await self.ai.complete(request)
        if response and response.structured_output:
            return self._convert_to_correlated_findings(response.structured_output)
        return []

    async def answer_security_question(self, question: str, context: QueryContext) -> ChatAnswerResult:
        classification = self.router.classify(question, context)

        if classification.tier == ModelTier.SEARCH_ONLY:
            results = await self._execute_search_query(classification.sql_query, context.org_id)
            return ChatAnswerResult(
                answer=self._format_search_results(results, question),
                tier_used=ModelTier.SEARCH_ONLY,
                cost_usd=0.0,
                routing_reason=classification.routing_reason,
                sql_executed=classification.sql_query,
            )

        db_context = await self._load_context(classification.context_needed, context.org_id)

        request = AIRequest(
            system_prompt=load_prompt("vciso_chat_system"),
            user_prompt=self._build_chat_prompt(question, db_context, context.page_context),
            tier=classification.tier,
            metadata={"workflow": "chat"},
        )
        response = await self.ai.complete(request)

        return ChatAnswerResult(
            answer=response.content if response else "No response",
            tier_used=classification.tier,
            model_used=response.model_used if response else None,
            cost_usd=response.cost_usd if response else 0.0,
            routing_reason=classification.routing_reason,
        )

    # Stubs for private methods
    def _build_finding_prompt(self, finding: Finding, context: CorrelationContext) -> str:
        return f"Analyze finding: {finding.title}"

    def _build_narrative_prompt(self, findings: List[Finding]) -> str:
        return f"Create narrative for {len(findings)} findings."

    def _build_remediation_prompt(self, findings: List[Finding], constraints: dict) -> str:
        return "Suggest remediations"

    def _build_pattern_prompt(self, recent: List[Finding], historical: List[Finding]) -> str:
        return "Find patterns"

    def _convert_to_correlated_findings(self, data: List[dict]) -> List[CorrelatedFinding]:
        return [
            CorrelatedFinding(
                id=str(uuid.uuid4()),
                org_id="test",
                title=d.get("pattern_type", "Novel Pattern"),
                description=d.get("description", ""),
                severity=Severity.medium,
                correlated_finding_ids=[],
                affected_asset_ids=d.get("affected_entities", []),
                correlation_engine_rule="AI_NOVEL_PATTERN",
                created_at=datetime.utcnow()
            ) for d in data
        ]

    async def _execute_search_query(self, query: str, org_id: str):
        return [{"result": "stub"}]

    def _format_search_results(self, results: list, question: str) -> str:
        return f"Search Result: {results}"

    async def _load_context(self, context_needed: list, org_id: str):
        return {"stub": True}

    def _build_chat_prompt(self, question: str, db_context: dict, page_context: Optional[str] = None) -> str:
        if page_context:
            return f"Context: The user is currently reviewing the following page data:\n{page_context}\n\nUser Question: {question}"
        return question
