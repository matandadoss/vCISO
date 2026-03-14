from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional, Dict, Any
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from app.db.session import get_db
from sqlalchemy import select
from app.models.domain import ComplianceFramework

router = APIRouter(prefix="/correlation", tags=["correlation"])

@router.get("/graph", response_model=Dict[str, Any])
async def get_correlation_graph(
    org_id: str,
    focus_node_id: Optional[str] = None,
    depth: int = 2,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns mock graph data for demonstrating correlation between assets,
    vulnerabilities, threat actors, and dynamic compliance controls.
    """
    
    nodes = [
        # Assets
        {"id": "asset-1", "label": "prod-db-main", "group": "Asset", "criticality": "high", "is_attack_path": True},
        {"id": "asset-2", "label": "frontend-gateway", "group": "Asset", "criticality": "medium", "is_attack_path": True},
        {"id": "asset-3", "label": "auth-service", "group": "Asset", "criticality": "high", "is_attack_path": False},
        
        # Vulnerabilities
        {"id": "vuln-1", "label": "CVE-2023-1234 (RCE)", "group": "Vulnerability", "severity": "critical", "is_attack_path": True},
        {"id": "vuln-2", "label": "Misconfigured S3", "group": "Vulnerability", "severity": "high", "is_attack_path": False},
        
        # Threat Actors / Indicators
        {"id": "threat-1", "label": "FIN7", "group": "ThreatActor", "sophistication": "advanced"},
        {"id": "threat-2", "label": "198.51.100.42", "group": "Indicator", "type": "IP"},
    ]
    
    try:
        org_uuid = uuid.UUID(org_id)
    except:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
        
    fw_res = await db.execute(select(ComplianceFramework).where(ComplianceFramework.org_id == org_uuid))
    frameworks = fw_res.scalars().all()
    
    control_nodes = []
    if frameworks:
        for idx, fw in enumerate(frameworks):
            # mock failing or compliant controls based on their names
            status = "compliant" if fw.overall_compliance_pct >= 90 else "partial"
            control_nodes.append({
                "id": f"control-{idx+1}", 
                "label": f"{fw.framework_name} Standard", 
                "group": "Control", 
                "status": status
            })
    else:
        # fallback
        control_nodes = [
            {"id": "control-1", "label": "WAF Ruleset", "group": "Control", "status": "partial"},
            {"id": "control-2", "label": "MFA Enforced", "group": "Control", "status": "compliant"}
        ]
        
    nodes.extend(control_nodes)
    
    links = [
        {"source": "vuln-1", "target": "asset-1", "label": "Affects", "is_attack_path": True},
        {"source": "vuln-2", "target": "asset-2", "label": "Affects", "is_attack_path": False},
        {"source": "threat-1", "target": "vuln-1", "label": "Exploits", "is_attack_path": True},
        {"source": "threat-2", "target": "asset-2", "label": "Observed Communicating", "is_attack_path": True},
        {"source": "threat-1", "target": "threat-2", "label": "Owns Infrastructure", "is_attack_path": True},
        {"source": "control-1", "target": "asset-2", "label": "Protects", "is_attack_path": False},
        {"source": "control-2", "target": "asset-3", "label": "Protects", "is_attack_path": False},
        {"source": "asset-2", "target": "asset-1", "label": "Network Path (Allowed)", "is_attack_path": True},
        {"source": "asset-3", "target": "asset-1", "label": "Authenticates To", "is_attack_path": False}
    ]
    
    ai_analysis = (
        "**Critical Attack Path Identified:** Threat actor FIN7 (threat-1) controls infrastructure at 198.51.100.42 (threat-2), "
        "which has been observed communicating with your frontend-gateway (asset-2). Because the frontend-gateway has an allowed "
        "network path to your prod-db-main (asset-1), and prod-db-main is vulnerable to CVE-2023-1234 (vuln-1) which FIN7 is known to exploit, "
        "there is a direct path to critical data compromise. **Recommendation:** Immediately patch CVE-2023-1234 on prod-db-main and restrict "
        "traffic from the frontend-gateway to only essential ports."
    )
    
    # Optional logic to filter graph based on a specific focus_node_id and depth
    # In this mock, we simply return the whole subset defined above for visual impact.
    
    return {
        "nodes": nodes,
        "links": links,
        "ai_analysis": ai_analysis
    }
