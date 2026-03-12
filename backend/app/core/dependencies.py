from fastapi import Depends
from app.core.ai_provider import AIProviderClient
from app.core.query_router import QueryRouter
from app.core.cost_tracker import CostTracker

# We will create global singletons here
_cost_tracker = CostTracker()
# We don't have db connection setup yet, so db=None
_ai_client = AIProviderClient(cost_tracker=_cost_tracker, db=None)
_query_router = QueryRouter()

def get_cost_tracker() -> CostTracker:
    return _cost_tracker

def get_ai_client() -> AIProviderClient:
    return _ai_client

def get_query_router() -> QueryRouter:
    return _query_router
