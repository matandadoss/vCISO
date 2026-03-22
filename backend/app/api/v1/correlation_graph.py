from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional, Dict, Any
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends
from app.db.session import get_db
from sqlalchemy import select, delete
from app.models.domain import ComplianceFramework, Finding, Severity, FindingStatus, FindingType, WorkflowName
import datetime
from pydantic import BaseModel

router = APIRouter(prefix="/correlation", tags=["correlation"])

class RecalculateRequest(BaseModel):
    infra: List[Dict[str, Any]]
    tech: List[Dict[str, Any]]
    tools: List[Dict[str, Any]]

@router.post("/recalculate")
async def recalculate_correlation(
    request: RecalculateRequest,
    org_id: str = "default",
    db: AsyncSession = Depends(get_db)
):
    try:
        org_uuid = uuid.UUID(org_id)
    except ValueError:
        org_uuid = uuid.UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6")
    
    await db.execute(delete(Finding).where(Finding.org_id == org_uuid))
    
    infra_names = [i.get("name", "").lower() for i in request.infra]
    tech_names = [t.get("name", "").lower() for t in request.tech]
    tool_names = [t.get("name", "").lower() for t in request.tools]
    
    new_findings = []
    
    if any("aws" in i or "ec2" in i or "s3" in i or "lambda" in i for i in infra_names):
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.misconfiguration,
            title="AWS S3 Bucket Publicly Accessible",
            description="A critical AWS storage bucket containing PII has public read access enabled via its bucket policy.",
            severity=Severity.critical,
            risk_score=9.5,
            source_workflow=WorkflowName.infrastructure,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
    
    if any("azure" in i or "gcp" in i or "google" in i for i in infra_names):
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.credential_exposure,
            title="Leaked Cloud Service Account Keys",
            description="Service account keys with Editor permissions were discovered in a public GitHub repository.",
            severity=Severity.critical,
            risk_score=9.8,
            source_workflow=WorkflowName.osint,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
        
    if any("react" in t or "node" in t for t in tech_names):
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.supply_chain_risk,
            title="Malicious NPM Package Installed in React App",
            description="The frontend build process references an actively exploited typo-squatted npm package.",
            severity=Severity.high,
            risk_score=8.1,
            source_workflow=WorkflowName.supply_chain,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
        
    if any("python" in t or "fastapi" in t for t in tech_names):
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.vulnerability,
            title="Vulnerable Python Dependency (PyYAML)",
            description="A critical PyYAML CVE allows arbitrary code execution in the Python backend.",
            severity=Severity.high,
            risk_score=7.9,
            source_workflow=WorkflowName.vulnerability,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
    
    if not any("crowdstrike" in t or "sentinelone" in t or "datadog" in t for t in tool_names):
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.control_gap,
            title="Missing EDR Coverage",
            description="Critical production instances do not have an active Endpoint Detection and Response agent installed.",
            severity=Severity.high,
            risk_score=7.5,
            source_workflow=WorkflowName.controls,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
        
    if not new_findings:
        new_findings.append(Finding(
            id=uuid.uuid4(),
            org_id=org_uuid,
            finding_type=FindingType.vulnerability,
            title="Unauthenticated RCE Detected",
            description="An unknown unauthenticated remote code execution vulnerability was discovered on edge networks.",
            severity=Severity.critical,
            risk_score=10.0,
            source_workflow=WorkflowName.vulnerability,
            status=FindingStatus.new,
            detected_at=datetime.datetime.utcnow()
        ))
        
    for f in new_findings:
        db.add(f)
        
    await db.commit()
    return {"status": "success", "regenerated_count": len(new_findings)}


@router.get("/engine", response_model=Dict[str, Any])
async def get_correlation_engine_insights(
    org_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Returns mock AI Correlation Engine data combining multiple workflows into unified risk insights.
    """
    
    correlations = [
         {
            "id": "corr-1",
            "source_type": "Supply Chain + Dark Web + Vuln",
            "source_name": "Supply Chain Cascade",
            "published_date": "2026-03-15",
            "external_signal": "Multiple indicators signal an active breach at CoreAxis your primary payment processor. Their credentials have appeared in fresh Dark Web logs from the Redline Stealer. Concurrently, CoreAxis utilizes an unpatched version of a payment module (CVE-2026-1044) that is actively being exploited for initial access.",
            "target_type": "Payment processing",
            "target_name": "CoreAxis Payments",
            "tier": "Tier-1",
            "correlation_confidence": "Critical",
            "severity_tag": "CRITICAL",
            "severity_bg": "var(--semantic-critical-soft)",
            "severity_color": "var(--semantic-critical-text)",
            "impact_summary": "Vendor breach detected + inherited SBOM vulns = compound exposure to customer payment data.",
            "recommended_action": "Temporarily reroute payment processing to backup provider and trigger emergency incident response protocol with CoreAxis.",
            "timeframe_label": "Active Exploit",
            "progress_color": "#ef4444",
            "progress_percent": 95,
            "footer_stats": ["3 distinct data sources", "98% AI Confidence", "Risk Score: 92/100"]
         },
         {
            "id": "corr-2",
            "source_type": "Vuln + Infra + Controls",
            "source_name": "Exploit Path Detection",
            "published_date": "2026-03-15",
            "external_signal": "A critical remote code execution vulnerability (CVE-2026-0992) exists on 4 public-facing instances in your AWS eu-west-2 region. Correlation analysis confirms these instances are NOT covered by your Cloudflare WAF policies and lack CrowdStrike Falcon active prevention modules.",
            "target_type": "Infrastructure (AWS)",
            "target_name": "API Gateway cluster",
            "tier": "Tier-1",
            "correlation_confidence": "High",
            "severity_tag": "HIGH",
            "severity_bg": "var(--semantic-warning-soft)",
            "severity_color": "var(--semantic-warning-text)",
            "impact_summary": "Vuln on public asset + no WAF/EDR coverage = unmitigated active exploit path.",
            "recommended_action": "Immediately deploy WAF virtual patching rules and isolate the affected instances until patched.",
            "timeframe_label": "Remediate < 24h",
            "progress_color": "#eab308",
            "progress_percent": 75,
            "footer_stats": ["CVE-2026-0992", "WAF evasion path", "Risk Score: 81/100"]
         },
         {
            "id": "corr-3",
            "source_type": "Dark Web + OSINT + IAM",
            "source_name": "Credential Access Chain",
            "published_date": "2026-03-14",
            "external_signal": "A fresh credential combo list on XSS.is contains valid credentials for a Senior DevOps Engineer. Correlation with IAM posture reveals this identity has 'AdministratorAccess' to production AWS accounts, and MFA is currently disabled for API access keys associated with the user.",
            "target_type": "Identity (AWS IAM)",
            "target_name": "DevOps Service Roots",
            "tier": "Tier-1",
            "correlation_confidence": "High",
            "severity_tag": "HIGH",
            "severity_bg": "var(--semantic-warning-soft)",
            "severity_color": "var(--semantic-warning-text)",
            "impact_summary": "Leaked credential + admin access + no MFA = immediate risk of environment takeover.",
            "recommended_action": "Force password reset, rotate all associated AWS access keys, and enforce MFA on all API calls.",
            "timeframe_label": "Immediate",
            "progress_color": "#f97316",
            "progress_percent": 88,
            "footer_stats": ["Admin privileges", "MFA bypass config", "Risk Score: 85/100"]
         }
    ]
    
    return {
        "engine_metrics": {
            "active_patterns": 14,
            "evaluated_workflows": 9,
            "avg_control_effectiveness": "68%",
            "critical_risk_paths": 3
        },
        "correlations": correlations
    }

@router.get("/engine/{correlation_id}/graph", response_model=Dict[str, Any])
async def get_correlation_graph(
    correlation_id: str,
    org_id: str = "default",
    db: AsyncSession = Depends(get_db)
):
    """
    Returns the node and link structure for the interactive knowledge graph view.
    """
    if correlation_id == "corr-1":
        nodes = [
            {"id": "threat-1", "name": "Redline Stealer", "group": "threat", "val": 30},
            {"id": "data-1", "name": "Dark Web Logs", "group": "evidence", "val": 20},
            {"id": "identity-1", "name": "CoreAxis Credentials", "group": "identity", "val": 25},
            {"id": "vendor-1", "name": "CoreAxis Payments", "group": "vendor", "val": 40},
            {"id": "vuln-1", "name": "CVE-2026-1044", "group": "vuln", "val": 25},
            {"id": "asset-1", "name": "Payment Module", "group": "asset", "val": 35},
            {"id": "impact-1", "name": "Customer Data", "group": "impact", "val": 50}
        ]
        links = [
            {"source": "threat-1", "target": "data-1", "label": "exfiltrated via"},
            {"source": "data-1", "target": "identity-1", "label": "contains"},
            {"source": "identity-1", "target": "vendor-1", "label": "provides access to"},
            {"source": "vuln-1", "target": "asset-1", "label": "affects"},
            {"source": "vendor-1", "target": "asset-1", "label": "owns"},
            {"source": "asset-1", "target": "impact-1", "label": "exposes"}
        ]
    elif correlation_id == "corr-2":
        nodes = [
            {"id": "vuln-1", "name": "CVE-2026-0992 (RCE)", "group": "vuln", "val": 35},
            {"id": "asset-1", "name": "AWS eu-west-2 Instances", "group": "asset", "val": 45},
            {"id": "control-1", "name": "Cloudflare WAF (Bypassed)", "group": "control_failed", "val": 20},
            {"id": "control-2", "name": "CrowdStrike Falcon (Missing)", "group": "control_failed", "val": 20},
            {"id": "impact-1", "name": "API Gateway Exfiltration", "group": "impact", "val": 50}
        ]
        links = [
            {"source": "vuln-1", "target": "asset-1", "label": "exists on"},
            {"source": "control-1", "target": "asset-1", "label": "fails to protect"},
            {"source": "control-2", "target": "asset-1", "label": "missing on"},
            {"source": "asset-1", "target": "impact-1", "label": "leads to"}
        ]
    elif correlation_id == "corr-3":
        nodes = [
            {"id": "data-1", "name": "XSS.is Combo List", "group": "evidence", "val": 25},
            {"id": "identity-1", "name": "DevOps Engineer Credentials", "group": "identity", "val": 30},
            {"id": "priv-1", "name": "AdministratorAccess", "group": "privilege", "val": 40},
            {"id": "control-1", "name": "MFA (Disabled)", "group": "control_failed", "val": 25},
            {"id": "asset-1", "name": "AWS Production Account", "group": "asset", "val": 50}
        ]
        links = [
            {"source": "data-1", "target": "identity-1", "label": "leaks"},
            {"source": "identity-1", "target": "priv-1", "label": "has"},
            {"source": "identity-1", "target": "control-1", "label": "lacks"},
            {"source": "priv-1", "target": "asset-1", "label": "grants full control over"}
        ]
    else:
        nodes = []
        links = []

    return {
        "nodes": nodes,
        "links": links
    }
