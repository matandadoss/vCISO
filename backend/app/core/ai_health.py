from fastapi import APIRouter, Depends
from app.core.dependencies import get_ai_client
from app.core.ai_provider import AIProviderClient, AIRequest, ModelTier

router = APIRouter()

@router.get("/health")
async def ai_health(ai_client: AIProviderClient = Depends(get_ai_client)):
    request = AIRequest(
        system_prompt="You are a health check assistant.",
        user_prompt="Ping",
        tier=ModelTier.FAST_CHEAP,
        max_tokens=5
    )
    try:
        response = await ai_client.complete(request)
        return {
            "status": "healthy",
            "provider": response.provider_used,
            "latency_ms": response.latency_ms
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "provider": ai_client.active_provider,
            "error": str(e)
        }
