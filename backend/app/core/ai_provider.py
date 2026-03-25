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
    file_parts: Optional[list] = None

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
            "gemini-1.5-flash-002": {"input": 0.075, "output": 0.30},
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
        AIProvider.OPENAI: {
            "gpt-4o-mini": {"input": 0.15, "output": 0.60},
            "gpt-4o": {"input": 2.50, "output": 10.00},
            "o1-preview": {"input": 15.00, "output": 60.00},
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
        self._openai_client = None

        if self.active_provider == AIProvider.VERTEX_AI:
            try:
                import vertexai
                if self.config.VERTEX_PROJECT_ID and self.config.VERTEX_LOCATION:
                    vertexai.init(
                        project=self.config.VERTEX_PROJECT_ID,
                        location=self.config.VERTEX_LOCATION
                    )
                else:
                    vertexai.init()
                self._vertex_client = True # Just a flag to show it's configured
            except ImportError as e:
                print(f"Failed to import vertexai: {e}")
        elif self.active_provider == AIProvider.ANTHROPIC_DIRECT:
            try:
                from anthropic import AsyncAnthropic
                if self.config.ANTHROPIC_API_KEY:
                    self._anthropic_client = AsyncAnthropic(api_key=self.config.ANTHROPIC_API_KEY)
            except ImportError:
                pass
        elif self.active_provider == AIProvider.OPENAI:
            try:
                from openai import AsyncOpenAI
                if self.config.OPENAI_API_KEY:
                    self._openai_client = AsyncOpenAI(api_key=self.config.OPENAI_API_KEY)
            except ImportError:
                pass
        elif self.active_provider == AIProvider.AWS_BEDROCK:
            pass # Stub for boto3

    def resolve_model(self, tier: ModelTier) -> tuple[AIProvider, str]:
        tier_map = {
            AIProvider.VERTEX_AI: {
                ModelTier.FAST_CHEAP: "gemini-1.5-flash-002",
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
            AIProvider.OPENAI: {
                ModelTier.FAST_CHEAP: "gpt-4o-mini",
                ModelTier.BALANCED: "gpt-4o",
                ModelTier.DEEP: "o1-preview",
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
            elif provider == AIProvider.OPENAI:
                raw_content, in_tokens, out_tokens = await self._complete_openai(request, model)
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

    async def _complete_openai(self, request: AIRequest, model: str):
        if self._openai_client:
            tools = []
            if request.structured_output_schema:
                schema_no_title = request.structured_output_schema.copy()
                if "title" in schema_no_title:
                     del schema_no_title["title"]
                tools = [{
                    "type": "function",
                    "function": {
                        "name": "structured_output",
                        "description": "Output according to schema",
                        "parameters": schema_no_title
                    }
                }]
            
            # o1 models do not support system messages, tools, or temperature explicitly in standard mapping
            is_o1 = model.startswith("o1")
            messages = []
            if not is_o1:
                messages.append({"role": "system", "content": request.system_prompt})
                messages.append({"role": "user", "content": request.user_prompt})
            else:
                messages.append({"role": "user", "content": f"{request.system_prompt}\n\n{request.user_prompt}"})
                
            res = await self._openai_client.chat.completions.create(
                model=model,
                max_tokens=request.max_tokens if not is_o1 else None,
                temperature=request.temperature if not is_o1 else 1.0,
                messages=messages,
                tools=tools if tools and not is_o1 else None,
                tool_choice={"type": "function", "function": {"name": "structured_output"}} if tools and not is_o1 else None
            )
            if tools and not is_o1:
                content = res.choices[0].message.tool_calls[0].function.arguments if res.choices[0].message.tool_calls else "{}"
            else:
                content = res.choices[0].message.content
            return content, res.usage.prompt_tokens, res.usage.completion_tokens
        return "OpenAI not configured. Please set OPENAI_API_KEY", 0, 0

    async def _complete_vertex(self, request: AIRequest, model: str):
        if not self._vertex_client:
            return "Vertex AI not configured. Please ensure the cloud environment provides default credentials or set VERTEX_PROJECT_ID and VERTEX_LOCATION.", 0, 0
        from vertexai.generative_models import GenerativeModel, GenerationConfig
        try:
            gen_model = GenerativeModel(model)
            config = GenerationConfig(
                max_output_tokens=request.max_tokens,
                temperature=request.temperature,
                response_mime_type="application/json" if request.structured_output_schema else "text/plain",
            )
            # system instruction not directly supported in generate_content, prepend to prompt
            full_prompt = f"{request.system_prompt}\n\n{request.user_prompt}"
            if request.structured_output_schema:
                full_prompt += f"\n\nReturn the output exactly matching this JSON schema:\n{json.dumps(request.structured_output_schema)}"
            
            contents = []
            if getattr(request, 'file_parts', None) and request.file_parts:
                from vertexai.generative_models import Part
                for fp in request.file_parts:
                    contents.append(Part.from_data(data=fp["data"], mime_type=fp["mime_type"]))
            contents.append(full_prompt)
            
            # Using synchronous call in a thread pool since vertexai client might not be fully async
            loop = asyncio.get_running_loop()
            res = await loop.run_in_executor(None, lambda: gen_model.generate_content(
                contents,
                generation_config=config,
            ))
            
            in_tokens = res.usage_metadata.prompt_token_count if hasattr(res, 'usage_metadata') else 0
            out_tokens = res.usage_metadata.candidates_token_count if hasattr(res, 'usage_metadata') else 0
            return res.text, in_tokens, out_tokens
        except Exception as e:
            print(f"Vertex AI Error: {e}")
            return f"Error: {str(e)}", 0, 0
        
    async def _complete_anthropic(self, request: AIRequest, model: str):
        if self._anthropic_client:
            tools = []
            if request.structured_output_schema:
                # Add title and type to ensure schema format, Anthropic requires name and description.
                structured_schema = request.structured_output_schema.copy()
                if "type" not in structured_schema:
                     structured_schema["type"] = "object"
                     
                tools = [{
                    "name": "structured_output",
                    "description": "Output according to schema. You MUST use this tool to respond.",
                    "input_schema": structured_schema
                }]
            res = await self._anthropic_client.messages.create(
                model=model,
                max_tokens=request.max_tokens,
                temperature=request.temperature,
                system=request.system_prompt,
                messages=[{"role": "user", "content": request.user_prompt}],
                tools=tools if tools else None,
                tool_choice={"type": "tool", "name": "structured_output"} if tools else None
            )
            
            if tools:
                content = None
                for block in res.content:
                     if block.type == "tool_use" and block.name == "structured_output":
                          content = json.dumps(block.input)
                          break
                if not content:
                     content = "{}" # Fallback
            else:
                 content = res.content[0].text
            return content, res.usage.input_tokens, res.usage.output_tokens
        return "Anthropic direct not configured. Please set ANTHROPIC_API_KEY", 0, 0

    async def _complete_bedrock(self, request: AIRequest, model: str):
        return "Stub response from Bedrock", 10, 20
