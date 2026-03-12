import pytest
from app.core.ai_provider import AIProviderClient, AIRequest, ModelTier, AIProvider

@pytest.mark.asyncio
async def test_ai_provider_routing():
    client = AIProviderClient()
    provider, model = client.resolve_model(ModelTier.FAST_CHEAP)
    assert provider == AIProvider.ANTHROPIC_DIRECT
    assert model == "claude-haiku-3-5-20251001"

@pytest.mark.asyncio
async def test_ai_provider_cost_calculation():
    client = AIProviderClient()
    cost = client._calculate_cost(AIProvider.ANTHROPIC_DIRECT, "claude-haiku-3-5-20251001", 1000, 500)
    # 1000 input tokens @ 0.80/M = 0.0008
    # 500 output tokens @ 4.00/M = 0.002
    # Total = 0.0028
    assert abs(cost - 0.0028) < 1e-6
