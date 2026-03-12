from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class AIProviderConfig(BaseSettings):
    AI_PROVIDER: str = "anthropic_direct"
    VERTEX_PROJECT_ID: Optional[str] = None
    VERTEX_LOCATION: Optional[str] = None
    ANTHROPIC_API_KEY: Optional[str] = None
    AWS_REGION: Optional[str] = None
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AI_FALLBACK_PROVIDER: str = "vertex_ai"
    AI_MAX_COST_PER_QUERY_USD: float = 0.50

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = AIProviderConfig()
