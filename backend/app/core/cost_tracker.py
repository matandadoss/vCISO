from app.core.ai_provider import AIResponse
from app.core.query_router import BudgetStatus
from typing import Dict

class CostTracker:
    # Stub implementation. In production, writes to BigQuery: vciso_analytics.ai_query_costs

    async def record(self, ai_response: AIResponse, workflow: str, org_id: str, was_downgraded: bool = False):
        """Write to BigQuery asynchronously (fire-and-forget, do not block the response)."""
        pass

    async def get_daily_spend(self, org_id: str) -> float:
        """Query BigQuery for today's total spend for this org."""
        return 0.0

    async def get_monthly_spend(self, org_id: str) -> float:
        """Monthly aggregate."""
        return 0.0

    async def get_spend_by_workflow(self, org_id: str, days: int = 30) -> Dict[str, float]:
        """Breakdown by workflow: chat, correlation, reporting, etc."""
        return {"correlation": 0.0, "chat": 0.0}

    async def get_spend_by_tier(self, org_id: str, days: int = 30) -> Dict[str, dict]:
        """Breakdown by tier with query counts and avg cost."""
        return {}

    async def get_budget_status(self, org_id: str) -> BudgetStatus:
        """Returns daily limit, daily spent, monthly limit, monthly spent, status (ok/warning/critical)."""
        return BudgetStatus(
            daily_limit_usd=10.0,
            daily_spent_usd=0.0,
            daily_remaining_usd=10.0,
            daily_pct_used=0.0,
            monthly_limit_usd=200.0,
            monthly_spent_usd=0.0,
            monthly_remaining_usd=200.0,
            monthly_pct_used=0.0,
            status="ok",
            most_expensive_workflow="chat",
            avg_cost_per_query_usd=0.0,
            total_queries_today=0,
            queries_downgraded_today=0
        )
