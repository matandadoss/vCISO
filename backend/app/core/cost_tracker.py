import uuid
import datetime
from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.domain import AIQueryLog, OrgAIBudget
from app.core.ai_provider import AIResponse
from app.core.query_router import BudgetStatus
from typing import Dict, Any, List

class CostTracker:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def record(self, ai_response: AIResponse, workflow: str, org_id: str, was_downgraded: bool = False):
        try:
            log = AIQueryLog(
                org_id=uuid.UUID(org_id),
                workflow=workflow,
                query_tier="standard",
                provider_used=ai_response.provider,
                model_used=ai_response.model,
                input_tokens=ai_response.usage.prompt_tokens if ai_response.usage else 0,
                output_tokens=ai_response.usage.completion_tokens if ai_response.usage else 0,
                cost_usd=ai_response.cost_usd,
                latency_ms=ai_response.latency_ms,
                was_downgraded=was_downgraded,
                downgrade_reason="Budget limit reached" if was_downgraded else None
            )
            self.db.add(log)
            await self.db.commit()
        except Exception as e:
            await self.db.rollback()
            print(f"Failed to record AI cost log: {e}")

    async def get_daily_spend(self, org_id: str) -> float:
        today = datetime.datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        stmt = select(func.sum(AIQueryLog.cost_usd)).where(
            AIQueryLog.org_id == uuid.UUID(org_id),
            AIQueryLog.timestamp >= today
        )
        res = await self.db.execute(stmt)
        val = res.scalar()
        return float(val) if val else 0.0

    async def get_monthly_spend(self, org_id: str) -> float:
        now = datetime.datetime.utcnow()
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        stmt = select(func.sum(AIQueryLog.cost_usd)).where(
            AIQueryLog.org_id == uuid.UUID(org_id),
            AIQueryLog.timestamp >= start_of_month
        )
        res = await self.db.execute(stmt)
        val = res.scalar()
        return float(val) if val else 0.0

    async def get_spend_by_workflow(self, org_id: str, days: int = 7) -> List[Dict[str, Any]]:
        threshold = datetime.datetime.utcnow() - datetime.timedelta(days=days)
        stmt = select(
            AIQueryLog.workflow,
            func.sum(AIQueryLog.cost_usd).label("total_cost")
        ).where(
            AIQueryLog.org_id == uuid.UUID(org_id),
            AIQueryLog.timestamp >= threshold
        ).group_by(AIQueryLog.workflow)
        res = await self.db.execute(stmt)
        
        # Merge with default known workflows to avoid empty tables
        active = {r.workflow: float(r.total_cost or 0) for r in res}
        defaults = ["auth", "correlation", "chat", "vulnerability_triaging", "simulator"]
        
        results = []
        for wf in set(list(active.keys()) + defaults):
            results.append({"workflow": wf, "cost": active.get(wf, 0.0)})
        return results

    async def get_spend_by_tier(self, org_id: str, days: int = 30) -> Dict[str, dict]:
        return {}
        
    async def get_budget_trends(self, org_id: str, days: int = 7) -> List[Dict[str, Any]]:
        # Get daily sum for the last X days
        threshold = datetime.datetime.utcnow() - datetime.timedelta(days=days-1)
        threshold = threshold.replace(hour=0, minute=0, second=0, microsecond=0)
        
        from sqlalchemy import text
        # Postgres date_trunc trick
        stmt = select(
            func.date_trunc('day', AIQueryLog.timestamp).label('day'),
            func.sum(AIQueryLog.cost_usd).label('cost')
        ).where(
            AIQueryLog.org_id == uuid.UUID(org_id),
            AIQueryLog.timestamp >= threshold
        ).group_by(text("1")).order_by(text("1"))
        
        res = await self.db.execute(stmt)
        data_map = {getattr(r.day, 'date', lambda: r.day)(): r.cost for r in res}
        
        trends = []
        for i in range(days - 1, -1, -1):
            target_date = (datetime.datetime.utcnow() - datetime.timedelta(days=i)).date()
            trends.append({
                "date": target_date.strftime("%m/%d"),
                "cost": float(data_map.get(target_date, 0.0))
            })
            
        return trends

    async def get_budget_status(self, org_id: str) -> BudgetStatus:
        daily_spent = await self.get_daily_spend(org_id)
        monthly_spent = await self.get_monthly_spend(org_id)
        
        # Fetch actual budget
        stmt = select(OrgAIBudget).where(OrgAIBudget.org_id == uuid.UUID(org_id))
        res = await self.db.execute(stmt)
        budget = res.scalar_one_or_none()
        
        daily_limit = budget.daily_limit_usd if budget else 10.0
        monthly_limit = budget.monthly_limit_usd if budget else 200.0
        
        status = "ok"
        if daily_spent >= daily_limit:
            status = "critical"
        elif daily_spent >= (daily_limit * 0.8):
            status = "warning"
            
        return BudgetStatus(
            daily_limit_usd=daily_limit,
            daily_spent_usd=daily_spent,
            daily_remaining_usd=max(0.0, daily_limit - daily_spent),
            daily_pct_used=(daily_spent / daily_limit) * 100 if daily_limit > 0 else 0,
            monthly_limit_usd=monthly_limit,
            monthly_spent_usd=monthly_spent,
            monthly_remaining_usd=max(0.0, monthly_limit - monthly_spent),
            monthly_pct_used=(monthly_spent / monthly_limit) * 100 if monthly_limit > 0 else 0,
            status=status,
            most_expensive_workflow="chat", # Would compute from DB
            avg_cost_per_query_usd=0.0,
            total_queries_today=0,
            queries_downgraded_today=0
        )
