from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.models.domain import ServiceTier
from app.core.auth import require_role

router = APIRouter(tags=["Admin Tiers"])

@router.get("/", response_model=List[Dict[str, Any]])
async def get_service_tiers(
    admin_user: dict = Depends(require_role("admin"))
):
    """
    Returns the system's available subscription tiers and their configurations.
    Requires 'admin' role.
    """
    tiers = [
        { 
            "id": ServiceTier.basic.value, 
            "name": "Basic", 
            "description": "Essential manual risk assessment.",
            "monthlyPrice": 0, 
            "maxUsers": 5, 
            "features": ["Manual infrastructure diagramming", "Manual compliance tracking", "Weekly threat digests"],
            "popular": False,
            "color": '#9ca3af'
        },
        { 
            "id": ServiceTier.professional.value, 
            "name": "Professional", 
            "description": "Basic real-time visibility.",
            "monthlyPrice": 200, 
            "maxUsers": 25, 
            "features": ["Basic real-time cloud sync", "Standard What-If simulations", "Daily threat alerts"],
            "popular": False,
            "color": '#fbbf24'
        },
        { 
            "id": ServiceTier.enterprise.value, 
            "name": "Enterprise", 
            "description": "Advanced contextual analytics.",
            "monthlyPrice": 800, 
            "maxUsers": 100, 
            "features": ["Advanced real-time correlation", "Complex Hindsight simulations", "Automated compliance evidence"],
            "popular": True,
            "color": '#34d399'
        },
        { 
            "id": ServiceTier.elite.value, 
            "name": "Elite", 
            "description": "Full automated platform capabilities.",
            "monthlyPrice": 2500, 
            "maxUsers": 'Unlimited', 
            "features": ["Full real-time correlation graphs", "Automated AI remediation", "Continuous Red Teaming"],
            "popular": False,
            "color": '#60a5fa'
        }
    ]
    return tiers
