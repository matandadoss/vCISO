from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import uuid

from app.crud.base import CRUDBase
from app.models.domain import Finding, Severity, FindingStatus
from app.schemas.finding import FindingCreate, FindingUpdate

class CRUDFinding(CRUDBase[Finding, FindingCreate, FindingUpdate]):
    async def get_by_org(
        self, 
        db: AsyncSession, 
        *, 
        org_id: uuid.UUID, 
        skip: int = 0, 
        limit: int = 50,
        severity: Optional[Severity] = None,
        status: Optional[str] = None
    ) -> tuple[List[Finding], int]:
        
        query = select(self.model).filter(self.model.org_id == org_id)
        
        if severity:
            query = query.filter(self.model.severity == severity)
        if status:
            # Handle string casting if status passed from query param
            try:
                finding_status = FindingStatus(status)
                query = query.filter(self.model.status == finding_status)
            except ValueError:
                pass # ignore invalid status
                
        # Get total count (for pagination)
        from sqlalchemy import func
        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # Get results
        query = query.order_by(self.model.detected_at.desc()).offset(skip).limit(limit)
        result = await db.execute(query)
        findings = list(result.scalars().all())
        
        return findings, total

finding = CRUDFinding(Finding)
