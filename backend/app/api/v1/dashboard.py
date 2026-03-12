from fastapi import APIRouter, Depends
from typing import Dict, Any

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
async def get_dashboard_summary(org_id: str):
    """Provides high level metrics for the vCISO dashboard."""
    return {
        "overall_risk_score": 78,
        "compliance_score": 65,
        "open_critical_findings": 12,
        "open_high_findings": 45,
        "threat_level": "Elevated",
        "active_campaigns_detected": 2,
        "ai_budget_used_pct": 45.5
    }

@router.get("/trends")
async def get_risk_trends(org_id: str, days: int = 30):
    """Provides historical risk score trends for charts."""
    return {
        "dates": ["2023-10-01", "2023-10-08", "2023-10-15", "2023-10-22"],
        "scores": [85, 82, 79, 78]
    }
