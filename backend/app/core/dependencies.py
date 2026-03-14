from fastapi import Depends
from app.core.ai_provider import AIProviderClient
from app.core.query_router import QueryRouter
from app.core.cost_tracker import CostTracker

from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession

def get_cost_tracker(db: AsyncSession = Depends(get_db)) -> CostTracker:
    return CostTracker(db=db)

def get_ai_client(
    db: AsyncSession = Depends(get_db), 
    tracker: CostTracker = Depends(get_cost_tracker)
) -> AIProviderClient:
    return AIProviderClient(cost_tracker=tracker, db=db)

def get_query_router() -> QueryRouter:
    return QueryRouter()
