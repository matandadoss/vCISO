from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional, Dict, Any
import uuid

router = APIRouter(prefix="/correlation", tags=["correlation"])

@router.get("/graph", response_model=Dict[str, Any])
async def get_correlation_graph(
    org_id: str,
    focus_node_id: Optional[str] = None,
    depth: int = 2
):
    """
    Returns mock graph data for demonstrating correlation between assets,
    vulnerabilities, threat actors, and compliance controls.
    """
    
    nodes = [
        # Assets
        {"id": "asset-1", "label": "prod-db-main", "group": "Asset", "criticality": "high"},
        {"id": "asset-2", "label": "frontend-gateway", "group": "Asset", "criticality": "medium"},
        {"id": "asset-3", "label": "auth-service", "group": "Asset", "criticality": "high"},
        
        # Vulnerabilities
        {"id": "vuln-1", "label": "CVE-2023-1234 (RCE)", "group": "Vulnerability", "severity": "critical"},
        {"id": "vuln-2", "label": "Misconfigured S3", "group": "Vulnerability", "severity": "high"},
        
        # Threat Actors / Indicators
        {"id": "threat-1", "label": "FIN7", "group": "ThreatActor", "sophistication": "advanced"},
        {"id": "threat-2", "label": "198.51.100.42", "group": "Indicator", "type": "IP"},
        
        # Controls / Compliance
        {"id": "control-1", "label": "WAF Ruleset", "group": "Control", "status": "partial"},
        {"id": "control-2", "label": "MFA Enforced", "group": "Control", "status": "compliant"}
    ]
    
    links = [
        {"source": "vuln-1", "target": "asset-1", "label": "Affects"},
        {"source": "vuln-2", "target": "asset-2", "label": "Affects"},
        {"source": "threat-1", "target": "vuln-1", "label": "Exploits"},
        {"source": "threat-2", "target": "asset-2", "label": "Observed Communicating"},
        {"source": "threat-1", "target": "threat-2", "label": "Owns Infrastructure"},
        {"source": "control-1", "target": "asset-2", "label": "Protects"},
        {"source": "control-2", "target": "asset-3", "label": "Protects"},
        {"source": "asset-2", "target": "asset-1", "label": "Network Path (Allowed)"},
        {"source": "asset-3", "target": "asset-1", "label": "Authenticates To"}
    ]
    
    # Optional logic to filter graph based on a specific focus_node_id and depth
    # In this mock, we simply return the whole subset defined above for visual impact.
    
    return {
        "nodes": nodes,
        "links": links
    }
