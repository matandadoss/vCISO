import pytest
from app.core.ai_provider import AIProviderClient, AIRequest, ModelTier, AIProvider

@pytest.mark.asyncio
async def test_ai_provider_routing():
    client = AIProviderClient()
    provider, model = client.resolve_model(ModelTier.FAST_CHEAP)
    assert provider == AIProvider.VERTEX_AI
    assert model == "gemini-2.0-flash"

@pytest.mark.asyncio
async def test_ai_provider_cost_calculation():
    client = AIProviderClient()
    cost = client._calculate_cost(AIProvider.VERTEX_AI, "gemini-2.0-flash", 1000, 500)
    # 1000 input tokens @ $0.075/M = 0.000075
    # 500 output tokens @ $0.30/M = 0.00015
    # Total = 0.000225
    assert abs(cost - 0.000225) < 1e-6
