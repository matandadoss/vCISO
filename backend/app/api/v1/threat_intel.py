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
