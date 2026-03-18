import re
from dataclasses import dataclass
from typing import Optional, Literal
from app.core.ai_provider import ModelTier

@dataclass
class QueryContext:
    org_id: str
    user_role: str
    open_finding_count: int
    critical_finding_count: int
    referenced_asset_ids: Optional[list[str]] = None
    referenced_asset_count: Optional[int] = 0
    session_cost_so_far_usd: float = 0.0
    daily_budget_remaining_usd: float = 10.0
    page_context: Optional[str] = None

@dataclass
class QueryClassification:
    tier: ModelTier
    routing_reason: str
    estimated_cost_usd: float
    sql_query: Optional[str]
    context_needed: list[str]
    requires_graph: bool

@dataclass
class BudgetStatus:
    daily_limit_usd: float
    daily_spent_usd: float
    daily_remaining_usd: float
    daily_pct_used: float
    monthly_limit_usd: float
    monthly_spent_usd: float
    monthly_remaining_usd: float
    monthly_pct_used: float
    status: Literal["ok", "warning", "critical"]
    most_expensive_workflow: str
    avg_cost_per_query_usd: float
    total_queries_today: int
    queries_downgraded_today: int

@dataclass
class BudgetCheckResult:
    allowed: bool
    forced_tier: ModelTier
    reason: str

class CostGuard:
    def __init__(self, cost_tracker, db):
        self.cost_tracker = cost_tracker
        self.db = db

    async def check_budget(self, tier: ModelTier, org_id: str) -> BudgetCheckResult:
        if tier == ModelTier.SEARCH_ONLY:
            return BudgetCheckResult(True, tier, "0 cost tier")
            
        remaining = 10.0
        if self.cost_tracker:
            status = await self.cost_tracker.get_budget_status(org_id)
            remaining = status.daily_remaining_usd

        if remaining < 0.10:
            return BudgetCheckResult(False, ModelTier.SEARCH_ONLY, "Budget critically low")
        elif remaining < 1.00:
            return BudgetCheckResult(False, ModelTier.FAST_CHEAP, "Budget low, down-tiering")
        return BudgetCheckResult(True, tier, "Budget OK")

class QueryRouter:
    SEARCH_PATTERNS = [
        (r"how many .*(finding|vuln|risk|alert)", "count_findings"),
        (r"list .*(finding|vuln|asset|vendor)", "list_entities"),
        (r"what is (my |the )?(overall |current )?compliance", "compliance_score"),
        (r"show me .*(critical|high|open)", "filtered_list"),
        (r"status of .*(finding|ticket|remediation)", "finding_status"),
        (r"when (was|is) .*(due|detected|resolved)", "date_lookup"),
        (r"which assets? (are|have) .*(vulnerable|exposed|critical)", "asset_filter"),
    ]

    DEEP_PATTERNS = [
        (r"(biggest|most critical|top|highest) (risk|threat|concern)", "top_risk"),
        (r"(executive|board|ceo|ciso) (summary|report|brief)", "executive_report"),
        (r"(attack|exploit|breach|compromise) (path|chain|scenario)", "attack_path"),
        (r"novel (pattern|threat|attack|trend)", "novel_detection"),
        (r"(remediation|fix|priorit) .*(plan|roadmap|sequence)", "remediation_plan"),
        (r"correlate across", "cross_workflow_correlation"),
    ]

    def classify(self, query: str, context: QueryContext) -> QueryClassification:
        for pattern, name in self.SEARCH_PATTERNS:
            if re.search(pattern, query.lower()):
                return QueryClassification(
                    tier=ModelTier.SEARCH_ONLY,
                    routing_reason=f"Matched search pattern: {name}",
                    estimated_cost_usd=0.0,
                    sql_query=self.build_sql_for_tier0(name, query, context.org_id),
                    context_needed=[],
                    requires_graph=False
                )
                
        for pattern, name in self.DEEP_PATTERNS:
            if re.search(pattern, query.lower()):
                return QueryClassification(
                    tier=ModelTier.DEEP,
                    routing_reason=f"Matched deep pattern: {name}",
                    estimated_cost_usd=0.15,
                    sql_query=None,
                    context_needed=["findings", "assets"],
                    requires_graph=True
                )
                
        score = self._score_complexity(query, context)
        
        if score <= 3:
            tier = ModelTier.FAST_CHEAP
            est_cost = 0.001
        elif score <= 7:
            tier = ModelTier.BALANCED
            est_cost = 0.02
        else:
            tier = ModelTier.DEEP
            est_cost = 0.15
            
        return QueryClassification(
            tier=tier,
            routing_reason=f"Complexity score: {score}/10",
            estimated_cost_usd=est_cost,
            sql_query=None,
            context_needed=["findings"],
            requires_graph=False
        )

    def _score_complexity(self, query: str, context: QueryContext) -> int:
        score = 0
        domains = ["vulnerability", "threat", "vendor", "compliance", "control", "osint", "dark web", "infrastructure", "cve"]
        score += sum(1 for d in domains if d in query.lower())

        if any(w in query.lower() for w in ["explain", "why", "narrative", "story", "tell me", "describe"]):
            score += 2
        if any(w in query.lower() for w in ["correlat", "relat", "connect", "link", "cause", "because"]):
            score += 2
        if any(w in query.lower() for w in ["trend", "over time", "compare", "last month", "last week"]):
            score += 1

        asset_count = context.referenced_asset_count or 0
        if asset_count > 5:
            score += 1

        return min(score, 10)

    def build_sql_for_tier0(self, pattern_name: str, query: str, org_id: str) -> str:
        # Prevent SQL injection by strictly validating org_id as UUID
        import uuid
        try:
            valid_org_id = str(uuid.UUID(org_id))
        except ValueError:
            return ""
            
        templates = {
            "count_findings": f"SELECT severity, COUNT(*) FROM findings WHERE org_id='{valid_org_id}' AND status='open' GROUP BY severity",
            "compliance_score": f"SELECT f.framework_name, f.overall_compliance_pct FROM compliance_frameworks f WHERE f.org_id='{valid_org_id}'",
        }
        return templates.get(pattern_name, "")
