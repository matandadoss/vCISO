from pydantic import BaseModel
from typing import List, AsyncGenerator
from app.correlation.llm_engine import LLMCorrelationEngine, ChatAnswerResult
from app.core.query_router import QueryRouter, QueryContext
from app.core.cost_tracker import CostTracker

class ChatMessageResponse(BaseModel):
    id: str
    content: str
    tier_used: str
    cost_usd: float
    routing_reason: str

class ChatService:
    def __init__(self, llm_engine: LLMCorrelationEngine, query_router: QueryRouter, cost_tracker: CostTracker, db=None):
        self.llm_engine = llm_engine
        self.router = query_router
        self.cost_tracker = cost_tracker
        self.db = db

    async def handle_message(self, session_id: str, content: str, org_id: str) -> AsyncGenerator[str, None]:
        context = await self._build_query_context(org_id)
        classification = self.router.classify(content, context)

        yield f"data: {{\"type\": \"routing\", \"tier\": \"{classification.tier}\", \"reason\": \"{classification.routing_reason}\"}}\n\n"

        if classification.tier == "search_only":
            result = await self.llm_engine.answer_security_question(content, context)
            yield f"data: {{\"type\": \"token\", \"content\": \"{result.answer}\"}}\n\n"
            yield f"data: {{\"type\": \"done\", \"cost_usd\": 0.0, \"model_used\": \"db\"}}\n\n"
        else:
            # Simulated Streaming Response (Anthropic / Gemini logic embedded in AIProviderClient)
            result = await self.llm_engine.answer_security_question(content, context)
            
            # Since AIProvider implementation isn't pure streaming yet, simulating the chunks
            words = result.answer.split(" ")
            for word in words:
                yield f"data: {{\"type\": \"token\", \"content\": \"{word} \"}}\n\n"
            
            yield f"data: {{\"type\": \"done\", \"cost_usd\": {result.cost_usd}, \"model_used\": \"{result.model_used}\"}}\n\n"

    async def _build_query_context(self, org_id: str) -> QueryContext:
        return QueryContext(
            org_id=org_id,
            user_role="admin",
            open_finding_count=100,
            critical_finding_count=10,
            session_cost_so_far_usd=0.0,
            daily_budget_remaining_usd=10.0
        )
