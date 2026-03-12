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

from app.db.session import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.crud import threat_feed as crud_threat_feed
from app.schemas.threat_intel import ThreatFeedSubscriptionCreate, ThreatFeedSubscriptionResponse

class UpdateFeedSubscriptionsRequest(BaseModel):
    feed_ids: List[str] # List of feed UUIDs that should be active

@router.get("/feeds", response_model=List[ThreatFeedSubscriptionResponse])
async def get_threat_feeds(org_id: str, db: AsyncSession = Depends(get_db)):
    """Get the configuration and status of available threat intel feeds."""
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        org_uuid = uuid.uuid4()
        
    feeds = await crud_threat_feed.get_by_org(db=db, org_id=org_uuid)
    
    if not feeds and org_id == "default":
        # Seed defaults
        defaults = [
            ThreatFeedSubscriptionCreate(
                org_id=org_uuid,
                name="CISA KEV",
                description="Known Exploited Vulnerabilities Catalog from CISA.",
                provider="Gov",
                is_active=True,
                last_synced=datetime.now(timezone.utc)
            ),
            ThreatFeedSubscriptionCreate(
                org_id=org_uuid,
                name="FS-ISAC",
                description="Financial Services Information Sharing and Analysis Center.",
                provider="ISAC",
                is_active=True,
                last_synced=datetime.now(timezone.utc)
            ),
            ThreatFeedSubscriptionCreate(
                org_id=org_uuid,
                name="CrowdStrike Falcon Intel",
                description="Premium commercial threat intelligence signals.",
                provider="Commercial",
                is_active=False,
                last_synced=None
            ),
            ThreatFeedSubscriptionCreate(
                org_id=org_uuid,
                name="AlienVault OTX",
                description="Open Threat Exchange community indicator feed.",
                provider="Community",
                is_active=False,
                last_synced=None
            )
        ]
        for d in defaults:
            await crud_threat_feed.create(db=db, obj_in=d)
        feeds = await crud_threat_feed.get_by_org(db=db, org_id=org_uuid)
        
    return feeds

@router.put("/feeds")
async def update_threat_feeds(request: UpdateFeedSubscriptionsRequest, org_id: str, db: AsyncSession = Depends(get_db)):
    """Update which threat feeds are actively ingested."""
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        org_uuid = uuid.uuid4()
        
    feeds = await crud_threat_feed.get_by_org(db=db, org_id=org_uuid)
    
    for feed in feeds:
        is_now_active = str(feed.id) in request.feed_ids
        if feed.is_active != is_now_active:
            await crud_threat_feed.update(
                db=db, 
                db_obj=feed, 
                obj_in={"is_active": is_now_active, "last_synced": datetime.now(timezone.utc) if is_now_active else None}
            )
    
    return {"status": "success", "message": "Feed subscriptions updated successfully."}
