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
    from datetime import datetime, timedelta
    import random

    dates = []
    scores = []
    
    # Generate mock data that looks realistic (trending downward slightly but with spikes)
    base_risk = 75
    
    for i in range(days):
        # Calculate date (going backwards from today)
        date = datetime.now() - timedelta(days=(days - 1 - i))
        dates.append(date.strftime("%Y-%m-%d"))
        
        # Calculate score
        day_factor = i * 0.5
        random_spike = random.uniform(0, 15) if random.random() > 0.8 else random.uniform(0, 5)
        score = max(0, min(100, round(base_risk - day_factor + random_spike)))
        scores.append(score)
        
    return {
        "dates": dates,
        "scores": scores
    }

@router.get("/attention")
async def get_attention_items(org_id: str):
    """Provides high-priority action items for the What Needs Attention widget."""
    return [
        {
            "id": "vuln-1",
            "type": "critical_vuln",
            "title": "Zero-Day in Production Firewall",
            "description": "CVE-2026-1045 detected on 3 edge nodes. Immediate patching required.",
            "timeAgo": "2 hours ago",
            "isUrgent": True,
        },
        {
            "id": "threat-1",
            "type": "threat_intel",
            "title": "New Phishing Campaign Targeting Executives",
            "description": "C2 infrastructure identified matching current threat actor profile.",
            "timeAgo": "5 hours ago",
            "isUrgent": True,
        },
        {
            "id": "comp-1",
            "type": "compliance_gap",
            "title": "SOC 2 Type II Evidence Required",
            "description": "Quarterly access reviews are past due for 4 departments.",
            "timeAgo": "1 day ago",
            "isUrgent": False,
        },
        {
            "id": "pol-1",
            "type": "expiring_policy",
            "title": "Cloud IAM Policy Review",
            "description": "Overly permissive service account keys detected in GCP.",
            "timeAgo": "2 days ago",
            "isUrgent": False,
        }
    ]
