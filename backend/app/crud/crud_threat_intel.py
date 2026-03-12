from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.crud.base import CRUDBase
from app.models.domain import ThreatFeedSubscription
from app.schemas.threat_intel import ThreatFeedSubscriptionCreate, ThreatFeedSubscriptionUpdate

class CRUDThreatFeedSubscription(CRUDBase[ThreatFeedSubscription, ThreatFeedSubscriptionCreate, ThreatFeedSubscriptionUpdate]):
    async def get_by_org(
        self, 
        db: AsyncSession, 
        *, 
        org_id: uuid.UUID
    ) -> List[ThreatFeedSubscription]:
        
        query = select(self.model).filter(self.model.org_id == org_id)
        result = await db.execute(query)
        return list(result.scalars().all())

threat_feed = CRUDThreatFeedSubscription(ThreatFeedSubscription)
