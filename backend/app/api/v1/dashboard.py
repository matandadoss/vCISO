from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.core.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
async def get_dashboard_summary(org_id: str, current_user: dict = Depends(get_current_user)):
    """Provides high level metrics for the vCISO dashboard."""
    if str(org_id) != str(current_user.get("org_id")):
        raise HTTPException(status_code=403, detail="Unauthorized")
    return {
        "overall_risk_score": 78,
        "industry_average": 62,
        "risk_band": "needs_improvement", # excellent, good, needs_improvement, critical
        "compliance_score": 65,
        "open_critical_findings": 12,
        "open_high_findings": 45,
        "threat_level": "Elevated",
        "active_campaigns_detected": 2,
        "ai_budget_used_pct": 45.5
    }

@router.get("/trends")
async def get_risk_trends(org_id: str, days: int = 30, current_user: dict = Depends(get_current_user)):
    """Provides historical risk score trends for charts."""
    if str(org_id) != str(current_user.get("org_id")):
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    from datetime import datetime, timedelta
    import secrets

    dates = []
    scores = []
    
    # Generate mock data that looks realistic (trending downward slightly but with spikes)
    base_risk = 75
    secure_rand = secrets.SystemRandom()
    
    for i in range(days):
        # Calculate date (going backwards from today)
        date = datetime.now() - timedelta(days=(days - 1 - i))
        dates.append(date.strftime("%Y-%m-%d"))
        
        # Calculate score
        day_factor = i * 0.5
        random_spike = secure_rand.uniform(0, 15) if secure_rand.random() > 0.8 else secure_rand.uniform(0, 5)
        score = max(0, min(100, round(base_risk - day_factor + random_spike)))
        scores.append(score)
        
    return {
        "dates": dates,
        "scores": scores
    }

@router.get("/attention")
async def get_attention_items(org_id: str, current_user: dict = Depends(get_current_user)):
    """Provides high-priority action items for the What Needs Attention widget, prioritized by time sensitivity."""
    if str(org_id) != str(current_user.get("org_id")):
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    items = [
        {
            "id": "vuln-critical-1",
            "type": "critical_vuln",
            "title": "New Critical Finding: Unauthenticated RCE",
            "description": "CVE-2023-44487 (HTTP/2 Rapid Reset) detected on public-facing ingress controllers.",
            "timeAgo": "1 hour ago",
            "isUrgent": True,
            "severity": "high", # For sorting
        },
        {
            "id": "comp-overdue-1",
            "type": "compliance_gap",
            "title": "Overdue Control: IAM Access Review",
            "description": "Quarterly access reviews for 'Production GKE Admins' are 3 days past due.",
            "timeAgo": "3 days overdue",
            "isUrgent": True,
            "severity": "high",
        },
        {
            "id": "threat-ioc-1",
            "type": "threat_intel",
            "title": "Expiring IoC: Malicious IPs List",
            "description": "Custom blocklist for 'Scattered Spider' IPs expires in 12 hours.",
            "timeAgo": "Expires in 12h",
            "isUrgent": True,
            "severity": "medium",
        },
        {
            "id": "comp-upcoming-1",
            "type": "compliance_gap",
            "title": "Upcoming: SOC 2 Evidence Collection",
            "description": "Automated evidence collection for CC6.1 failing. Due in 5 days.",
            "timeAgo": "Due 5 days",
            "isUrgent": False,
            "severity": "low",
        }
    ]
    
    # Sort by urgency (True first) then by severity (high > medium > low)
    severity_rank = {"high": 1, "medium": 2, "low": 3}
    items.sort(key=lambda x: (not x["isUrgent"], severity_rank.get(x.get("severity", "low"), 4)))
    
    return items
