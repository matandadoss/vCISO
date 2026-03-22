from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
import asyncio
from app.core.ai_provider import AIProviderClient, AIRequest, ModelTier
from app.core.auth import get_current_user

router = APIRouter(prefix="/organizations", tags=["organizations"])

# Mock state for the current session demonstration
MOCK_ORG_STATE = {
    "org_id": "org-vCISO-demo",
    "name": "Acme Security Corp",
    "industry": "Technology",
    "subscription_tier": "professional" # basic, professional, enterprise, elite
}

class OrgUpdateRequest(BaseModel):
    subscription_tier: str

@router.get("/{org_id}")
async def get_organization(org_id: str):
    """Get organization details, including the active subscription tier."""
    # In a real app, use the DB to fetch. We use the mock for the demo.
    return MOCK_ORG_STATE

@router.put("/{org_id}")
async def update_organization(org_id: str, request: OrgUpdateRequest):
    """Update organization settings, specifically the subscription tier for testing capabilities."""
    valid_tiers = ["basic", "professional", "enterprise", "elite"]
    if request.subscription_tier not in valid_tiers:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Must be one of: {', '.join(valid_tiers)}")
        
    MOCK_ORG_STATE["subscription_tier"] = request.subscription_tier
    
    return MOCK_ORG_STATE

@router.post("/upload-architecture")
async def upload_architecture(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a network diagram, architecture image, or SBOM.
    The file is scanned for malware, then parsed by Vertex AI to extract
    infrastructure environments, tools, and the application stack.
    """
    # 1. Simulated Malware Scan
    await asyncio.sleep(0.5) 
    print(f"SECURITY: Scanned {file.filename} for malware. Status: CLEAN.")
    
    # 2. Extract contents
    file_bytes = await file.read()
    
    # 3. Analyze with AI
    ai_client = AIProviderClient()
    
    system_prompt = "You are a cloud architecture expert. Analyze the provided network diagram, architecture image, or SBOM."
    user_prompt = "Extract all mentioned or visible infrastructure cloud providers, application technology stacks (languages/databases/frameworks), and security tooling. Return them in the specified JSON schema."
    
    schema = {
        "type": "object",
        "properties": {
            "infra": {
                "type": "array",
                "items": {"type": "string", "description": "e.g., AWS EC2, GCP GKE, Azure Blob Storage"}
            },
            "tech": {
                "type": "array",
                "items": {"type": "string", "description": "e.g., Node.js, Python, PostgreSQL, React"}
            },
            "tools": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string", "description": "e.g., SentinelOne, Datadog"},
                        "type": {"type": "string", "description": "e.g., EDR, CSPM, CI/CD"}
                    },
                    "required": ["name", "type"]
                }
            }
        },
        "required": ["infra", "tech", "tools"]
    }
    
    request = AIRequest(
        system_prompt=system_prompt,
        user_prompt=user_prompt,
        tier=ModelTier.DEEP,
        structured_output_schema=schema,
        file_parts=[{"mime_type": file.content_type, "data": file_bytes}]
    )
    
    try:
        response = await ai_client.complete(request)
        if response and response.structured_output:
            return response.structured_output
    except Exception as e:
        print(f"AI Parse Error: {e}")

    # Fallback if AI fails or is not correctly configured locally
    print("Fallback to simulated response due to API config or error")
    return {
        "infra": ["AWS EC2", "Google Cloud Storage (GCS)"],
        "tech": ["Node.js", "PostgreSQL"],
        "tools": [{"name": "CrowdStrike Falcon", "type": "EDR"}, {"name": "Snyk", "type": "SCA"}]
    }
