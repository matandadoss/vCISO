from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from pydantic import BaseModel

router = APIRouter(prefix="/compliance", tags=["compliance"])

@router.get("/frameworks", response_model=dict)
async def list_frameworks(
    org_id: str,
    applicable: Optional[bool] = None,
    limit: int = 50,
    offset: int = 0
):
    # Stub: return mock data
    frameworks = [
        {
            "id": str(uuid.uuid4()),
            "framework_name": "SOC 2 Type II",
            "version": "2017",
            "applicable": True,
            "overall_compliance_pct": 85.5,
            "last_assessed": datetime(2023, 8, 15, tzinfo=timezone.utc).isoformat(),
            "next_assessment_due": datetime(2024, 8, 15, tzinfo=timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "framework_name": "ISO 27001",
            "version": "2022",
            "applicable": True,
            "overall_compliance_pct": 62.0,
            "last_assessed": datetime(2023, 1, 10, tzinfo=timezone.utc).isoformat(),
            "next_assessment_due": datetime(2024, 1, 10, tzinfo=timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "framework_name": "GDPR",
            "applicable": True,
            "overall_compliance_pct": 92.5,
            "last_assessed": datetime(2023, 11, 5, tzinfo=timezone.utc).isoformat(),
            "next_assessment_due": datetime(2024, 11, 5, tzinfo=timezone.utc).isoformat()
        }
    ]
    return {
        "items": frameworks,
        "total": len(frameworks),
        "limit": limit,
        "offset": offset
    }

@router.get("/frameworks/{framework_id}/requirements", response_model=dict)
async def list_requirements(
    framework_id: str,
    org_id: str,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    # Stub: return mock data
    requirements = [
        {
            "id": str(uuid.uuid4()),
            "requirement_id_code": "CC1.1",
            "title": "COSO Principle 1: Demonstrates commitment to integrity and ethical values",
            "status": "compliant",
            "evidence_status": "collected",
            "last_reviewed": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "requirement_id_code": "CC1.2",
            "title": "COSO Principle 2: Exercises oversight responsibility",
            "status": "non_compliant",
            "evidence_status": "missing",
            "last_reviewed": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "requirement_id_code": "CC2.1",
            "title": "Provides clear communication of objectives",
            "status": "partial",
            "evidence_status": "incomplete",
            "last_reviewed": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    return {
        "items": requirements,
        "total": len(requirements),
        "limit": limit,
        "offset": offset
    }
