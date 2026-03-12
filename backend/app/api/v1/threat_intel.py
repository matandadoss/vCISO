from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel
from app.models.domain import Severity, ThreatSophistication, IndicatorType

router = APIRouter(prefix="/threat-intel", tags=["threat-intel"])

class ThreatActorResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    sophistication: ThreatSophistication
    active: bool
    first_seen: datetime
    last_updated: datetime

class ThreatIndicatorResponse(BaseModel):
    id: str
    indicator_type: IndicatorType
    value: str
    confidence: int
    severity: Severity
    threat_actor_id: Optional[str] = None
    valid_from: Optional[datetime] = None

@router.get("/actors", response_model=dict)
async def list_threat_actors(
    org_id: str,
    active: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0
):
    # Stub: return mock data
    actors = [
        {
            "id": str(uuid.uuid4()),
            "name": "FIN7",
            "description": "Financially motivated threat group targeting retail and hospitality.",
            "sophistication": ThreatSophistication.advanced,
            "active": True,
            "first_seen": datetime(2015, 1, 1, tzinfo=timezone.utc).isoformat(),
            "last_updated": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Lazarus Group",
            "description": "State-sponsored actor associated with North Korea.",
            "sophistication": ThreatSophistication.nation_state,
            "active": True,
            "first_seen": datetime(2009, 1, 1, tzinfo=timezone.utc).isoformat(),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
    ]
    return {
        "items": actors,
        "total": len(actors),
        "limit": limit,
        "offset": offset
    }

@router.get("/indicators", response_model=dict)
async def list_threat_indicators(
    org_id: str,
    threat_actor_id: Optional[str] = None,
    severity: Optional[Severity] = None,
    limit: int = 50,
    offset: int = 0
):
    # Stub: return mock data
    indicators = [
        {
            "id": str(uuid.uuid4()),
            "indicator_type": IndicatorType.ip,
            "value": "198.51.100.42",
            "confidence": 95,
            "severity": Severity.critical,
            "threat_actor_id": "actor-123", # mock reference
            "valid_from": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "indicator_type": IndicatorType.domain,
            "value": "malicious-c2.login.example.com",
            "confidence": 80,
            "severity": Severity.high,
            "threat_actor_id": "actor-456",
            "valid_from": datetime.now(timezone.utc).isoformat()
        }
    ]
    return {
        "items": indicators,
        "total": len(indicators),
        "limit": limit,
        "offset": offset
    }

class FeedSubscription(BaseModel):
    id: str
    name: str
    description: str
    provider: str
    is_active: bool
    last_synced: Optional[datetime] = None

class UpdateFeedSubscriptionsRequest(BaseModel):
    feed_ids: List[str] # List of feed IDs that should be active

# In-memory mock DB for feeds
MOCK_FEEDS = [
    {
        "id": "feed-cisa-kev",
        "name": "CISA KEV",
        "description": "Known Exploited Vulnerabilities Catalog from CISA.",
        "provider": "Gov",
        "is_active": True,
        "last_synced": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "feed-fs-isac",
        "name": "FS-ISAC",
        "description": "Financial Services Information Sharing and Analysis Center.",
        "provider": "ISAC",
        "is_active": True,
        "last_synced": datetime.now(timezone.utc).isoformat()
    },
    {
        "id": "feed-crowdstrike",
        "name": "CrowdStrike Falcon Intel",
        "description": "Premium commercial threat intelligence signals.",
        "provider": "Commercial",
        "is_active": False,
        "last_synced": None
    },
    {
        "id": "feed-alienvault",
        "name": "AlienVault OTX",
        "description": "Open Threat Exchange community indicator feed.",
        "provider": "Community",
        "is_active": False,
        "last_synced": None
    }
]

@router.get("/feeds", response_model=List[FeedSubscription])
async def get_threat_feeds(org_id: str):
    """Get the configuration and status of available threat intel feeds."""
    return MOCK_FEEDS

@router.put("/feeds")
async def update_threat_feeds(request: UpdateFeedSubscriptionsRequest, org_id: str):
    """Update which threat feeds are actively ingested."""
    updated_feeds = []
    for feed in MOCK_FEEDS:
        feed["is_active"] = feed["id"] in request.feed_ids
        updated_feeds.append(feed)
    
    return {"status": "success", "message": "Feed subscriptions updated successfully."}
