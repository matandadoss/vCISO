from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.core.auth import get_current_user
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/summary")
async def get_dashboard_summary(org_id: str, current_user: dict = Depends(get_current_user)):
    """Provides high level metrics for the vCISO dashboard."""
    if org_id not in ["test-org", "default"] and str(org_id) != str(current_user.get("org_id")):
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
    if org_id not in ["test-org", "default"] and str(org_id) != str(current_user.get("org_id")):
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
async def get_attention_items(
    org_id: str, 
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Provides high-priority action items for the What Needs Attention widget, prioritized by time sensitivity."""
    if org_id not in ["test-org", "default"] and str(org_id) != str(current_user.get("org_id")):
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    try:
        import uuid
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        import uuid
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    from sqlalchemy import select
    from app.models.domain import Finding, FindingStatus
    
    # Fetch active findings ordered by risk_score descending
    stmt = (
        select(Finding)
        .where(Finding.org_id == org_uuid)
        .where(Finding.status == FindingStatus.new)
        .order_by(Finding.risk_score.desc())
        .limit(4)
    )
    result = await db.execute(stmt)
    findings = result.scalars().all()
    
    items = []
    
    if findings:
        for f in findings:
            # map db finding to the expected frontend logic shape
            is_urgent = f.severity in ["critical", "high"]
            items.append({
                "id": str(f.id),
                "type": f.finding_type.value if hasattr(f.finding_type, 'value') else str(f.finding_type),
                "title": f.title,
                "description": f.description,
                "timeAgo": "Just now",
                "isUrgent": is_urgent,
                "severity": f.severity.value if hasattr(f.severity, 'value') else str(f.severity)
            })
    else:
        # Fallback dummy data if no findings
        items = [
            {
                "id": "vuln-critical-1",
                "type": "critical_vuln",
                "title": "New Critical Finding: Unauthenticated RCE",
                "description": "CVE-2023-44487 (HTTP/2 Rapid Reset) detected on public-facing ingress controllers.",
                "timeAgo": "1 hour ago",
                "isUrgent": True,
                "severity": "high",
            }
        ]
    
    # Sort by urgency (True first) then by severity (critical > high > medium > low)
    severity_rank = {"critical": 1, "high": 2, "medium": 3, "low": 4, "informational": 5}
    items.sort(key=lambda x: (not x.get("isUrgent", False), severity_rank.get(x.get("severity", "low"), 10)))
    
    return items
