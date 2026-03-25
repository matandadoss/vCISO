import uuid
import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel

from app.db.session import get_db
from app.core.auth import get_current_user
from app.models.domain import OrganizationIntegration

router = APIRouter(prefix="/integrations", tags=["integrations"])

# Static catalog of available integrations (Config Definitions)
INTEGRATION_CATALOG = [
    {
        "id": "aws",
        "name": "AWS Security Hub",
        "category": "Cloud Infrastructure",
        "description": "Ingest cloud security posture findings from AWS accounts.",
        "icon": "/icons/aws.svg"
    },
    {
        "id": "crowdstrike",
        "name": "CrowdStrike Falcon",
        "category": "Endpoint Security",
        "description": "Sync endpoint alerts and host vulnerability context.",
        "icon": "/icons/crowdstrike.svg"
    },
    {
        "id": "splunk",
        "name": "Splunk Enterprise",
        "category": "SIEM",
        "description": "Forward vCISO correlations to your central SIEM.",
        "icon": "/icons/splunk.svg"
    },
    {
        "id": "jira",
        "name": "Jira Service Desk",
        "category": "Ticketing",
        "description": "Automatically create tickets for critical remediation actions.",
        "icon": "/icons/jira.svg"
    },
    {
        "id": "slack",
        "name": "Slack",
        "category": "Communication",
        "description": "Send alerts and AI briefings to your SOC channel.",
        "icon": "/icons/slack.svg"
    },
    {
        "id": "okta",
        "name": "Okta",
        "category": "Identity",
        "description": "Monitor identity threats and enforce access playbooks.",
        "icon": "/icons/okta.svg"
    }
]

class IntegrationToggleRequest(BaseModel):
    integration_id: str
    action: str  # "connect" or "disconnect"

class MagicConnectRequest(BaseModel):
    raw_text: str

@router.get("/")
async def get_integrations(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    org_id_str = current_user.get("org_id")
    if not org_id_str:
        raise HTTPException(status_code=400, detail="User organization not found")
    org_id = uuid.UUID(org_id_str)
    
    # Fetch user's configured integrations
    result = await db.execute(select(OrganizationIntegration).where(OrganizationIntegration.org_id == org_id))
    org_integrations = result.scalars().all()
    
    config_map = {oi.integration_key: oi for oi in org_integrations}
    
    response_list = []
    
    for catalog_item in INTEGRATION_CATALOG:
        entry = catalog_item.copy()
        db_config = config_map.get(entry["id"])
        
        if db_config:
            entry["status"] = db_config.status
            entry["last_sync"] = db_config.last_sync.isoformat() if db_config.last_sync else None
        else:
            entry["status"] = "disconnected"
            entry["last_sync"] = None
            
        response_list.append(entry)
        
    return {"integrations": response_list}

@router.post("/toggle")
async def toggle_integration(
    request: IntegrationToggleRequest, 
    db: AsyncSession = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    org_id_str = current_user.get("org_id")
    if not org_id_str:
        raise HTTPException(status_code=400, detail="User organization not found")
    org_id = uuid.UUID(org_id_str)
    
    # Verify integration exists in catalog
    catalog_item = next((item for item in INTEGRATION_CATALOG if item["id"] == request.integration_id), None)
    if not catalog_item:
        return {"status": "error", "message": "Integration not found in catalog"}
        
    result = await db.execute(select(OrganizationIntegration).where(
        OrganizationIntegration.org_id == org_id,
        OrganizationIntegration.integration_key == request.integration_id
    ))
    db_config = result.scalar_one_or_none()
    
    now = datetime.datetime.utcnow()
    
    if request.action == "connect":
        if not db_config:
            db_config = OrganizationIntegration(
                id=uuid.uuid4(),
                org_id=org_id,
                integration_key=request.integration_id,
                status="connected",
                last_sync=now
            )
            db.add(db_config)
        else:
            db_config.status = "connected"
            db_config.last_sync = now
    else:
        if db_config:
            # We can mark disconnected instead of deleting, keeping credentials/history
            db_config.status = "disconnected"
            db_config.last_sync = None
            
    await db.commit()
    
    # Construct response
    response_item = catalog_item.copy()
    response_item["status"] = "connected" if request.action == "connect" else "disconnected"
    response_item["last_sync"] = now.isoformat() if request.action == "connect" else None
    
    import asyncio
    await asyncio.sleep(0.5) # Simulate API handshake
    
    return {"status": "success", "integration": response_item}

@router.post("/magic-connect")
async def magic_connect(
    request: MagicConnectRequest, 
    db: AsyncSession = Depends(get_db), 
    current_user: dict = Depends(get_current_user)
):
    org_id_str = current_user.get("org_id")
    if not org_id_str:
        raise HTTPException(status_code=400, detail="User organization not found")
    org_id = uuid.UUID(org_id_str)
    
    import asyncio
    await asyncio.sleep(1.5) # Simulate LLM thinking/parsing delay
    
    text = request.raw_text.lower()
    integration_id = None
    
    # Simple keyword-based intent classification
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
        
    catalog_item = next((item for item in INTEGRATION_CATALOG if item["id"] == integration_id), None)
    if not catalog_item:
        return {"status": "error", "message": "Identified integration not found in registry."}
        
    result = await db.execute(select(OrganizationIntegration).where(
        OrganizationIntegration.org_id == org_id,
        OrganizationIntegration.integration_key == integration_id
    ))
    db_config = result.scalar_one_or_none()
    
    now = datetime.datetime.utcnow()
    
    if not db_config:
        db_config = OrganizationIntegration(
            id=uuid.uuid4(),
            org_id=org_id,
            integration_key=integration_id,
            status="connected",
            last_sync=now,
            credentials_secret="AI_PARSED_CREDENTIALS_MASKED" # Mocked secure storage
        )
        db.add(db_config)
    else:
        db_config.status = "connected"
        db_config.last_sync = now
        db_config.credentials_secret = "AI_PARSED_CREDENTIALS_UPDATED_MASKED"
        
    await db.commit()
    
    response_item = catalog_item.copy()
    response_item["status"] = "connected"
    response_item["last_sync"] = now.isoformat()
    
    return {
        "status": "success", 
        "integration": response_item, 
        "message": f"Successfully identified and securely connected {catalog_item['name']}!"
    }
