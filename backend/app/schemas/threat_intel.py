from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime
import uuid

from app.models.domain import ThreatSophistication, IndicatorType, Severity

class ThreatFeedSubscriptionBase(BaseModel):
    name: str
    description: str
    provider: str
    is_active: bool = False
    last_synced: Optional[datetime] = None

class ThreatFeedSubscriptionCreate(ThreatFeedSubscriptionBase):
    org_id: uuid.UUID

class ThreatFeedSubscriptionUpdate(BaseModel):
    is_active: Optional[bool] = None
    last_synced: Optional[datetime] = None

class ThreatFeedSubscriptionResponse(ThreatFeedSubscriptionBase):
    id: uuid.UUID
    org_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
