import os
import json
import time
import asyncio
from enum import Enum
from dataclasses import dataclass
from typing import Any, Optional

class AIProvider(str, Enum):
    VERTEX_AI = "vertex_ai"
    ANTHROPIC_DIRECT = "anthropic_direct"
    AWS_BEDROCK = "aws_bedrock"
    OPENAI = "openai"

class ModelTier(str, Enum):
    SEARCH_ONLY = "search_only"
    FAST_CHEAP = "fast_cheap"
    BALANCED = "balanced"
    DEEP = "deep"

@dataclass
class AIRequest:
    system_prompt: str
    user_prompt: str
    tier: ModelTier
    structured_output_schema: Optional[dict] = None
    max_tokens: int = 4096
    temperature: float = 0.1
    metadata: dict = None

@dataclass
class AIResponse:
    content: str
    structured_output: Optional[dict]
    provider_used: AIProvider
    model_used: str
    tier_used: ModelTier
    input_tokens: int
    output_tokens: int
    cost_usd: float
    latency_ms: int

def now_ms() -> int:
    return int(time.time() * 1000)

class AIProviderClient:
    PRICING = {
        AIProvider.VERTEX_AI: {
            "gemini-2.5-pro-preview": {"input": 1.25, "output": 10.00},
            "gemini-2.0-flash": {"input": 0.075, "output": 0.30},
            "gemini-1.5-pro": {"input": 1.25, "output": 10.00},
        },
        AIProvider.ANTHROPIC_DIRECT: {
            "claude-sonnet-4-5": {"input": 3.00, "output": 15.00},
            "claude-haiku-3-5-20251001": {"input": 0.80, "output": 4.00},
        },
        AIProvider.AWS_BEDROCK: {
            "anthropic.claude-3-5-sonnet-20241022-v2:0": {"input": 3.00, "output": 15.00},
            "amazon.nova-lite-v1:0": {"input": 0.06, "output": 0.24},
            "amazon.nova-pro-v1:0": {"input": 0.80, "output": 3.20},
        },
    }

    def __init__(self, config=None, cost_tracker=None, db=None):
        if config is None:
            from app.core.ai_provider_config import settings
            self.config = settings
        else:
            self.config = config
            
        self.active_provider = AIProvider(self.config.AI_PROVIDER)
        from app.core.query_router import CostGuard
        self.cost_guard = CostGuard(cost_tracker, db)
        self._init_clients()

    def _init_clients(self):
        self._vertex_client = None
        self._anthropic_client = None
        self._bedrock_client = None

        if self.active_provider == AIProvider.VERTEX_AI:
            pass # Stub for genai
        elif self.active_provider == AIProvider.ANTHROPIC_DIRECT:
            try:
                from anthropic import AsyncAnthropic
                if self.config.ANTHROPIC_API_KEY:
                    self._anthropic_client = AsyncAnthropic(api_key=self.config.ANTHROPIC_API_KEY)
            except ImportError:
                pass
        elif self.active_provider == AIProvider.AWS_BEDROCK:
            pass # Stub for boto3

    def resolve_model(self, tier: ModelTier) -> tuple[AIProvider, str]:
        tier_map = {
            AIProvider.VERTEX_AI: {
                ModelTier.FAST_CHEAP: "gemini-2.0-flash",
                ModelTier.BALANCED: "gemini-1.5-pro",
                ModelTier.DEEP: "gemini-2.5-pro-preview",
            },
            AIProvider.ANTHROPIC_DIRECT: {
                ModelTier.FAST_CHEAP: "claude-haiku-3-5-20251001",
                ModelTier.BALANCED: "claude-sonnet-4-5",
                ModelTier.DEEP: "claude-sonnet-4-5",
            },
            AIProvider.AWS_BEDROCK: {
                ModelTier.FAST_CHEAP: "amazon.nova-lite-v1:0",
                ModelTier.BALANCED: "amazon.nova-pro-v1:0",
                ModelTier.DEEP: "anthropic.claude-3-5-sonnet-20241022-v2:0",
            },
        }
        return self.active_provider, tier_map[self.active_provider][tier]

    def _calculate_cost(self, provider: AIProvider, model: str, input_tokens: int, output_tokens: int) -> float:
        pricing = self.PRICING.get(provider, {}).get(model)
        if not pricing:
            return 0.0
        return (input_tokens / 1_000_000) * pricing["input"] + (output_tokens / 1_000_000) * pricing["output"]

    def _parse_structured(self, content: str, schema: Optional[dict]) -> Optional[dict]:
        if not schema:
            return None
        try:
            return json.loads(content)
        except Exception:
            return None

    async def complete(self, request: AIRequest) -> Optional[AIResponse]:
        if request.tier == ModelTier.SEARCH_ONLY:
            return None

        provider, model = self.resolve_model(request.tier)
        start_ms = now_ms()

        try:
            if provider == AIProvider.VERTEX_AI:
                raw_content, in_tokens, out_tokens = await self._complete_vertex(request, model)
            elif provider == AIProvider.ANTHROPIC_DIRECT:
                raw_content, in_tokens, out_tokens = await self._complete_anthropic(request, model)
            elif provider == AIProvider.AWS_BEDROCK:
                raw_content, in_tokens, out_tokens = await self._complete_bedrock(request, model)
            else:
                raise ValueError("Unsupported provider")
        except Exception as e:
            raise e

        cost = self._calculate_cost(provider, model, in_tokens, out_tokens)
        structured_output = self._parse_structured(raw_content, request.structured_output_schema)

        response = AIResponse(
            content=raw_content,
            structured_output=structured_output,
            provider_used=provider,
            model_used=model,
            tier_used=request.tier,
            input_tokens=in_tokens,
            output_tokens=out_tokens,
            cost_usd=cost,
            latency_ms=now_ms() - start_ms,
        )

        return response

    async def _complete_vertex(self, request: AIRequest, model: str):
        return "Stub response from Vertex", 10, 20
        
    async def _complete_anthropic(self, request: AIRequest, model: str):
        if self._anthropic_client:
            tools = []
            if request.structured_output_schema:
                tools = [{
                    "name": "structured_output",
                    "description": "Output according to schema",
                    "input_schema": request.structured_output_schema
                }]
            res = await self._anthropic_client.messages.create(
                model=model,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                system=request.system_prompt,
                messages=[{"role": "user", "content": request.user_prompt}],
                tools=tools if tools else None
            )
            content = res.content[0].text if not tools else json.dumps(res.content[0].input)
            return content, res.usage.input_tokens, res.usage.output_tokens
        return "Stub response", 10, 20

    async def _complete_bedrock(self, request: AIRequest, model: str):
        return "Stub response from Bedrock", 10, 20
