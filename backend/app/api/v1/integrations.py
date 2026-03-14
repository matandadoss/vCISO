from fastapi import APIRouter
from pydantic import BaseModel
import datetime

router = APIRouter(prefix="/integrations", tags=["integrations"])

# Mock data for integrations
MOCK_INTEGRATIONS = [
    {
        "id": "aws",
        "name": "AWS Security Hub",
        "category": "Cloud Infrastructure",
        "description": "Ingest cloud security posture findings from AWS accounts.",
        "status": "connected",
        "last_sync": (datetime.datetime.utcnow() - datetime.timedelta(minutes=5)).isoformat(),
        "icon": "/icons/aws.svg"
    },
    {
        "id": "crowdstrike",
        "name": "CrowdStrike Falcon",
        "category": "Endpoint Security",
        "description": "Sync endpoint alerts and host vulnerability context.",
        "status": "connected",
        "last_sync": (datetime.datetime.utcnow() - datetime.timedelta(minutes=12)).isoformat(),
        "icon": "/icons/crowdstrike.svg"
    },
    {
        "id": "splunk",
        "name": "Splunk Enterprise",
        "category": "SIEM",
        "description": "Forward vCISO correlations to your central SIEM.",
        "status": "disconnected",
        "last_sync": None,
        "icon": "/icons/splunk.svg"
    },
    {
        "id": "jira",
        "name": "Jira Service Desk",
        "category": "Ticketing",
        "description": "Automatically create tickets for critical remediation actions.",
        "status": "disconnected",
        "last_sync": None,
        "icon": "/icons/jira.svg"
    },
    {
        "id": "slack",
        "name": "Slack",
        "category": "Communication",
        "description": "Send alerts and AI briefings to your SOC channel.",
        "status": "connected",
        "last_sync": (datetime.datetime.utcnow() - datetime.timedelta(minutes=2)).isoformat(),
        "icon": "/icons/slack.svg"
    },
    {
        "id": "okta",
        "name": "Okta",
        "category": "Identity",
        "description": "Monitor identity threats and enforce access playbooks.",
        "status": "disconnected",
        "last_sync": None,
        "icon": "/icons/okta.svg"
    }
]

class IntegrationToggleRequest(BaseModel):
    integration_id: str
    action: str  # "connect" or "disconnect"

class MagicConnectRequest(BaseModel):
    raw_text: str

@router.get("/")
async def get_integrations():
    return {"integrations": MOCK_INTEGRATIONS}

@router.post("/toggle")
async def toggle_integration(request: IntegrationToggleRequest):
    import asyncio
    await asyncio.sleep(1.0) # mock sync delay
    
    for item in MOCK_INTEGRATIONS:
        if item["id"] == request.integration_id:
            if request.action == "connect":
                item["status"] = "connected"
                item["last_sync"] = datetime.datetime.utcnow().isoformat()
            else:
                item["status"] = "disconnected"
                item["last_sync"] = None
            return {"status": "success", "integration": item}
            
    return {"status": "error", "message": "Integration not found"}

@router.post("/magic-connect")
async def magic_connect(request: MagicConnectRequest):
    import asyncio
    # Simulate LLM thinking delay
    await asyncio.sleep(2.0)
    
    text = request.raw_text.lower()
    integration_id = None
    
    # Simple keyword-based intent classification (mocking the LLM)
    if "arn:aws:iam" in text or "aws_access_key" in text:
        integration_id = "aws"
    elif "client_secret" in text and ("crowdstrike" in text or "falcon" in text):
        integration_id = "crowdstrike"
    elif "hooks.slack.com" in text:
        integration_id = "slack"
    elif "splunk" in text and "hec" in text:
        integration_id = "splunk"
    elif "okta.com" in text and "api_token" in text:
        integration_id = "okta"
    elif "jira" in text and "atlassian.net" in text:
        integration_id = "jira"
        
    if not integration_id:
        return {
            "status": "error", 
            "message": "AI could not identify the integration from the provided text. Please try again or connect manually."
        }
        
    for item in MOCK_INTEGRATIONS:
        if item["id"] == integration_id:
            item["status"] = "connected"
            item["last_sync"] = datetime.datetime.utcnow().isoformat()
            return {
                "status": "success", 
                "integration": item, 
                "message": f"Successfully identified and connected {item['name']}!"
            }
            
    return {"status": "error", "message": "Identified integration not found in registry."}
